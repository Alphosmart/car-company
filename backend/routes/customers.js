const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");

// GET /api/customers - all customers with search [admin only]
router.get("/", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// GET /api/customers/:id - customer profile [admin only]
router.get("/:id", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        leads: { orderBy: { createdAt: "desc" } },
        purchases: { orderBy: { purchasedAt: "desc" } },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// POST /api/customers - create customer [admin only]
router.post("/", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone required" });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        referralCode: require("crypto").randomUUID(),
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email or phone already exists" });
    }
    console.error("Create customer error:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// PATCH /api/customers/:id - update customer [admin only]
router.patch("/:id", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(customer);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Customer not found" });
    }
    console.error("Update customer error:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// GET /api/customers/:id/leads - customer inquiries [admin only]
router.get("/:id/leads", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { customerId: req.params.id },
      include: { car: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(leads);
  } catch (error) {
    console.error("Get customer leads error:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// GET /api/customers/:id/purchases - customer purchases [admin only]
router.get("/:id/purchases", authMiddleware, roleCheck(["admin", "manager"]), async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { customerId: req.params.id },
      include: { car: true },
      orderBy: { purchasedAt: "desc" },
    });

    res.json(purchases);
  } catch (error) {
    console.error("Get customer purchases error:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

module.exports = router;
