const app = require("./app");
const prisma = require("./lib/prisma");
const { startScheduler } = require("./services/scheduler");

startScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});