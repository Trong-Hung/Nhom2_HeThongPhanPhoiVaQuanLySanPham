const bcrypt = require('bcrypt');
const User = require('../models/User');

class AuthController {
  // Hiển thị trang đăng nhập
  showLogin(req, res) {
    res.render('auth/login');
  }

  // Xử lý đăng nhập
  login(req, res) {
    const { email, password } = req.body;
    User.findOne({ email }).then(user => {
      if (!user) return res.status(400).send("Email không tồn tại");
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) return res.status(400).send("Sai mật khẩu");
        req.session.user = {
          _id: user._id,
          username: user.username,
          role: user.role,
          region: user.region,
        };
        if (user.role === "admin") return res.redirect("/admin");
        else return res.redirect("/");
      });
    }).catch(error => {
      res.status(500).send("Lỗi hệ thống");
    });
  }

  // Hiển thị trang đăng ký
  showRegister(req, res) {
    res.render('auth/register');
  }

  // Xử lý đăng ký tài khoản mới
  register(req, res) {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email) return res.status(400).send("Vui lòng điền đủ thông tin");
    User.findOne({ email }).then(existingUser => {
      if (existingUser) return res.status(400).send("Email đã được đăng ký");
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).send("Lỗi hệ thống");
        const newUser = new User({
          username,
          email,
          password: hashedPassword,
          role: role || 'user',
        });
        newUser.save()
          .then(() => res.redirect('./login'))
          .catch(() => res.status(500).send("Lỗi hệ thống"));
      });
    }).catch(() => res.status(500).send("Lỗi hệ thống"));
  }

  // Đăng xuất người dùng
  logout(req, res) {
    req.session.destroy(err => {
      if (err) return res.status(500).send("Lỗi khi đăng xuất");
      res.redirect('/auth/login');
    });
  }

  // Hiển thị trang hồ sơ cá nhân
  async showProfile(req, res) {
    try {
      const user = await User.findById(req.session.user._id);
      res.render("auth/profile", { user });
    } catch {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }
}

module.exports = new AuthController();