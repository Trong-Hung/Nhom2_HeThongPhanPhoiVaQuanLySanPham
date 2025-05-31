const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Banner = new Schema({
  image: { type: String, required: true }, // Đường dẫn ảnh
  link: { type: String }, // Nếu muốn banner có link khi click
  title: { type: String }
});

module.exports = mongoose.model('Banner', Banner);