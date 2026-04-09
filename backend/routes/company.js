const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const multer = require("multer");
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");
const { uploadMediaBuffer } = require("../services/cloudinary");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

async function ensureCompanyProfileStorage() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyProfile" (
      "id" TEXT NOT NULL,
      "yearsInBusiness" INTEGER NOT NULL,
      "carsSold" INTEGER NOT NULL,
      "happyCustomers" INTEGER NOT NULL,
      "citiesServed" INTEGER NOT NULL,
      "team" JSONB[] NOT NULL DEFAULT ARRAY[]::JSONB[],
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(
    "ALTER TABLE \"CompanyProfile\" ADD COLUMN IF NOT EXISTS \"heroSlides\" JSONB NOT NULL DEFAULT '[]'::JSONB"
  );
}

async function getLatestCompanyProfileRow() {
  await ensureCompanyProfileStorage();

  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      "id",
      "yearsInBusiness",
      "carsSold",
      "happyCustomers",
      "citiesServed",
      "team",
      "heroSlides",
      "updatedAt"
    FROM "CompanyProfile"
    ORDER BY "updatedAt" DESC NULLS LAST
    LIMIT 1
  `);

  return rows?.[0] || null;
}

async function ensureCompanyProfileRecord() {
  let row = await getLatestCompanyProfileRow();

  if (row) return row;

  const id = randomUUID();

  await prisma.$executeRawUnsafe(`
    INSERT INTO "CompanyProfile"
      ("id", "yearsInBusiness", "carsSold", "happyCustomers", "citiesServed", "team", "heroSlides", "updatedAt")
    VALUES
      ('${id}', 8, 1200, 900, 12, ARRAY[]::JSONB[], '[]'::JSONB, CURRENT_TIMESTAMP)
  `);

  row = await getLatestCompanyProfileRow();

  return row;
}

function normalizeHeroSlides(rawSlides) {
  if (!Array.isArray(rawSlides)) return [];

  return rawSlides
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const id = typeof item.id === "string" && item.id ? item.id : randomUUID();
      const url = typeof item.url === "string" ? item.url : "";
      const mediaType = item.mediaType === "video" ? "video" : "image";
      const title = typeof item.title === "string" ? item.title : "";
      const subtitle = typeof item.subtitle === "string" ? item.subtitle : "";

      if (!url) return null;

      return {
        id,
        url,
        mediaType,
        title,
        subtitle,
      };
    })
    .filter(Boolean);
}

async function persistHeroSlides(profileId, slides) {
  const payload = JSON.stringify(normalizeHeroSlides(slides));

  try {
    await ensureCompanyProfileStorage();

    await prisma.$executeRaw`
      UPDATE "CompanyProfile"
      SET "heroSlides" = CAST(${payload} AS JSONB)
      WHERE "id" = ${profileId}
    `;
  } catch (error) {
    if (error?.code === "42P01" || error?.code === "42703") {
      await ensureCompanyProfileStorage();

      await prisma.$executeRaw`
        UPDATE "CompanyProfile"
        SET "heroSlides" = CAST(${payload} AS JSONB)
        WHERE "id" = ${profileId}
      `;
    } else {
      throw error;
    }
  }

  const rows = await prisma.$queryRaw`
    SELECT "heroSlides"
    FROM "CompanyProfile"
    WHERE "id" = ${profileId}
    LIMIT 1
  `;

  return normalizeHeroSlides(rows?.[0]?.heroSlides);
}

async function readHeroSlides(profileId) {
  let rows;

  try {
    await ensureCompanyProfileStorage();

    rows = await prisma.$queryRaw`
      SELECT "heroSlides"
      FROM "CompanyProfile"
      WHERE "id" = ${profileId}
      LIMIT 1
    `;
  } catch (error) {
    if (error?.code === "42P01" || error?.code === "42703") {
      await ensureCompanyProfileStorage();

      rows = await prisma.$queryRaw`
        SELECT "heroSlides"
        FROM "CompanyProfile"
        WHERE "id" = ${profileId}
        LIMIT 1
      `;
    } else {
      throw error;
    }
  }

  return normalizeHeroSlides(rows?.[0]?.heroSlides);
}

// GET /api/company - get company profile [PUBLIC]
router.get("/", async (req, res) => {
  try {
    const profile = await ensureCompanyProfileRecord();

    if (!profile) {
      return res.json({
        yearsInBusiness: 8,
        carsSold: 1200,
        happyCustomers: 900,
        citiesServed: 12,
        team: [],
        heroSlides: [],
      });
    }

    res.json({
      id: profile.id,
      yearsInBusiness: Number(profile.yearsInBusiness ?? 8),
      carsSold: Number(profile.carsSold ?? 1200),
      happyCustomers: Number(profile.happyCustomers ?? 900),
      citiesServed: Number(profile.citiesServed ?? 12),
      team: Array.isArray(profile.team) ? profile.team : [],
      heroSlides: normalizeHeroSlides(profile.heroSlides),
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error("Get company profile error:", error);
    res.status(500).json({ error: "Failed to fetch company profile" });
  }
});

// PATCH /api/admin/company - update company profile [admin only]
router.patch("/admin", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { yearsInBusiness, carsSold, happyCustomers, citiesServed, team, heroSlides } = req.body;

    const profile = await ensureCompanyProfileRecord();

    if (!profile) {
      return res.status(500).json({ error: "Failed to initialize company profile" });
    }

    await prisma.companyProfile.update({
      where: { id: profile.id },
      data: {
        ...(yearsInBusiness !== undefined && { yearsInBusiness: Number(yearsInBusiness) }),
        ...(carsSold !== undefined && { carsSold: Number(carsSold) }),
        ...(happyCustomers !== undefined && { happyCustomers: Number(happyCustomers) }),
        ...(citiesServed !== undefined && { citiesServed: Number(citiesServed) }),
        ...(Array.isArray(team) && { team }),
      },
    });

    let currentSlides = await readHeroSlides(profile.id);

    if (Array.isArray(heroSlides)) {
      currentSlides = await persistHeroSlides(profile.id, heroSlides);
    }

    res.json({
      ...(await getLatestCompanyProfileRow()),
      heroSlides: currentSlides,
    });
  } catch (error) {
    console.error("Update company profile error:", error);
    res.status(500).json({ error: "Failed to update company profile" });
  }
});

// POST /api/company/admin/hero-slides - upload image/video slides [admin only]
router.post(
  "/admin/hero-slides",
  authMiddleware,
  roleCheck(["admin"]),
  upload.array("media", 12),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one media file is required" });
      }

      const profile = await ensureCompanyProfileRecord();

      if (!profile) {
        return res.status(500).json({ error: "Failed to initialize company profile" });
      }

      const uploadedSlides = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadMediaBuffer(file.buffer, {
            folder: "car-company/home-carousel",
            resourceType: "auto",
          });

          const mediaType = result.resource_type === "video" ? "video" : "image";

          return {
            id: randomUUID(),
            url: result.secure_url,
            mediaType,
            title: "",
            subtitle: "",
          };
        })
      );

      const existingSlides = await readHeroSlides(profile.id);
      const nextSlides = [...uploadedSlides, ...existingSlides].slice(0, 20);

      const savedSlides = await persistHeroSlides(profile.id, nextSlides);

      res.json({ heroSlides: savedSlides });
    } catch (error) {
      console.error("Upload hero slides error:", error);
      res.status(500).json({ error: "Failed to upload hero slides" });
    }
  }
);

// PATCH /api/company/admin/hero-slides - replace ordered slides [admin only]
router.patch("/admin/hero-slides", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { heroSlides } = req.body;

    if (!Array.isArray(heroSlides)) {
      return res.status(400).json({ error: "heroSlides must be an array" });
    }

    const profile = await ensureCompanyProfileRecord();

    if (!profile) {
      return res.status(500).json({ error: "Failed to initialize company profile" });
    }

    const normalizedSlides = normalizeHeroSlides(heroSlides).slice(0, 20);

    const savedSlides = await persistHeroSlides(profile.id, normalizedSlides);

    res.json({ heroSlides: savedSlides });
  } catch (error) {
    console.error("Update hero slides error:", error);
    res.status(500).json({ error: "Failed to update hero slides" });
  }
});

module.exports = router;
