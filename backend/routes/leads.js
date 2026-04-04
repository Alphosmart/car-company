const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");
const { getDateFilterFromRangeToken } = require("../lib/dateFilters");
const { sendSms } = require("../services/termii");

// GET /api/leads - get all leads with filters [admin only]
router.get("/", authMiddleware, roleCheck(["admin", "manager", "sales_rep"]), async (req, res) => {
  try {
    const { status, carId, staffId, dateRange, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (carId) where.carId = carId;
    if (staffId) where.staffId = staffId;

    const createdAtFilter = getDateFilterFromRangeToken(dateRange);
    if (createdAtFilter) where.createdAt = createdAtFilter;

    // Sales reps are restricted to leads assigned to them.
    if (req.staff.role === "sales_rep") {
      where.staffId = req.staff.staffId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          car: true,
          customer: true,
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// GET /api/leads/:id - get single lead [admin only]
router.get("/:id", authMiddleware, roleCheck(["admin", "manager", "sales_rep"]), async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        car: true,
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (req.staff.role === "sales_rep" && lead.staffId !== req.staff.staffId) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    res.json(lead);
  } catch (error) {
    console.error("Get lead error:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// POST /api/leads - create new lead [PUBLIC endpoint]
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, message, carId, source = "website", recaptchaToken } = req.body;

    // Accept referral code from body, query, or tracking cookie.
    const referralCode =
      req.body.referralCode || req.query.ref || req.cookies?.referralCode || null;

    if (!name || !phone || !carId) {
      return res.status(400).json({ error: "Name, phone, and carId are required" });
    }

    if (process.env.RECAPTCHA_SECRET_KEY && recaptchaToken) {
      const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        return res.status(400).json({ error: "reCAPTCHA verification failed" });
      }
    }

    // Check if car exists
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    // Check if customer exists or create new one
    let customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (!customer) {
      const referral = referralCode
        ? await prisma.referral.findUnique({ where: { code: referralCode } })
        : null;

      customer = await prisma.customer.create({
        data: {
          name,
          phone,
          email,
          referralCode: require("crypto").randomUUID(),
          referredBy: referral?.code || null,
        },
      });
    } else if ((email && !customer.email) || (referralCode && !customer.referredBy)) {
      // Backfill email/referral metadata on existing customer when missing.
      const referral = referralCode
        ? await prisma.referral.findUnique({ where: { code: referralCode } })
        : null;

      const updateData = {
        ...(email && !customer.email ? { email } : {}),
        ...(referral?.code && !customer.referredBy ? { referredBy: referral.code } : {}),
      };

      customer = await prisma.customer.update({
        where: { phone },
        data: updateData,
      });
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        message,
        referralCode,
        carId,
        source,
        customerId: customer.id,
        status: "new",
      },
      include: {
        car: true,
        customer: true,
      },
    });

    // Link referral activity if the code exists.
    if (referralCode) {
      const existingReferral = await prisma.referral.findUnique({
        where: { code: referralCode },
      });

      if (existingReferral && !existingReferral.referredId) {
        await prisma.referral.update({
          where: { code: referralCode },
          data: { referredId: customer.id },
        });
      }
    }

    const smsMessage = `New inquiry from ${name} for ${car.year} ${car.make} ${car.model}.`;

    Promise.allSettled([
      sendSms({ to: phone, message: "Thanks for contacting Sarkin Mota Autos. Our team will reach out shortly." }),
      sendSms({ to: process.env.TERMII_STAFF_PHONE || phone, message: smsMessage }),
    ]).catch(() => {});

    res.status(201).json(lead);
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// PATCH /api/leads/:id - update lead [admin only]
router.patch("/:id", authMiddleware, roleCheck(["admin", "manager", "sales_rep"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.staff.role === "sales_rep") {
      const existingLead = await prisma.lead.findUnique({
        where: { id },
        select: { id: true, staffId: true },
      });

      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      if (existingLead.staffId !== req.staff.staffId) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // Sales reps cannot reassign ownership through generic patch updates.
      delete updates.staffId;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updates,
      include: {
        car: true,
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(lead);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Lead not found" });
    }
    console.error("Update lead error:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// POST /api/leads/:id/assign - assign lead to staff [admin only]
router.post("/:id/assign", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({ error: "staffId required" });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { staffId },
      include: {
        car: true,
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(lead);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Lead not found" });
    }
    console.error("Assign lead error:", error);
    res.status(500).json({ error: "Failed to assign lead" });
  }
});

module.exports = router;
