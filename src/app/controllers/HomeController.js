const Sanpham = require("../models/Sanpham");
const Banner = require('../models/banner');
const Danhmuc = require('../models/Category'); // Thêm dòng này

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
    // Nếu là shipper, render trang home riêng cho shipper
    if (req.session.user && req.session.user.role === "shipper") {
      return res.render("shipper/home", { user: req.session.user });
    }

    const keyword = req.query.q || "";
    const sort = req.query.sort || "";
    const category = req.query.category || "";

    const banners = await Banner.find({});
    const danhmucs = await Danhmuc.find({}); // Lấy danh mục

    // Lọc theo danh mục
    let filter = {};
    if (category) filter.category = category;

    const allProducts = await Sanpham.find(filter);
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

    // Sắp xếp theo giá
    if (sort === "asc") {
      sanphams = sanphams.sort((a, b) => a.price - b.price);
    } else if (sort === "desc") {
      sanphams = sanphams.sort((a, b) => b.price - a.price);
    }

    const message = req.session.message;
    req.session.message = null;

    res.render("home", {
      sanphams,
      title: "Trang chủ",
      message,
      keyword,
      banners,
      danhmucs,
      sort,
      category
    });
  }
}

module.exports = new HomeController();