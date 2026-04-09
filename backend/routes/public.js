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

router.post("/request", async (req, res) => {
  try {
    const { requestType, name, phone, email, subject, message, metadata } = req.body;

    if (!requestType || !name || !phone || !message) {
      return res.status(400).json({ error: "requestType, name, phone, and message are required" });
    }

    const record = await prisma.notificationLog.create({
      data: {
        channel: "web",
        recipient: process.env.TERMII_STAFF_PHONE || null,
        status: "received",
        context: `request:${requestType}`,
        payload: {
          requestType,
          name,
          phone,
          email: email || null,
          subject: subject || null,
          message,
          metadata: metadata || null,
        },
      },
    });

    const staffPhone = process.env.TERMII_STAFF_PHONE;
    if (staffPhone) {
      const smsMessage = `${requestType.toUpperCase()}: ${name} (${phone})${subject ? ` - ${subject}` : ""}`;
      await sendSms({ to: staffPhone, message: smsMessage.slice(0, 300) });
    }

    res.status(201).json({ message: "Request received", id: record.id });
  } catch (error) {
    console.error("Public request error:", error);
    res.status(500).json({ error: "Failed to save request" });
  }
});

router.get("/request-history", async (req, res) => {
  try {
    const { phone, email, limit = 25 } = req.query;

    if (!phone && !email) {
      return res.status(400).json({ error: "phone or email is required" });
    }

    const records = await prisma.notificationLog.findMany({
      where: {
        channel: "web",
        context: { startsWith: "request:" },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit, 10) || 25, 100),
    });

    const normalizedPhone = phone ? String(phone).trim() : "";
    const normalizedEmail = email ? String(email).trim().toLowerCase() : "";

    const requests = records
      .filter((record) => {
        const payload = record.payload && typeof record.payload === "object" ? record.payload : null;
        if (!payload) return false;

        const payloadPhone = payload.phone ? String(payload.phone).trim() : "";
        const payloadEmail = payload.email ? String(payload.email).trim().toLowerCase() : "";

        const phoneMatches = normalizedPhone ? payloadPhone === normalizedPhone : false;
        const emailMatches = normalizedEmail ? payloadEmail === normalizedEmail : false;

        return phoneMatches || emailMatches;
      })
      .map((record) => ({
        id: record.id,
        status: record.status,
        context: record.context,
        payload: record.payload,
        createdAt: record.createdAt,
      }));

    res.json({ requests });
  } catch (error) {
    console.error("Public request history error:", error);
    res.status(500).json({ error: "Failed to fetch request history" });
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
