const Sanpham = require("../models/Sanpham");
const DonHang = require("../models/DonHang");
const Warehouse = require("../models/Warehouse");
const EmailService = require("../../services/EmailService");
const { createMomoPaymentUrl } = require("../../util/momoHelper");

const { getDistanceUsingHere } = require("../../util/distanceHelper");
const {
  geocodeAddress,
  calculateEstimatedDelivery,
  addDays,
  computeTravelTimeInDays,
} = require("../../util/geolocationHelper");
const { mongooseToObject } = require("../../util/mongoose");
const {
  getProvinceName,
  getDistrictName,
  getWardName,
} = require("../../util/addressHelper");
const moment = require("moment-timezone");

// === THÊM GEOCODING VALIDATOR ===
const {
  validateAndImproveGeocode,
  suggestAddressCorrections,
  standardizeVietnameseAddress,
} = require("../../util/geocodingValidator");

const { getRegionByProvince } = require("../../util/regions");

const fs = require("fs");
const path = require("path");

// Giả sử region là "Miền Nam", "Miền Bắc", ...
async function findNearestWarehouse(
  customerLocation,
  productId,
  quantity,
  region
) {
  let regionPriority = [];
  if (region === "Miền Bắc")
    regionPriority = ["Miền Bắc", "Miền Trung", "Miền Nam"];
  else if (region === "Miền Trung")
    regionPriority = ["Miền Trung", "Miền Bắc", "Miền Nam"];
  else if (region === "Miền Nam")
    regionPriority = ["Miền Nam", "Miền Trung", "Miền Bắc"];
  else regionPriority = [region];

  for (const reg of regionPriority) {
    let warehouses = await Warehouse.find({ region: reg });
    let closestWarehouse = null;
    let minDistance = Infinity;

    for (const warehouse of warehouses) {
      const productEntry = warehouse.products.find(
        (p) => p.productId.toString() === productId
      );
      if (productEntry && productEntry.quantity >= quantity) {
        const distance = await getDistanceUsingHere(
          `${warehouse.location.longitude},${warehouse.location.latitude}`,
          `${customerLocation.longitude},${customerLocation.latitude}`
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestWarehouse = warehouse;
        }
      }
    }
    if (closestWarehouse) return closestWarehouse;
  }
  return null;
}

function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "");
}

class CartController {
  async addToCart(req, res) {
    try {
      if (!req.session.user) {
        req.session.message =
          "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng!";
        return res.redirect("/auth/login");
      }

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

      req.session.message = `Đã thêm sản phẩm "${product.name}" vào giỏ hàng!`;
      res.redirect("/");
    } catch (err) {
      console.error(" Lỗi khi thêm vào giỏ:", err);
      res.status(500).send("Lỗi hệ thống");
    }
  }

  // Hiển thị giỏ hàng
  viewCart(req, res) {
    const cart = req.session.cart || { items: [], totalPrice: 0 };
    const totalQuantity = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
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
      totalPrice: formattedTotalPrice,
    });
  }

  async processCheckout(req, res) {
    try {
      console.log("📦 Nhận yêu cầu thanh toán:", req.body);
      const {
        name,
        phone,
        email,
        province,
        district,
        ward,
        detail,
        method,
        provinceName,
        districtName,
        wardName,
      } = req.body;

      // Xác định địa chỉ khách hàng
      let finalProvinceName, finalDistrictName, finalWardName;

      // Ưu tiên sử dụng tên từ form, nếu không có thì gọi API
      if (provinceName && districtName && wardName) {
        finalProvinceName = provinceName;
        finalDistrictName = districtName;
        finalWardName = wardName;
        console.log("✅ Sử dụng tên từ form");
      } else {
        console.log("⚠️ Không có tên từ form, gọi API...");
        finalProvinceName = await getProvinceName(province);
        finalDistrictName = await getDistrictName(district);
        finalWardName = await getWardName(ward, district);
      }

      const address = `${detail}, ${finalWardName}, ${finalDistrictName}, ${finalProvinceName}`;
      const region = getRegionByProvince(finalProvinceName);

      console.log("📍 Thông tin địa chỉ:");
      console.log("- Province Code:", province, "→", finalProvinceName);
      console.log("- District Code:", district, "→", finalDistrictName);
      console.log("- Ward Code:", ward, "→", finalWardName);
      console.log("- Full Address:", address);

      // === GEOCODING MỚI VỚI AUTO-VALIDATION & IMPROVEMENT ===
      let location = req.body.location;
      let geocodingInfo = null;

      if (!location || !location.latitude || !location.longitude) {
        console.log("🔄 Bắt đầu geocoding thông minh cho địa chỉ:", address);

        // Sử dụng hệ thống geocoding mới với multiple fallback
        const geocodingResult = await validateAndImproveGeocode(
          address,
          region.toLowerCase()
        );

        if (!geocodingResult.success) {
          console.error("❌ Geocoding thất bại:", geocodingResult.error);

          // Trả về lỗi với gợi ý cải thiện địa chỉ
          return res.status(400).json({
            error: "Không thể xác định vị trí chính xác của địa chỉ",
            details: {
              originalAddress: address,
              suggestions: geocodingResult.suggestions || [],
              message:
                "Vui lòng kiểm tra lại địa chỉ hoặc thử một trong các gợi ý sau:",
            },
          });
        }

        location = {
          latitude: geocodingResult.result.latitude,
          longitude: geocodingResult.result.longitude,
        };

        geocodingInfo = {
          confidence: geocodingResult.result.confidence,
          source: geocodingResult.result.source,
          improved: geocodingResult.improved || false,
          originalConfidence: geocodingResult.originalConfidence,
          displayName: geocodingResult.result.displayName,
        };

        // Log thông tin geocoding
        if (geocodingResult.improved) {
          console.log(
            `✨ Đã cải thiện geocoding! Confidence: ${geocodingResult.originalConfidence} → ${geocodingInfo.confidence}`
          );
        } else {
          console.log(
            `✅ Geocoding thành công với confidence: ${geocodingInfo.confidence} (${geocodingInfo.source})`
          );
        }

        // Cảnh báo nếu confidence thấp
        if (geocodingInfo.confidence < 0.7) {
          console.warn(
            `⚠️ Geocoding có confidence thấp (${geocodingInfo.confidence}). Địa chỉ có thể không chính xác.`
          );
        }
      }
      console.log("📍 Vị trí khách hàng:", location);

      // Tìm kho hàng gần nhất có đủ hàng
      const selectedWarehouse = await findNearestWarehouse(
        location,
        req.session.cart.items[0]._id,
        req.session.cart.items[0].quantity,
        region // thêm dòng này!
      );
      if (!selectedWarehouse) {
        return res.status(404).send("❌ Không có kho nào đủ hàng!");
      }
      console.log(`🚛 Đơn hàng sẽ xuất từ kho: ${selectedWarehouse.name}`);

      // Tính khoảng cách
      const distance = await getDistanceUsingHere(
        selectedWarehouse.location,
        location
      );
      if (distance === null) {
        return res.status(400).send("❌ Lỗi tính khoảng cách.");
      }

      // Tính ngày giao dự kiến
      const orderCreationDate = new Date();
      const speed = 40; // km/h
      const orderStatus = "Chờ xác nhận";
      const estimatedDeliveryUTC = calculateEstimatedDelivery(
        distance,
        speed,
        orderStatus,
        orderCreationDate,
        null
      );
      const estimatedDeliveryVietnam = moment(estimatedDeliveryUTC)
        .tz("Asia/Ho_Chi_Minh")
        .toDate();

      // Tạo đơn hàng mới
      const newOrder = new DonHang({
        userId: req.session.user._id,
        warehouseId: selectedWarehouse._id,
        name,
        phone,
        email: email || req.session.user.email,
        address,
        addressDetail: {
          province: { code: province, name: finalProvinceName },
          district: { code: district, name: finalDistrictName },
          ward: { code: ward, name: finalWardName },
          detail: detail,
        },
        region,
        items: req.session.cart.items,
        totalQuantity: req.session.cart.items.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        totalPrice: req.session.cart.totalPrice,
        paymentMethod: method,
        status: orderStatus,
        estimatedDelivery: estimatedDeliveryVietnam,
        customerLocation: location,
        geocodingInfo: geocodingInfo, // Lưu thông tin geocoding để theo dõi độ chính xác
      });

      await newOrder.save();
      console.log("✅ Đơn hàng đã lưu thành công:", newOrder);

      // Gửi email xác nhận đơn hàng
      try {
        if (newOrder.email) {
          await EmailService.sendOrderConfirmation(newOrder._id);
        }
      } catch (emailError) {
        console.error("Lỗi gửi email xác nhận đơn hàng:", emailError);
        // Không dừng quá trình thanh toán nếu email fail
      }

      // Xử lý thanh toán
      if (method === "momo") {
        req.session.lastOrder = {
          name,
          phone,
          address,
          items: newOrder.items,
          totalQuantity: newOrder.totalQuantity,
          totalPrice: newOrder.totalPrice,
          paymentMethodText: "Thanh toán qua MoMo",
          warehouseLocation: selectedWarehouse.location,
          customerLocation: location,
          order: newOrder, // nếu view cần dùng
        };
        const orderId = newOrder._id
          .toString()
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(-10);
        const orderInfo = `Thanh toan don hang ${orderId}`;
        const paymentUrl = await createMomoPaymentUrl({
          amount: newOrder.totalPrice,
          orderId,
          orderInfo,
          returnUrl: process.env.MOMO_RETURNURL,
        });
        return res.redirect(paymentUrl);
      } else {
        // Thanh toán tiền mặt
        req.session.cart = null;
        let paymentMethodText = "Thanh toán khi nhận hàng";
        return res.render("cart/thankyou", {
          name,
          phone,
          address,
          order: newOrder,
          totalQuantity: newOrder.totalQuantity,
          totalPrice: newOrder.totalPrice,
          paymentMethodText,
          warehouseLocation: selectedWarehouse.location,
          customerLocation: location,
        });
      }
    } catch (err) {
      console.error("❌ Lỗi khi xử lý thanh toán:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

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

  viewThankYou(req, res) {
    const lastOrder = req.session.lastOrder || {};
    req.session.lastOrder = null;
    res.render("cart/thankyou", {
      paymentMethodText: lastOrder.paymentMethodText || "Thanh toán qua MoMo",
      name: lastOrder.name,
      phone: lastOrder.phone,
      address: lastOrder.address,
      items: lastOrder.items || [],
      totalQuantity: lastOrder.totalQuantity,
      totalPrice: lastOrder.totalPrice,
      warehouseLocation: lastOrder.warehouseLocation,
      customerLocation: lastOrder.customerLocation,
      order: lastOrder.order,
    });
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
