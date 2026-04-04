const cron = require("node-cron");
const prisma = require("../lib/prisma");
const { logNotification } = require("./notificationLog");
const { sendSms } = require("./termii");

async function hasAlreadySent(context) {
  const existing = await prisma.notificationLog.findFirst({
    where: { context },
    select: { id: true },
  });

  return !!existing;
}

async function sendAndLogSms({ to, message, context, payload }) {
  if (!to) return;

  try {
    await sendSms({ to, message });
    await logNotification({
      channel: "sms",
      recipient: to,
      status: "sent",
      context,
      payload,
    });
  } catch (error) {
    await logNotification({
      channel: "sms",
      recipient: to,
      status: "failed",
      context,
      payload,
      error: String(error),
    });
  }
}

function startScheduler() {
  cron.schedule("0 7 * * *", async () => {
    try {
      const staleLeads = await prisma.lead.findMany({
        where: {
          status: "new",
          createdAt: {
            lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        },
        include: { assignedTo: true, car: true },
      });

      if (staleLeads.length > 0) {
        console.log(`Scheduler: ${staleLeads.length} stale leads need follow-up.`);
        await logNotification({
          channel: "scheduler",
          status: "detected",
          context: "stale_leads",
          payload: { count: staleLeads.length },
        });

        for (const lead of staleLeads) {
          const context = `stale_lead_${lead.id}`;
          const alreadySent = await hasAlreadySent(context);

          if (alreadySent) continue;

          const assigneePhone = process.env.TERMII_STAFF_PHONE;
          const to = assigneePhone;
          const message = `Follow-up needed: ${lead.name} (${lead.phone}) asked about ${lead.car.year} ${lead.car.make} ${lead.car.model} 3+ days ago.`;

          await sendAndLogSms({
            to,
            message,
            context,
            payload: { leadId: lead.id, stage: "3d_no_status_change" },
          });
        }
      }

      const now = new Date();
      const windows = [
        {
          key: "retention_3m",
          days: 90,
          buildMessage: (name, carLabel) =>
            `Hi ${name}, hope you are enjoying your ${carLabel}. We have fresh arrivals you may like.`,
        },
        {
          key: "retention_6m",
          days: 180,
          buildMessage: (name, carLabel) =>
            `Hi ${name}, thinking of an upgrade from your ${carLabel}? Ask us about our returning-customer discount.`,
        },
        {
          key: "retention_12m",
          days: 365,
          buildMessage: (name, carLabel) =>
            `Hi ${name}, it has been a year since your ${carLabel} purchase. Trade-in offers are available this month.`,
        },
      ];

      for (const window of windows) {
        const start = new Date(now.getTime() - (window.days + 1) * 24 * 60 * 60 * 1000);
        const end = new Date(now.getTime() - window.days * 24 * 60 * 60 * 1000);

        const purchases = await prisma.purchase.findMany({
          where: {
            purchasedAt: {
              gte: start,
              lt: end,
            },
          },
          include: {
            customer: true,
            car: true,
          },
        });

        for (const purchase of purchases) {
          const context = `${window.key}_${purchase.id}`;
          const alreadySent = await hasAlreadySent(context);

          if (alreadySent) continue;

          const customerName = purchase.customer?.name || "Customer";
          const customerPhone = purchase.customer?.phone;
          const carLabel = purchase.car
            ? `${purchase.car.year} ${purchase.car.make} ${purchase.car.model}`
            : "your car";
          const message = window.buildMessage(customerName, carLabel);

          await sendAndLogSms({
            to: customerPhone,
            message,
            context,
            payload: { purchaseId: purchase.id, campaign: window.key },
          });
        }
      }
    } catch (error) {
      console.error("Scheduler error:", error);
      await logNotification({
        channel: "scheduler",
        status: "failed",
        context: "stale_leads",
        error: String(error),
      });
    }
  });
}

module.exports = { startScheduler };
