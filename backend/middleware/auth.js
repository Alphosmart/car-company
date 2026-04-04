const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const authMiddleware = (req, res, next) => {
  (async () => {
    try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server auth is not configured" });
    }

    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staff = await prisma.staff.findUnique({
      where: { id: decoded.staffId },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!staff) {
      return res.status(401).json({ error: "Account no longer exists" });
    }

    if (staff.role === "inactive") {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // Always trust current DB role over token payload to enforce deactivation/role changes instantly.
    req.staff = {
      staffId: staff.id,
      email: staff.email,
      role: staff.role,
      name: staff.name,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
  })();
};

module.exports = authMiddleware;
