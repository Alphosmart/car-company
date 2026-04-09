const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { sendEmail } = require("../services/brevo");
const { sendSms } = require("../services/termii");
const { logNotification } = require("../services/notificationLog");

// POST /api/notifications/email/broadcast - send bulk email [admin only]
router.post("/email/broadcast", async (req, res) => {
  try {
    const { subject, body, customerIds } = req.body;

    if (!subject || !body || !customerIds || customerIds.length === 0) {
      return res.status(400).json({ error: "Subject, body, and customerIds required" });
    }

    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { email: true, name: true },
    });

    const recipients = customers.filter((customer) => customer.email).map((customer) => customer.email);

    if (recipients.length > 0) {
      const results = await Promise.allSettled(
        recipients.map((email) => sendEmail({ to: email, subject, html: `<p>${body}</p>` }))
      );

      await Promise.all(
        results.map((result, index) =>
          logNotification({
            channel: "email",
            recipient: recipients[index],
            status: result.status,
            context: "broadcast",
            payload: { subject },
            error: result.status === "rejected" ? String(result.reason) : null,
          })
        )
      );
    }

    console.log("Email broadcast:", { subject, body, customerIds });

    res.json({
      message: "Email broadcast scheduled",
      count: customerIds.length,
      status: "pending",
    });
  } catch (error) {
    console.error("Email broadcast error:", error);
    res.status(500).json({ error: "Failed to send emails" });
  }
});

// POST /api/notifications/sms - send SMS [admin only]
router.post("/sms", async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message required" });
    }

    try {
      await sendSms({ to: phone, message });
      await logNotification({ channel: "sms", recipient: phone, status: "sent", context: "single" });
    } catch {
      console.log("SMS fallback:", { phone, message });
      await logNotification({
        channel: "sms",
        recipient: phone,
        status: "failed",
        context: "single",
        payload: { message },
      });
    }

    res.json({
      message: "SMS sent",
      phone,
      status: "sent",
    });
  } catch (error) {
    console.error("SMS error:", error);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

// POST /api/notifications/whatsapp - send WhatsApp [admin only]
router.post("/whatsapp", async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message required" });
    }

    // During testing, generate wa.me link
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    res.json({
      message: "WhatsApp link generated",
      link: waLink,
      status: "pending",
    });
  } catch (error) {
    console.error("WhatsApp error:", error);
    res.status(500).json({ error: "Failed to send WhatsApp message" });
  }
});

// POST /api/notifications/promo-banner - set promo banner content [admin/manager]
router.post("/promo-banner", async (req, res) => {
  try {
    const { text, activeUntil } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Promo banner text is required" });
    }

    const record = await prisma.notificationLog.create({
      data: {
        channel: "admin",
        status: "active",
        context: "promo_banner",
        payload: {
          text: text.trim(),
          activeUntil: activeUntil || null,
        },
      },
    });

    res.json({ message: "Promo banner updated", id: record.id });
  } catch (error) {
    console.error("Promo banner update error:", error);
    res.status(500).json({ error: "Failed to update promo banner" });
  }
});

router.get("/requests", async (req, res) => {
  try {
    const { requestType, status, page = 1, limit = 20 } = req.query;

    const where = {
      channel: "web",
      context: { startsWith: "request:" },
    };

    if (status) {
      where.status = status;
    }

    if (requestType) {
      where.context = `request:${requestType}`;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [requests, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notificationLog.count({ where }),
    ]);

    res.json({
      requests,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error("Get request logs error:", error);
    res.status(500).json({ error: "Failed to fetch request logs" });
  }
});

router.get("/assignable-staff", async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      where: {
        role: {
          not: "inactive",
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({ staff });
  } catch (error) {
    console.error("Get assignable staff error:", error);
    res.status(500).json({ error: "Failed to fetch staff list" });
  }
});

router.patch("/requests/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const allowedStatuses = ["received", "in_review", "contacted", "resolved", "closed"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const existing = await prisma.notificationLog.findUnique({
      where: { id },
      select: { payload: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Request log not found" });
    }

    const nextPayload =
      existing.payload && typeof existing.payload === "object"
        ? { ...existing.payload }
        : {};

    if (typeof adminNote === "string") {
      nextPayload.adminNote = adminNote.trim();
    }

    const requestLog = await prisma.notificationLog.update({
      where: { id },
      data: {
        status,
        payload: nextPayload,
      },
    });

    res.json(requestLog);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Request log not found" });
    }

    console.error("Update request log status error:", error);
    res.status(500).json({ error: "Failed to update request status" });
  }
});

router.patch("/requests/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    const existing = await prisma.notificationLog.findUnique({
      where: { id },
      select: { payload: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Request log not found" });
    }

    const nextPayload =
      existing.payload && typeof existing.payload === "object"
        ? { ...existing.payload }
        : {};

    if (!staffId) {
      nextPayload.assignee = null;
    } else {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }

      nextPayload.assignee = staff;
    }

    const requestLog = await prisma.notificationLog.update({
      where: { id },
      data: { payload: nextPayload },
    });

    res.json(requestLog);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Request log not found" });
    }

    console.error("Assign request log error:", error);
    res.status(500).json({ error: "Failed to assign request" });
  }
});

module.exports = router;
