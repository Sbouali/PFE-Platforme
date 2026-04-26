const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.roles) {
      return res.status(403).json({ error: "Access denied" });
    }

    const hasRole = user.roles.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};

module.exports = requireRole; // 🔥 THIS LINE IS REQUIRED