const prisma = require("../lib/prisma");

async function logNotification({ channel, recipient, status, context, payload, error }) {
  try {
    await prisma.notificationLog.create({
      data: {
        channel,
        recipient,
        status,
        context,
        payload: payload || undefined,
        error: error || undefined,
      },
    });
  } catch (logError) {
    console.error("Failed to persist notification log:", logError);
  }
}

module.exports = { logNotification };
