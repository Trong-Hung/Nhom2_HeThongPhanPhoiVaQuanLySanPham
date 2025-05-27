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

  phone: String,
  province: String, 
  district: String,
  ward: String,
  detail: String, 

  region: {
    type: String,
    enum: ["Miền Bắc", "Miền Trung", "Miền Nam"],
    required: function() { return this.role === "shipper"; }, 
  }
});



module.exports = mongoose.model("User", UserSchema);
