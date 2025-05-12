// src/app/controllers/AuthController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');  // Import model User

class AuthController {
  showLogin(req, res) {
    res.render('auth/login');  // Render trang đăng nhập
  }

login(req, res) {
  const { email, password } = req.body;

  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(400).send("Email không tồn tại");
    }

    // So sánh mật khẩu
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(400).send("Sai mật khẩu");
      }

      // Lưu thông tin user vào session
      req.session.user = {
        _id: user._id,
        username: user.username,
        role: user.role,
      };

      console.log("Đăng nhập thành công:", req.session.user);

      // 👉 Redirect theo role
      if (user.role === 'admin') {
        return res.redirect('/admin');
      } else {
        return res.redirect('/');
      }
    });
  }).catch(error => {
    console.error("Lỗi login:", error);
    res.status(500).send("Lỗi hệ thống");
  });
}



  showRegister(req, res) {
    res.render('auth/register');  // Render trang đăng ký
  }

  register(req, res) {
    console.log("Register form data:", req.body);  // In ra dữ liệu form

   const { username, password, email, role } = req.body;


    // Kiểm tra các trường bắt buộc
    if (!username || !password || !email) {
      console.log("Thông tin đăng ký không đầy đủ!");
      return res.status(400).send("Vui lòng điền đủ thông tin");
    }

    // Kiểm tra xem email đã tồn tại trong database chưa
    User.findOne({ email }).then(existingUser => {
      if (existingUser) {
        console.log("Email đã tồn tại!");
        return res.status(400).send("Email đã được đăng ký");
      }

      // Mã hóa mật khẩu trước khi lưu vào database
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.log("Lỗi mã hóa mật khẩu", err);
          return res.status(500).send("Lỗi hệ thống");
        }

        // Tạo một đối tượng User mới và lưu vào database
        const newUser = new User({
  username,
  email,
  password: hashedPassword,
  role: role || 'user', // nếu không chọn thì mặc định là user
});


        newUser.save()
          .then(() => {
            console.log("Đã lưu user vào database!");
            res.redirect('./login');  // Chuyển hướng đến trang login
          })
          .catch(error => {
            console.log("Lỗi khi lưu vào database:", error);
            res.status(500).send("Lỗi hệ thống");
          });
      });
    }).catch(error => {
      console.log("Lỗi khi tìm user:", error);
      res.status(500).send("Lỗi hệ thống");
    });
  }

 logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.log("Lỗi khi đăng xuất:", err);
      return res.status(500).send("Lỗi khi đăng xuất");
    }

    res.redirect('/auth/login'); // hoặc '/' nếu muốn về trang chủ
  });
}
}


module.exports = new AuthController();  // Export instance của controller
