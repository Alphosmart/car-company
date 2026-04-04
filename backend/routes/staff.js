const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");

router.get("/", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ staff });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

router.post("/", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { name, email, password, role = "sales_rep" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password required" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const staff = await prisma.staff.create({
      data: { name, email, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json(staff);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Create staff error:", error);
    res.status(500).json({ error: "Failed to create staff" });
  }
});

router.patch("/:id", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 12);

    const staff = await prisma.staff.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json(staff);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Staff not found" });
    }
    console.error("Update staff error:", error);
    res.status(500).json({ error: "Failed to update staff" });
  }
});

router.post("/:id/deactivate", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.update({
      where: { id },
      data: { role: "inactive" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json(staff);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Staff not found" });
    }
    console.error("Deactivate staff error:", error);
    res.status(500).json({ error: "Failed to deactivate staff" });
  }
});

module.exports = router;
