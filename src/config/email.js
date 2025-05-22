const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",  // 📌 Dùng Gmail, có thể đổi thành SMTP khác
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});

module.exports = transporter;
