const express = require('express');
const router = express.Router();
const { isAuthenticated } = require("../middlewares/role");
const authController = require('../app/controllers/AuthController');
const userController = require('../app/controllers/UserController'); // Thêm dòng này

// Trang đăng nhập/đăng ký
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

router.get('/register', authController.showRegister);
router.post('/register', authController.register);

// Đăng xuất
router.get('/logout', authController.logout);

// Trang hồ sơ cá nhân
router.get('/profile', isAuthenticated, authController.showProfile);
router.post('/profile', isAuthenticated, userController.updateProfile); // Sửa controller ở đây

// Xác thực email (nếu có)
router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;
  const User = require('../app/models/User');
  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(404).send("Mã xác nhận không hợp lệ.");
  }

  user.status = "Hoạt động";
  user.verificationToken = null;
  await user.save();

  res.send("Tài khoản đã được xác nhận thành công!");
});

module.exports = router;