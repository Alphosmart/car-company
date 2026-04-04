const express = require("express");
const router = express.Router();
const roleCheck = require("../middleware/roleCheck");
const authMiddleware = require("../middleware/auth");
const prisma = require("../lib/prisma");

// GET /api/referrals - all referrals with status [admin only]
router.get("/", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.referral.count(),
    ]);

    res.json({
      referrals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get referrals error:", error);
    res.status(500).json({ error: "Failed to fetch referrals" });
  }
});

// GET /api/referrals/track/:code - track referral (called on visit) [PUBLIC]
router.get("/track/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const referral = await prisma.referral.findUnique({
      where: { code },
    });

    if (!referral) {
      return res.status(404).json({ error: "Referral code not found" });
    }

    // Set cookie for 30-day referral attribution.
    res.cookie("referralCode", code, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ referral, message: "Referral tracked" });
  } catch (error) {
    console.error("Track referral error:", error);
    res.status(500).json({ error: "Failed to track referral" });
  }
});

// POST /api/referrals/convert - mark referral as converted [admin only]
router.post("/convert", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Referral code required" });
    }

    const referral = await prisma.referral.update({
      where: { code },
      data: { converted: true },
    });

    res.json(referral);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Referral not found" });
    }
    console.error("Convert referral error:", error);
    res.status(500).json({ error: "Failed to convert referral" });
  }
});

// PATCH /api/referrals/:id/reward - mark reward as paid [admin only]
router.patch("/:id/reward", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    const referral = await prisma.referral.update({
      where: { id },
      data: { rewardPaid: true },
    });

    res.json(referral);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Referral not found" });
    }
    console.error("Update reward error:", error);
    res.status(500).json({ error: "Failed to update reward" });
  }
});

module.exports = router;
