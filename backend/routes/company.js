const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");

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
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("Get company profile error:", error);
    res.status(500).json({ error: "Failed to fetch company profile" });
  }
});

// PATCH /api/admin/company - update company profile [admin only]
router.patch("/admin", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { yearsInBusiness, carsSold, happyCustomers, citiesServed, team } = req.body;

    let profile = await prisma.companyProfile.findFirst();

    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          yearsInBusiness: yearsInBusiness || 8,
          carsSold: carsSold || 1200,
          happyCustomers: happyCustomers || 900,
          citiesServed: citiesServed || 12,
          team: team || [],
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
        },
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("Update company profile error:", error);
    res.status(500).json({ error: "Failed to update company profile" });
  }
});

module.exports = router;
