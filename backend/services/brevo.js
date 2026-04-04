const axios = require("axios");

async function sendEmail({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY || !process.env.FROM_EMAIL) {
    throw new Error("Brevo is not configured");
  }

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: process.env.FROM_NAME || "Sarkin Mota Autos",
          email: process.env.FROM_EMAIL,
        },
        to: Array.isArray(to) ? to : [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        timeout: 15000,
      }
    );
  } catch (error) {
    const reason = error.response?.data || error.message;
    throw new Error(`Brevo send failed: ${JSON.stringify(reason)}`);
  }
}

module.exports = { sendEmail };
