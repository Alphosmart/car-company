const axios = require("axios");

async function sendSms({ to, message }) {
  if (!process.env.TERMII_API_KEY || !process.env.TERMII_SENDER_ID) {
    throw new Error("Termii is not configured");
  }

  try {
    await axios.post(
      "https://api.termii.com/api/sms/send",
      {
        to,
        from: process.env.TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        api_key: process.env.TERMII_API_KEY,
        channel: "generic",
      },
      { timeout: 15000 }
    );
  } catch (error) {
    const reason = error.response?.data || error.message;
    throw new Error(`Termii send failed: ${JSON.stringify(reason)}`);
  }
}

module.exports = { sendSms };
