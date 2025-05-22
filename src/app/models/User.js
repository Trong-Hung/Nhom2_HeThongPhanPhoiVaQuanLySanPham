const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  role: {
    type: String,
    enum: ["admin", "shipper", "user"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["Chờ xác nhận", "Hoạt động"],
    default: "Chờ xác nhận",
  },
  verificationToken: String,

  // 🔥 Cập nhật thông tin địa chỉ để lưu "name" thay vì "code"
  phone: String,
  province: String, // Lưu tên tỉnh/thành phố thay vì code
  district: String, // Lưu tên quận/huyện
  ward: String, // Lưu tên phường/xã
  detail: String, // Địa chỉ chi tiết

  region: {
    type: String,
    enum: ["Miền Bắc", "Miền Trung", "Miền Nam"],
    required: function() { return this.role === "shipper"; }, // 📌 Chỉ yêu cầu nếu là shipper
  }
});



module.exports = mongoose.model("User", UserSchema);
