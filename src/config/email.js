const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // 📌 Dùng Gmail, có thể đổi thành SMTP khác
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password", // Sử dụng App Password, không phải mật khẩu thường
  },
});

module.exports = transporter;
