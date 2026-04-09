const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");
const { uploadMediaBuffer } = require("../services/cloudinary");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

function getDefaultCompanySettings() {
  return {
    finance: {
      defaultPrice: 45000000,
      defaultDownPayment: 9000000,
      defaultMonths: 36,
      defaultAnnualRate: 22,
      disclaimer: "Use this to compare financing scenarios before you reach out to the sales team.",
    },
    contact: {
      phone: "+234 801 234 5678",
      email: "info@sarkinmotaautos.com",
      address: "Central Area, Abuja",
      hours: "Mon-Sat, 9:00AM - 6:00PM",
      whatsappNumber: "09133225255",
      whatsappMessage: "Hi, I would like to ask about your available cars.",
      mapEmbedUrl: "https://maps.google.com/maps?q=Abuja%20Nigeria&t=&z=13&ie=UTF8&iwloc=&output=embed",
    },
    homepage: {
      trustCards: [
        { label: "Years in Business", value: "8+" },
        { label: "Cars Sold", value: "1,200+" },
        { label: "Verified Listings", value: "100%" },
        { label: "After-Sales Support", value: "Dedicated" },
      ],
      testimonials: [
        {
          name: "Mariam S.",
          text: "The team gave me full service history before I paid. The process was transparent and fast.",
        },
        {
          name: "Tunde A.",
          text: "I got a clean Toyota in two days, and the after-sales support has been excellent.",
        },
        {
          name: "Ngozi O.",
          text: "They helped me compare options within my budget and arranged a smooth test drive.",
        },
      ],
    },
    social: {
      x: "https://x.com/SarkinMota_AMF",
      youtube: "https://www.youtube.com/@SarkinMota-24",
      facebook: "https://www.facebook.com/profile.php?id=61586026326682",
      tiktok: "https://www.tiktok.com/@alamin_sarkinmota",
      instagram: "https://www.instagram.com/p/DWpTtVQjYUS/",
    },
  };
}

function normalizeCompanySettings(rawSettings) {
  const defaults = getDefaultCompanySettings();

  if (!rawSettings || typeof rawSettings !== "object") {
    return defaults;
  }

  const source = rawSettings;
  const financeSource = source.finance && typeof source.finance === "object" ? source.finance : {};
  const contactSource = source.contact && typeof source.contact === "object" ? source.contact : {};
  const homepageSource = source.homepage && typeof source.homepage === "object" ? source.homepage : {};
  const socialSource = source.social && typeof source.social === "object" ? source.social : {};

  const trustCards = Array.isArray(homepageSource.trustCards)
    ? homepageSource.trustCards
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const label = typeof item.label === "string" ? item.label.trim() : "";
          const value = typeof item.value === "string" ? item.value.trim() : "";
          if (!label || !value) return null;
          return { label, value };
        })
        .filter(Boolean)
    : defaults.homepage.trustCards;

  const testimonials = Array.isArray(homepageSource.testimonials)
    ? homepageSource.testimonials
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const name = typeof item.name === "string" ? item.name.trim() : "";
          const text = typeof item.text === "string" ? item.text.trim() : "";
          if (!name || !text) return null;
          return { name, text };
        })
        .filter(Boolean)
    : defaults.homepage.testimonials;

  return {
    finance: {
      defaultPrice: Number(financeSource.defaultPrice ?? defaults.finance.defaultPrice),
      defaultDownPayment: Number(financeSource.defaultDownPayment ?? defaults.finance.defaultDownPayment),
      defaultMonths: Number(financeSource.defaultMonths ?? defaults.finance.defaultMonths),
      defaultAnnualRate: Number(financeSource.defaultAnnualRate ?? defaults.finance.defaultAnnualRate),
      disclaimer:
        typeof financeSource.disclaimer === "string" && financeSource.disclaimer.trim()
          ? financeSource.disclaimer.trim()
          : defaults.finance.disclaimer,
    },
    contact: {
      phone:
        typeof contactSource.phone === "string" && contactSource.phone.trim()
          ? contactSource.phone.trim()
          : defaults.contact.phone,
      email:
        typeof contactSource.email === "string" && contactSource.email.trim()
          ? contactSource.email.trim()
          : defaults.contact.email,
      address:
        typeof contactSource.address === "string" && contactSource.address.trim()
          ? contactSource.address.trim()
          : defaults.contact.address,
      hours:
        typeof contactSource.hours === "string" && contactSource.hours.trim()
          ? contactSource.hours.trim()
          : defaults.contact.hours,
      whatsappNumber:
        typeof contactSource.whatsappNumber === "string" && contactSource.whatsappNumber.trim()
          ? contactSource.whatsappNumber.trim()
          : defaults.contact.whatsappNumber,
      whatsappMessage:
        typeof contactSource.whatsappMessage === "string" && contactSource.whatsappMessage.trim()
          ? contactSource.whatsappMessage.trim()
          : defaults.contact.whatsappMessage,
      mapEmbedUrl:
        typeof contactSource.mapEmbedUrl === "string" && contactSource.mapEmbedUrl.trim()
          ? contactSource.mapEmbedUrl.trim()
          : defaults.contact.mapEmbedUrl,
    },
    homepage: {
      trustCards,
      testimonials,
    },
    social: {
      x:
        typeof socialSource.x === "string" && socialSource.x.trim()
          ? socialSource.x.trim()
          : defaults.social.x,
      youtube:
        typeof socialSource.youtube === "string" && socialSource.youtube.trim()
          ? socialSource.youtube.trim()
          : defaults.social.youtube,
      facebook:
        typeof socialSource.facebook === "string" && socialSource.facebook.trim()
          ? socialSource.facebook.trim()
          : defaults.social.facebook,
      tiktok:
        typeof socialSource.tiktok === "string" && socialSource.tiktok.trim()
          ? socialSource.tiktok.trim()
          : defaults.social.tiktok,
      instagram:
        typeof socialSource.instagram === "string" && socialSource.instagram.trim()
          ? socialSource.instagram.trim()
          : defaults.social.instagram,
    },
  };
}

async function ensureCompanyProfileStorage() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyProfile" (
      "id" TEXT NOT NULL,
      "yearsInBusiness" INTEGER NOT NULL,
      "carsSold" INTEGER NOT NULL,
      "happyCustomers" INTEGER NOT NULL,
      "citiesServed" INTEGER NOT NULL,
      "team" JSONB[] NOT NULL DEFAULT ARRAY[]::JSONB[],
      "settings" JSONB NOT NULL DEFAULT '{}'::JSONB,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(
    "ALTER TABLE \"CompanyProfile\" ADD COLUMN IF NOT EXISTS \"heroSlides\" JSONB NOT NULL DEFAULT '[]'::JSONB"
  );

  await prisma.$executeRawUnsafe(
    "ALTER TABLE \"CompanyProfile\" ADD COLUMN IF NOT EXISTS \"settings\" JSONB NOT NULL DEFAULT '{}'::JSONB"
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
      "settings",
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
      ("id", "yearsInBusiness", "carsSold", "happyCustomers", "citiesServed", "team", "settings", "heroSlides", "updatedAt")
    VALUES
      ('${id}', 8, 1200, 900, 12, ARRAY[]::JSONB[], '${JSON.stringify(getDefaultCompanySettings())}'::JSONB, '[]'::JSONB, CURRENT_TIMESTAMP)
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
      const description = typeof item.description === "string" ? item.description : "";

      if (!url) return null;

      return {
        id,
        url,
        mediaType,
        title,
        subtitle,
        ...(description && { description }),
      };
    })
    .filter(Boolean);
}

function normalizeHomeSlides(rawSlides) {
  return normalizeHeroSlides(rawSlides);
}

function resolveMediaExtension(file) {
  const fromName = path.extname(file.originalname || "").toLowerCase();
  if (fromName && /^[.][a-z0-9]+$/i.test(fromName)) {
    return fromName;
  }

  if (typeof file.mimetype === "string") {
    const mime = file.mimetype.toLowerCase();
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/png") return ".png";
    if (mime === "image/webp") return ".webp";
    if (mime === "image/gif") return ".gif";
    if (mime === "image/svg+xml") return ".svg";
    if (mime === "video/mp4") return ".mp4";
    if (mime === "video/webm") return ".webm";
    if (mime === "video/quicktime") return ".mov";
  }

  return ".bin";
}

async function saveHeroMediaLocally(file, req) {
  const uploadsDir = path.resolve(__dirname, "../uploads/home-carousel");
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${randomUUID()}${resolveMediaExtension(file)}`;
  const fullPath = path.join(uploadsDir, filename);
  await fs.writeFile(fullPath, file.buffer);

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const mediaType = typeof file.mimetype === "string" && file.mimetype.startsWith("video/")
    ? "video"
    : "image";

  return {
    secure_url: `${baseUrl}/uploads/home-carousel/${filename}`,
    resource_type: mediaType,
  };
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
        settings: getDefaultCompanySettings(),
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
      settings: normalizeCompanySettings(profile.settings),
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

// PATCH /api/company/admin/settings - update company settings [admin only]
router.patch("/admin/settings", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { settings } = req.body;

    const profile = await ensureCompanyProfileRecord();

    if (!profile) {
      return res.status(500).json({ error: "Failed to initialize company profile" });
    }

    const normalizedSettings = normalizeCompanySettings(settings);

    await prisma.$executeRaw`
      UPDATE "CompanyProfile"
      SET "settings" = CAST(${JSON.stringify(normalizedSettings)} AS JSONB)
      WHERE "id" = ${profile.id}
    `;

    const updatedProfile = await getLatestCompanyProfileRow();

    res.json({
      ...updatedProfile,
      settings: normalizeCompanySettings(updatedProfile?.settings),
    });
  } catch (error) {
    console.error("Update company settings error:", error);
    res.status(500).json({ error: "Failed to update company settings" });
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
          let result;

          try {
            result = await uploadMediaBuffer(file.buffer, {
              folder: "car-company/home-carousel",
              resourceType: "auto",
            });
          } catch (uploadError) {
            console.warn("Cloud upload failed for hero slide; using local fallback:", uploadError?.message || uploadError);
            result = await saveHeroMediaLocally(file, req);
          }

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
      res.status(500).json({ error: error?.message || "Failed to upload hero slides" });
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
