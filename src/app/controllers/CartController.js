const Sanpham = require("../models/Sanpham");
const { mongooseToObject } = require("../../util/mongoose");
const {
  getProvinceName,
  getDistrictName,
  getWardName,
} = require("../../util/addressHelper");

const fs = require("fs");
const path = require("path");

class CartController {
  // Thêm sản phẩm vào giỏ hàng
  async addToCart(req, res) {
    try {
      const productId = req.params.id;
      const product = await Sanpham.findById(productId);

      if (!product) {
        return res.status(404).send("Không tìm thấy sản phẩm");
      }

      // Nếu chưa có giỏ hàng trong session thì tạo mới
      if (!req.session.cart) {
        req.session.cart = {
          items: [],
          totalPrice: 0,
        };
      }

      // Kiểm tra nếu sản phẩm đã có trong giỏ hàng thì tăng số lượng lên 1
      const existingItemIndex = req.session.cart.items.findIndex(
        (item) => item._id.toString() === productId
      );

      if (existingItemIndex !== -1) {
        req.session.cart.items[existingItemIndex].quantity += 1;
        req.session.cart.totalPrice += product.price;
      } else {
        req.session.cart.items.push({
          _id: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
        });
        req.session.cart.totalPrice += product.price;
      }

      console.log("✅ Đã thêm vào giỏ hàng:", req.session.cart);
      res.redirect("/cart/giohang");
    } catch (err) {
      console.error("💥 Lỗi khi thêm vào giỏ:", err);
      res.status(500).send("Lỗi hệ thống");
    }
  }

  // Hiển thị giỏ hàng
  viewCart(req, res) {
    const cart = req.session.cart || { items: [], totalPrice: 0 };

    // Tính tổng số lượng
    const totalQuantity = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    // Tính tổng tiền
    const totalPrice = cart.totalPrice;

    // Render giỏ hàng với tổng số lượng và tổng tiền
    res.render("cart/giohang", {
      cart,
      totalQuantity,
      totalPrice,
    });
  }

  // Thanh toán - Hiển thị trang thanh toán
  viewCheckout(req, res) {
    const cart = req.session.cart || { items: [], totalPrice: 0 };
    const totalQuantity = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const formattedTotalPrice = cart.totalPrice.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    });

    res.render("cart/payment", {
      cart,
      totalQuantity,
      totalPrice: formattedTotalPrice, // Truyền đã format
    });
  }

  // Xử lý thanh toán
  // Controller xử lý thanh toán
  async processCheckout(req, res) {
    const { name, phone, province, district, ward, detail } = req.body;

    try {
      const provinceName = await getProvinceName(province);
      const districtName = await getDistrictName(district);
      const wardName = await getWardName(ward, district);

      if (!provinceName || !districtName || !wardName) {
        return res.status(400).send("Lỗi khi lấy thông tin địa chỉ.");
      }

      const address = `${detail}, ${wardName}, ${districtName}, ${provinceName}`;
      const cart = req.session.cart;

      if (!cart || cart.items.length === 0) {
        return res.redirect("/cart/giohang");
      }

      if (!name || !address || !phone) {
        return res.status(400).send("Vui lòng nhập đầy đủ thông tin");
      }

      const totalQuantity = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      const formattedTotalPrice = cart.totalPrice.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      });

      // Sau khi chuẩn bị dữ liệu, xoá giỏ hàng
      req.session.cart = null;

      res.render("cart/thankyou", {
        name,
        phone,
        address,
        order: cart, // 👈 Truyền giỏ hàng để hiển thị sản phẩm
        totalQuantity,
        totalPrice: formattedTotalPrice,
      });
    } catch (err) {
      console.error("Lỗi khi xử lý thanh toán:", err);
      res.status(500).send("Lỗi hệ thống");
    }
  }

  // Tăng số lượng
  increaseQuantity(req, res) {
    const productId = req.params.id;
    const cart = req.session.cart;

    if (!cart) return res.redirect("/cart/giohang");

    const item = cart.items.find((item) => item._id.toString() === productId);
    if (item) {
      item.quantity += 1;
      cart.totalPrice += item.price;
    }

    res.redirect("/cart/giohang");
  }

  // Giảm số lượng
  decreaseQuantity(req, res) {
    const productId = req.params.id;
    const cart = req.session.cart;

    if (!cart) return res.redirect("/cart/giohang");

    const item = cart.items.find((item) => item._id.toString() === productId);
    if (item && item.quantity > 1) {
      item.quantity -= 1;
      cart.totalPrice -= item.price;
    } else if (item && item.quantity === 1) {
      // Nếu còn 1 thì xóa luôn sản phẩm khỏi giỏ
      cart.items = cart.items.filter((i) => i._id.toString() !== productId);
      cart.totalPrice -= item.price;
    }

    res.redirect("/cart/giohang");
  }

  // Xóa sản phẩm khỏi giỏ hàng
  removeFromCart(req, res) {
    const productId = req.params.id;

    if (!req.session.cart) {
      return res.redirect("/cart/giohang");
    }

    const cart = req.session.cart;
    const index = cart.items.findIndex(
      (item) => item._id.toString() === productId
    );

    if (index > -1) {
      const removedItem = cart.items.splice(index, 1)[0];
      cart.totalPrice -= removedItem.price * removedItem.quantity;
    }

    res.redirect("/cart/giohang");
  }
}

module.exports = new CartController();
