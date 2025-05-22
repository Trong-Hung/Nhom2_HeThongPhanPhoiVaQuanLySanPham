// src/routes/auth.js

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require("../middlewares/role");
const authController = require('../app/controllers/AuthController'); // Import controller đúng


router.post("/profile", isAuthenticated, authController.updateProfile);
router.get("/profile", isAuthenticated, authController.showProfile);


router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(404).send("Mã xác nhận không hợp lệ.");
  }

  user.status = "Hoạt động";
  user.verificationToken = null;
  await user.save();

  res.send("Tài khoản đã được xác nhận thành công!");
});

router.get('/login', authController.showLogin);  // Hiển thị trang đăng nhập
router.post('/login', authController.login);  // Xử lý đăng nhập

router.get('/register', authController.showRegister);  // Hiển thị trang đăng ký
router.post('/register', authController.register);  // Xử lý đăng ký

router.get('/logout', authController.logout);  // Xử lý logout

module.exports = router;
