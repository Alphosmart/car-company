const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");
const { sendSms } = require("../services/termii");

// GET /api/test-drives - get all test drives [admin only]
router.get("/", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const { status, carId, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (carId) where.carId = carId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [testDrives, total] = await Promise.all([
      prisma.testDrive.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.testDrive.count({ where }),
    ]);

    res.json({
      testDrives,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get test drives error:", error);
    res.status(500).json({ error: "Failed to fetch test drives" });
  }
});

// GET /api/test-drives/:id - get single test drive [admin only]
router.get("/:id", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const testDrive = await prisma.testDrive.findUnique({
      where: { id: req.params.id },
    });

    if (!testDrive) {
      return res.status(404).json({ error: "Test drive not found" });
    }

    res.json(testDrive);
  } catch (error) {
    console.error("Get test drive error:", error);
    res.status(500).json({ error: "Failed to fetch test drive" });
  }
});

// POST /api/test-drives - book a test drive [PUBLIC]
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, carId, preferredDate, message } = req.body;

    if (!name || !phone || !carId) {
      return res.status(400).json({ error: "Name, phone, and carId are required" });
    }

    // Check if car exists
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    // Check if customer exists or create new one
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          phone,
          email,
          referralCode: require("crypto").randomUUID(),
        },
      });
    }

    // Create test drive booking
    const testDrive = await prisma.testDrive.create({
      data: {
        name,
        phone,
        email,
        carId,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        customerId: customer.id,
        notes: message || null,
      },
    });

    // Send SMS to customer and staff
    const carLabel = `${car.year} ${car.make} ${car.model}`;
    const customerSms = `Thanks for booking a test drive for the ${carLabel}. Our team will contact you shortly.`;
    const staffSms = `New test drive booking: ${name} (${phone}) for ${carLabel}${preferredDate ? ` on ${preferredDate}` : "."}`;

    Promise.allSettled([
      sendSms({ to: phone, message: customerSms }),
      sendSms({ to: process.env.TERMII_STAFF_PHONE || phone, message: staffSms }),
    ]).catch(() => {});

    res.status(201).json(testDrive);
  } catch (error) {
    console.error("Create test drive error:", error);
    res.status(500).json({ error: "Failed to book test drive" });
  }
});

// PATCH /api/test-drives/:id - update test drive [admin only]
router.patch("/:id", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const testDrive = await prisma.testDrive.update({
      where: { id },
      data: updates,
    });

    res.json(testDrive);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Test drive not found" });
    }
    console.error("Update test drive error:", error);
    res.status(500).json({ error: "Failed to update test drive" });
  }
});

// DELETE /api/test-drives/:id - delete test drive [admin only]
router.delete("/:id", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.testDrive.delete({
      where: { id },
    });

    res.json({ message: "Test drive deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Test drive not found" });
    }
    console.error("Delete test drive error:", error);
    res.status(500).json({ error: "Failed to delete test drive" });
  }
});

module.exports = router;
