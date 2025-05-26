const Sanpham = require("../models/Sanpham");
const DonHang = require("../models/DonHang");
const Warehouse = require("../models/Warehouse"); 
const { getDistance } = require("../../util/distanceHelper");
const { geocodeAddress } = require("../../util/geolocationHelper");
const { mongooseToObject } = require("../../util/mongoose");
const {
  getProvinceName,
  getDistrictName,
  getWardName,
} = require("../../util/addressHelper");

const { getRegionByProvince } = require("../../util/regions");

const fs = require("fs");
const path = require("path");

async function findNearestWarehouse(customerLocation, productId, quantity) {
    const warehouses = await Warehouse.find();
    let closestWarehouse = null;
    let minDistance = Infinity;

    for (const warehouse of warehouses) {
        const distance = await getDistance(
            `${warehouse.location.longitude},${warehouse.location.latitude}`,
            `${customerLocation.longitude},${customerLocation.latitude}`
        );

        const productEntry = warehouse.products.find(p => p.productId.toString() === productId);
        if (productEntry && productEntry.quantity >= quantity && distance < minDistance) {
            minDistance = distance;
            closestWarehouse = warehouse;
        }
    }

    return closestWarehouse;
}

class CartController {


  // 🔥 Truy vấn kho gần nhất có hàng
  // 🔥 Truy vấn kho gần nhất có hàng


  // Thêm sản phẩm vào giỏ hàng
  async addToCart(req, res) {
    try {
      const productId = req.params.id;
      const product = await Sanpham.findById(productId);

      if (!product) {
        return res.status(404).send("Không tìm thấy sản phẩm");
      }

      if (!req.session.cart) {
        req.session.cart = {
          items: [],
          totalPrice: 0,
        };
      }

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
    const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cart.totalPrice;

    res.render("cart/giohang", {
      cart,
      totalQuantity,
      totalPrice,
    });
  }

  // Hiển thị trang thanh toán
  viewCheckout(req, res) {
    const cart = req.session.cart || { items: [], totalPrice: 0 };
    const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
    const formattedTotalPrice = cart.totalPrice.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    });

    res.render("cart/payment", {
      cart,
      totalQuantity,
      totalPrice: formattedTotalPrice,
    });
  }



 async processCheckout(req, res) {
    try {
        console.log("📌 Nhận yêu cầu thanh toán:", req.body);
        const { name, phone, province, district, ward, detail } = req.body;

        // 🔥 Xác định địa chỉ đầy đủ
        const provinceName = await getProvinceName(province);
        const districtName = await getDistrictName(district);
        const wardName = await getWardName(ward, district);
        const address = `${detail}, ${wardName}, ${districtName}, ${provinceName}`;

        // 🔥 Tìm kho gần nhất có hàng
        let location = req.body.location;
        if (!location || !location.latitude || !location.longitude) {
            location = await geocodeAddress(address);
            if (!location) return res.status(400).send("❌ Lỗi: Không thể xác định vị trí.");
        }

        console.log("📍 Vị trí xác định:", location);

        const selectedWarehouse = await findNearestWarehouse(location, req.session.cart.items[0]._id, req.session.cart.items[0].quantity);
        if (!selectedWarehouse) return res.status(404).send("❌ Không có kho nào còn đủ hàng!");

        console.log(`✅ Đơn hàng sẽ xuất từ kho: ${selectedWarehouse.name}`);

        // 🔥 Cập nhật `warehouseId` vào đơn hàng
        const newOrder = new DonHang({
            userId: req.session.user._id,
            warehouseId: selectedWarehouse._id, // 🔥 Lưu ID kho hàng
            name,
            phone,
            address,
            region: getRegionByProvince(provinceName),
            items: req.session.cart.items,
            totalQuantity: req.session.cart.items.reduce((total, item) => total + item.quantity, 0),
            totalPrice: req.session.cart.totalPrice,
            status: "Chờ xác nhận",
        });

        await newOrder.save();
        console.log("✅ Đơn hàng đã lưu thành công:", newOrder);

        req.session.cart = null;
        res.render("cart/thankyou", { name, phone, order: newOrder });

    } catch (err) {
        console.error("❌ Lỗi khi xử lý thanh toán:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}



  // Xử lý thanh toán
//  async processCheckout(req, res) {
//   const { name, phone, province, district, ward, detail } = req.body;
//   console.log("📌 Dữ liệu nhận từ request:", req.body);


//   const provinceName = await getProvinceName(province);
// const districtName = await getDistrictName(district);
// const wardName = await getWardName(ward, district);

// console.log("📌 Tỉnh:", provinceName);
// console.log("📌 Huyện:", districtName);
// console.log("📌 Xã:", wardName);

//   try {
//     const provinceName = await getProvinceName(province);
//     console.log("📌 Kiểm tra tỉnh/thành phố trước khi gọi `getRegionByProvince`:", provinceName);

//     const region = getRegionByProvince(provinceName);
//     console.log("📌 Kết quả xác định vùng miền:", region);

//     if (!provinceName || !region || region === "Không xác định") {
//       return res.status(400).send("❌ Lỗi xác định vùng miền.");
//     }

//    const address = `${detail}, ${wardName}, ${districtName}, ${provinceName}`; // ✅ Sử dụng tên địa phương đúng


//     console.log("📌 Địa chỉ trước khi lưu đơn hàng:", address);

//     const cart = req.session.cart;
//     if (!cart || cart.items.length === 0) {
//       return res.redirect("/cart/giohang");
//     }

//     if (!req.session.user) {
//       return res.status(403).send("❌ Bạn cần đăng nhập để đặt hàng.");
//     }

//     const userId = req.session.user._id;
//     const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);

//     const order = new DonHang({
//       userId,
//       name,
//       phone,
//       address, // 🔥 Địa chỉ đầy đủ
//       region,  // 🔥 Vùng miền đã xác định
//       items: cart.items,
//       totalQuantity,
//       totalPrice: cart.totalPrice,
//       status: "Chờ xác nhận",
//     });

//     await order.save();
//     console.log("✅ Đơn hàng đã được tạo:", order);

//     req.session.cart = null;
//     res.render("cart/thankyou", { name, phone, address, order: cart });
//   } catch (err) {
//     console.error("❌ Lỗi khi xử lý thanh toán:", err);
//     res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
//   }
// }




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

  decreaseQuantity(req, res) {
    const productId = req.params.id;
    const cart = req.session.cart;

    if (!cart) return res.redirect("/cart/giohang");

    const item = cart.items.find((item) => item._id.toString() === productId);
    if (item && item.quantity > 1) {
      item.quantity -= 1;
      cart.totalPrice -= item.price;
    } else if (item && item.quantity === 1) {
      cart.items = cart.items.filter((i) => i._id.toString() !== productId);
      cart.totalPrice -= item.price;
    }

    res.redirect("/cart/giohang");
  }

  removeFromCart(req, res) {
    const productId = req.params.id;

    if (!req.session.cart) {
      return res.redirect("/cart/giohang");
    }

    const cart = req.session.cart;
    const index = cart.items.findIndex((item) => item._id.toString() === productId);

    if (index > -1) {
      const removedItem = cart.items.splice(index, 1)[0];
      cart.totalPrice -= removedItem.price * removedItem.quantity;
    }

    res.redirect("/cart/giohang");
  }
}

module.exports = new CartController();