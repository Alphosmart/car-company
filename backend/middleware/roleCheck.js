const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.staff) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.staff.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

module.exports = roleCheck;
