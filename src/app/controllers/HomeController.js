const Sanpham = require("../models/Sanpham");
const Banner = require('../models/banner');
function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase();
}

class HomeController {
  async index(req, res, next) {
    const keyword = req.query.q || "";
    const banners = await Banner.find({}); // <-- Đặt ở đây
    const allProducts = await Sanpham.find({});
    let sanphams = allProducts.map((sanpham) => ({
      _id: sanpham._id,
      name: sanpham.name,
      description: sanpham.description,
      slug: sanpham.slug,
      price: sanpham.price,
      image: sanpham.image
        ? `/uploads/${sanpham.image}`
        : "/uploads/default.jpg",
      createdAt: sanpham.createdAt,
      updatedAt: sanpham.updatedAt,
    }));

    // Nếu có từ khóa tìm kiếm, lọc sản phẩm
    if (keyword) {
      sanphams = sanphams.filter(sp =>
        removeVietnameseTones(sp.name).includes(removeVietnameseTones(keyword))
      );
    }

    const message = req.session.message;
    req.session.message = null;

    res.render("home", {
      sanphams,
      title: "Trang chủ",
      message,
      keyword,
      banners
    });
  }
}

module.exports = new HomeController();