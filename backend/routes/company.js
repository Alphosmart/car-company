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

// GET /api/company - get company profile [PUBLIC]
router.get("/", async (req, res) => {
  try {
    let profile = await prisma.companyProfile.findFirst();

    if (!profile) {
      // Return default profile if none exists
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
      ...profile,
      heroSlides: normalizeHeroSlides(profile.heroSlides),
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

    let profile = await prisma.companyProfile.findFirst();
    const normalizedSlides = normalizeHeroSlides(heroSlides);

    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          yearsInBusiness: yearsInBusiness || 8,
          carsSold: carsSold || 1200,
          happyCustomers: happyCustomers || 900,
          citiesServed: citiesServed || 12,
          team: team || [],
          heroSlides: Array.isArray(heroSlides) ? normalizedSlides : [],
        },
      });
    } else {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: {
          ...(yearsInBusiness !== undefined && { yearsInBusiness }),
          ...(carsSold !== undefined && { carsSold }),
          ...(happyCustomers !== undefined && { happyCustomers }),
          ...(citiesServed !== undefined && { citiesServed }),
          ...(team && { team }),
          ...(Array.isArray(heroSlides) && { heroSlides: normalizedSlides }),
        },
      });
    }

    res.json({
      ...profile,
      heroSlides: normalizeHeroSlides(profile.heroSlides),
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

      let profile = await prisma.companyProfile.findFirst();

      if (!profile) {
        profile = await prisma.companyProfile.create({
          data: {
            yearsInBusiness: 8,
            carsSold: 1200,
            happyCustomers: 900,
            citiesServed: 12,
            team: [],
            heroSlides: [],
          },
        });
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

      const existingSlides = normalizeHeroSlides(profile.heroSlides);
      const nextSlides = [...uploadedSlides, ...existingSlides].slice(0, 20);

      const updated = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: { heroSlides: nextSlides },
      });

      res.json({ heroSlides: normalizeHeroSlides(updated.heroSlides) });
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

    let profile = await prisma.companyProfile.findFirst();

    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          yearsInBusiness: 8,
          carsSold: 1200,
          happyCustomers: 900,
          citiesServed: 12,
          team: [],
          heroSlides: [],
        },
      });
    }

    const normalizedSlides = normalizeHeroSlides(heroSlides).slice(0, 20);

    const updated = await prisma.companyProfile.update({
      where: { id: profile.id },
      data: { heroSlides: normalizedSlides },
    });

    res.json({ heroSlides: normalizeHeroSlides(updated.heroSlides) });
  } catch (error) {
    console.error("Update hero slides error:", error);
    res.status(500).json({ error: "Failed to update hero slides" });
  }
});

module.exports = router;
