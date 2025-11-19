function isAuthenticated(req, res, next) {
  console.log("Session khi vào middleware:", req.session); // Kiểm tra session

  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect("/auth/login"); // Redirect nếu không có session
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }
  // Nếu không phải admin, render trang thông báo
  return res.status(403).render("admin/no-permission");
}

module.exports = { isAdmin /* ... */ };

function isShipper(req, res, next) {
  if (!req.session.user || req.session.user.role !== "shipper") {
    return res.status(403).send("Bạn không có quyền truy cập.");
  }
  next();
}

// JWT Authentication middleware (for API endpoints)
function authenticateJWT(req, res, next) {
  // For now, use session-based auth as fallback
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Could add JWT token verification here later
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // JWT token logic would go here
    // For now, just pass through
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized - Please login",
  });
}

// Role-based access control middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user && !req.session?.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = req.user || req.session.user;
    if (roles.includes(user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Required roles: ${roles.join(", ")}`,
    });
  };
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isShipper,
  authenticateJWT,
  requireRole,
};
