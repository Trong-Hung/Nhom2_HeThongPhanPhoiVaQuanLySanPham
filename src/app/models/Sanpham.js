const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const Sanpham = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  slug: { type: String, slug: "name", unique: true },
 image: { type: String },

  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model("Sanpham", Sanpham);
