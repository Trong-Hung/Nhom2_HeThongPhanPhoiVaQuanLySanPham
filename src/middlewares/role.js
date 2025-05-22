function isAuthenticated(req, res, next) {
  console.log("Session khi vào middleware:", req.session); // Kiểm tra session

  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect("/auth/login"); // Redirect nếu không có session
}



function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === "admin") {
    res.locals.user = req.session.user; // 👈 THÊM DÒNG NÀY
    return next();
  }
  return res.redirect("/auth/login");
}

function isShipper(req, res, next) {
  if (!req.session.user || req.session.user.role !== "shipper") {
    return res.status(403).send("Bạn không có quyền truy cập.");
  }
  next();
}








module.exports = { isAuthenticated, isAdmin, isShipper };
