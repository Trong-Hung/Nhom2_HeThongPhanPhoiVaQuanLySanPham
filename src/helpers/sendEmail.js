const nodemailer = require("../config/email");

async function sendVerificationEmail(userEmail, token) {
  const link = `http://localhost:3000/auth/verify/${token}`;

  const mailOptions = {
    from: "your-email@gmail.com",
    to: userEmail,
    subject: "Xác nhận tài khoản Shipper",
    html: `<p>Nhấp vào <a href="${link}">đây</a> để xác nhận tài khoản.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email xác nhận đã gửi thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi email xác nhận:", error);
  }
}

module.exports = sendVerificationEmail;
