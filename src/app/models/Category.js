const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Category = new Schema({
  code: { type: String, required: true, unique: true }, // Mã danh mục
  name: { type: String, required: true, unique: true }, // Tên danh mục
  description: { type: String } // Mô tả
});

module.exports = mongoose.model('Category', Category);