const express = require("express");
const router = express.Router();
const { sendSms } = require("../services/termii");
const prisma = require("../lib/prisma");

router.post("/contact", async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({ error: "Name, phone, and message are required" });
    }

    const staffPhone = process.env.TERMII_STAFF_PHONE;
    const composed = `CONTACT: ${name} (${phone}${email ? `, ${email}` : ""}) - ${subject || "General"}. ${message}`;

    if (staffPhone) {
      await sendSms({ to: staffPhone, message: composed.slice(0, 300) });
    }

    res.status(201).json({ message: "Contact message received" });
  } catch (error) {
    console.error("Public contact error:", error);
    res.status(500).json({ error: "Failed to send contact message" });
  }
});

router.get("/promo-banner", async (req, res) => {
  try {
    const latest = await prisma.notificationLog.findFirst({
      where: {
        context: "promo_banner",
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latest || !latest.payload || typeof latest.payload !== "object") {
      return res.json({ text: null, activeUntil: null });
    }

    const text = latest.payload.text || null;
    const activeUntil = latest.payload.activeUntil || null;

    if (activeUntil && new Date(activeUntil).getTime() < Date.now()) {
      return res.json({ text: null, activeUntil: null });
    }

    res.json({ text, activeUntil });
  } catch (error) {
    console.error("Public promo banner error:", error);
    res.status(500).json({ error: "Failed to fetch promo banner" });
  }
});

module.exports = router;
