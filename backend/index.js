require("dotenv/config");
const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");
const app = express();

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Auth routes will fail until it is configured.");
}

// Middleware
const allowedOrigins = process.env.NODE_ENV === "production" && process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight cookie parser for referral tracking during testing.
app.use((req, res, next) => {
  const header = req.headers.cookie;
  req.cookies = {};

  if (header) {
    header.split(";").forEach((item) => {
      const [key, ...value] = item.trim().split("=");
      if (!key) return;
      req.cookies[key] = decodeURIComponent(value.join("="));
    });
  }

  next();
});

// Auth middleware
const authMiddleware = require("./middleware/auth");
const roleCheck = require("./middleware/roleCheck");

// Routes
const authRoutes = require("./routes/auth");
const carsRoutes = require("./routes/cars");
const leadsRoutes = require("./routes/leads");
const customersRoutes = require("./routes/customers");
const referralsRoutes = require("./routes/referrals");
const notificationsRoutes = require("./routes/notifications");
const analyticsRoutes = require("./routes/analytics");
const staffRoutes = require("./routes/staff");
const publicRoutes = require("./routes/public");
const { startScheduler } = require("./services/scheduler");

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/cars", carsRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/customers", authMiddleware, customersRoutes);
app.use("/api/referrals", referralsRoutes);
app.use("/api/notifications", authMiddleware, roleCheck(["admin", "manager"]), notificationsRoutes);
app.use("/api/analytics", authMiddleware, roleCheck(["admin", "manager"]), analyticsRoutes);
app.use("/api/staff", staffRoutes);

startScheduler();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
