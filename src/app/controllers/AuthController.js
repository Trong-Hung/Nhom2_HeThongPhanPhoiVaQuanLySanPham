// src/app/controllers/AuthController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');  // Import model User
const sendVerificationEmail = require("../../helpers/sendEmail");
  const DonHang = require("../models/DonHang");
   const { ObjectId } = require("mongodb"); 

  const {
    getProvinceName,
    getDistrictName,
    getWardName,
  } = require("../../util/addressHelper");




class AuthController {

 

async updateUser(req, res) {
  try {
    console.log("📌 Dữ liệu nhận được từ form:", req.body);
    console.log("📌 ID người dùng nhận được từ form:", req.body.userId);


    const { userId, name, phone, province, district, ward, detail, role, region } = req.body;

    const userExists = await User.findOne({ _id: new ObjectId(userId) }); // 📌 Dùng ObjectId để tìm user
    console.log("📌 Kiểm tra user tồn tại:", userExists);

    if (!userExists) {
      return res.status(404).send("❌ Không tìm thấy người dùng trong MongoDB.");
    }

    // 🔥 Lấy tên địa phương từ API
    const provinceName = await getProvinceName(province);
    const districtName = await getDistrictName(district);
    const wardName = await getWardName(ward, district);

    if (!provinceName || !districtName || !wardName) {
      return res.status(400).send("❌ Lỗi khi lấy thông tin địa chỉ.");
    }

    const updateData = { name, phone, detail, role, region, province: provinceName, district: districtName, ward: wardName };

    const result = await User.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
    console.log("📌 Kết quả cập nhật MongoDB:", result);

    if (result.modifiedCount === 0) {
      return res.status(400).send("❌ Không thể cập nhật thông tin.");
    }

    res.redirect("/admin/quanlytaikhoan");
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật MongoDB:", err);
    res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
  }
}




async viewEditUser(req, res) {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send("❌ Bạn không có quyền chỉnh sửa tài khoản.");
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("❌ Không tìm thấy người dùng.");

    // 🔥 Lấy danh sách địa phương từ API
    const provincesRes = await fetch("https://provinces.open-api.vn/api/?depth=1");
    const provinces = await provincesRes.json();

    const districtsRes = await fetch(`https://provinces.open-api.vn/api/p/${user.province}?depth=2`);
    const districtsData = await districtsRes.json();
    const districts = districtsData.districts || [];

    const wardsRes = await fetch(`https://provinces.open-api.vn/api/d/${user.district}?depth=2`);
    const wardsData = await wardsRes.json();
    const wards = wardsData.wards || [];

    res.render("admin/edituser", { user, provinces, districts, wards });
  } catch (err) {
    console.error("❌ Lỗi khi tải thông tin người dùng:", err);
    res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
  }
}






  async showOrders(req, res) {
    try {
      const orders = await DonHang.find({ status: "Chờ xác nhận" });
      const shippers = await User.find({ role: "shipper" });

      res.render("admin/quanlydonhang", { orders, shippers });
    } catch (err) {
      console.error("❌ Lỗi khi tải đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async assignShipper(req, res) {
    try {
      const { shipperId } = req.body;
      const orderId = req.params.id;

      await DonHang.updateOne({ _id: orderId }, { shipper: shipperId, status: "Đang vận chuyển" });

      res.redirect("/admin/qldonhang");
    } catch (err) {
      console.error("❌ Lỗi khi gán shipper:", err);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }





async manageAccounts(req, res) {
    try {
      const admins = await User.find({ role: "admin" });
      const shippers = await User.find({ role: "shipper" });
      const users = await User.find({ role: "user" });

      res.render("admin/quanlytaikhoan", { admins, shippers, users });
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách tài khoản:", err);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }


 showCreateAccount(req, res) {
  res.render("admin/taotaikhoan"); // 📌 Hiển thị đúng file giao diện
}


 async createAccount(req, res) {
  try {
    // Kiểm tra nếu không phải admin thì từ chối yêu cầu
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send("❌ Bạn không có quyền tạo tài khoản.");
    }

    const { name, email, password, role, region } = req.body;

    // Nếu role không được chọn hoặc không được gửi từ form, mặc định là 'user'
    const assignedRole = role || "user";

    if (assignedRole === "shipper" && !region) {
      return res.status(400).send("❌ Region là bắt buộc đối với Shipper!");
    }

    const existingUser = await User.findOne({ email: email.trim() });
    if (existingUser) {
      return res.status(400).send("❌ Email đã tồn tại.");
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const newUser = new User({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: assignedRole, // Sử dụng giá trị role đã xử lý
      status: "Hoạt động",
      region: assignedRole === "shipper" ? region : undefined,
    });

    await newUser.save();
    res.redirect("/admin/quanlytaikhoan");
  } catch (err) {
    console.error("❌ Lỗi khi tạo tài khoản:", err);
    res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
  }
}




  

async updateProfile(req, res) {
  try {
    if (!req.session.user || req.session.user.role !== "user") {
      return res.status(403).send("❌ Bạn không có quyền cập nhật thông tin.");
    }

    const { name, phone, province, district, ward, detail } = req.body;

    // 🔥 Lấy tên địa phương từ API
    const provinceName = await getProvinceName(province);
    const districtName = await getDistrictName(district);
    const wardName = await getWardName(ward, district);

    if (!provinceName || !districtName || !wardName) {
      return res.status(400).send("❌ Lỗi khi lấy thông tin địa chỉ.");
    }

    const address = `${detail}, ${wardName}, ${districtName}, ${provinceName}`;

    await User.updateOne(
      { _id: req.session.user._id },
      { name, phone, province: provinceName, district: districtName, ward: wardName, detail }
    );

    res.redirect("/auth/profile"); // 🔥 Chuyển về trang hồ sơ sau khi cập nhật
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật thông tin:", err);
    res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
  }
}






async showProfile(req, res) {
  try {
    const user = await User.findById(req.session.user._id); // 📌 Lấy thông tin user từ database
    res.render("auth/profile", { user });
  } catch (err) {
    console.error("❌ Lỗi khi tải trang profile:", err);
    res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
  }
}






 async createShipperAccount(req, res) {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("Email đã tồn tại.");
  }

  const verificationToken = Math.random().toString(36).substring(2, 15);
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role: "shipper",
    status: "Chờ xác nhận",
    verificationToken,
  });

  await newUser.save();
  sendVerificationEmail(email, verificationToken); // 🚀 Gửi email xác nhận

  res.send("Tạo tài khoản shipper thành công! Vui lòng kiểm tra email để xác nhận.");
}



  
  showLogin(req, res) {
    res.render('auth/login');  // Render trang đăng nhập
  }

login(req, res) {
  const { email, password } = req.body;

  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(400).send("Email không tồn tại");
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(400).send("Sai mật khẩu");
      }

      // 🔥 Lưu đầy đủ thông tin user vào session, bao gồm region
      req.session.user = {
        _id: user._id,
        username: user.username,
        role: user.role,
        region: user.region, // 🔥 Lưu vùng miền vào session để shipper có thể xem đúng đơn hàng
      };

      console.log("✅ Đăng nhập thành công:", req.session.user);

      // Chuyển hướng theo role
      if (user.role === "admin") {
        return res.redirect("/admin");
      } else {
        return res.redirect("/");
      }
    });
  }).catch(error => {
    console.error("❌ Lỗi login:", error);
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
