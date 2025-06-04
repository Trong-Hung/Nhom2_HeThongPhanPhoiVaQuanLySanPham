const User = require('../models/User');
const bcrypt = require('bcrypt');
const { ObjectId } = require("mongodb");
const {
  getProvinceName,
  getDistrictName,
  getWardName,
} = require("../../util/addressHelper");

class UserController {
  async manageAccounts(req, res) {
    try {
      const admins = await User.find({ role: "admin" });
      const shippers = await User.find({ role: "shipper" });
      const users = await User.find({ role: "user" });
      res.render("admin/quanlytaikhoan", { admins, shippers, users });
    } catch {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  showCreateAccount(req, res) {
    res.render("admin/taotaikhoan");
  }

  async createAccount(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("❌ Bạn không có quyền tạo tài khoản.");
      }
      const { name, email, password, role, region } = req.body;
      const assignedRole = role || "user";
      if (assignedRole === "shipper" && !region) {
        return res.status(400).send("❌ Region là bắt buộc đối với Shipper!");
      }
      const existingUser = await User.findOne({ email: email.trim() });
      if (existingUser) return res.status(400).send("❌ Email đã tồn tại.");
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      const newUser = new User({
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        role: assignedRole,
        status: "Hoạt động",
        region: assignedRole === "shipper" ? region : undefined,
      });
      await newUser.save();
      res.redirect("/admin/quanlytaikhoan");
    } catch {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async deleteUser(req, res) {
    try {
      await User.deleteOne({ _id: req.params.id });
      res.redirect("/admin/quanlytaikhoan");
    } catch {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async updateUser(req, res) {
    try {
      const { userId, name, phone, province, district, ward, detail, role, region } = req.body;
      const userExists = await User.findOne({ _id: new ObjectId(userId) });
      if (!userExists) return res.status(404).send("❌ Không tìm thấy người dùng trong MongoDB.");
      const provinceName = await getProvinceName(province);
      const districtName = await getDistrictName(district);
      const wardName = await getWardName(ward, district);
      if (!provinceName || !districtName || !wardName) {
        return res.status(400).send("❌ Lỗi khi lấy thông tin địa chỉ.");
      }
      const updateData = { name, phone, detail, role, region, province: provinceName, district: districtName, ward: wardName };
      const result = await User.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
      if (result.modifiedCount === 0) return res.status(400).send("❌ Không thể cập nhật thông tin.");
      res.redirect("/admin/quanlytaikhoan");
    } catch {
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
      const provincesRes = await fetch("https://provinces.open-api.vn/api/?depth=1");
      const provinces = await provincesRes.json();
      const districtsRes = await fetch(`https://provinces.open-api.vn/api/p/${user.province}?depth=2`);
      const districtsData = await districtsRes.json();
      const districts = districtsData.districts || [];
      const wardsRes = await fetch(`https://provinces.open-api.vn/api/d/${user.district}?depth=2`);
      const wardsData = await wardsRes.json();
      const wards = wardsData.wards || [];
      res.render("admin/edituser", { user, provinces, districts, wards });
    } catch {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async updateProfile(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "user") {
        return res.status(403).send("❌ Bạn không có quyền cập nhật thông tin.");
      }
      const { name, phone, province, district, ward, detail } = req.body;
      const provinceName = await getProvinceName(province);
      const districtName = await getDistrictName(district);
      const wardName = await getWardName(ward, district);
      if (!provinceName || !districtName || !wardName) {
        return res.status(400).send("❌ Lỗi khi lấy thông tin địa chỉ.");
      }
      await User.updateOne(
        { _id: req.session.user._id },
        { name, phone, province: provinceName, district: districtName, ward: wardName, detail }
      );
      res.redirect("/auth/profile");
    } catch {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }
}

module.exports = new UserController();