// src/routes/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../app/controllers/AuthController'); // Import controller đúng

router.get('/login', authController.showLogin);  // Hiển thị trang đăng nhập
router.post('/login', authController.login);  // Xử lý đăng nhập

router.get('/register', authController.showRegister);  // Hiển thị trang đăng ký
router.post('/register', authController.register);  // Xử lý đăng ký

router.get('/logout', authController.logout);  // Xử lý logout

module.exports = router;
