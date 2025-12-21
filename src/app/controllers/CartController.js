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
function isCity(districtName) {
  // Đơn giản: nếu tên chứa "Quận", "TP", "Thành phố" thì là thành phố
  const cityKeywords = ["Quận", "TP", "Thành phố", "City", "Huyện đảo"];
  return cityKeywords.some((kw) => districtName && districtName.includes(kw));
}
// Giả sử region là "Miền Nam", "Miền Bắc", ...
async function findNearestWarehouse(
  customerLocation,
  productId,
  quantity,
  districtName // truyền vào tên quận/huyện/thành phố của khách
) {
  // 1. Tìm kho trong cùng quận/huyện/thành phố
  let warehouses = await Warehouse.find({
    district: districtName,
    type: "regional",
  });
  let closestWarehouse = await getClosestWarehouse(
    warehouses,
    customerLocation,
    productId,
    quantity
  );
  if (closestWarehouse) return closestWarehouse;

  // 2. Nếu không có, duyệt tất cả kho regional trên toàn quốc
  warehouses = await Warehouse.find({ type: "regional" });
  closestWarehouse = await getClosestWarehouse(
    warehouses,
    customerLocation,
    productId,
    quantity
  );
  if (closestWarehouse) return closestWarehouse;

  return null;
}

// Hàm phụ như cũ
async function getClosestWarehouse(
  warehouses,
  customerLocation,
  productId,
  quantity
) {
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
  return closestWarehouse;
}

// Hàm phụ: tìm kho gần nhất trong danh sách truyền vào, có đủ hàng
async function getClosestWarehouse(
  warehouses,
  customerLocation,
  productId,
  quantity
) {
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
  return closestWarehouse;
}

function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "");
}

function getDeliveryTimeWindowByTruckAndArea(
  truckWeightKg,
  districtName,
  orderCreationDate
) {
  const city = isCity(districtName);
  const pad = (n) => n.toString().padStart(2, "0");

  // Chuyển sang giờ Việt Nam
  const vnDate = new Date(orderCreationDate.getTime() + 7 * 60 * 60 * 1000);
  const hour = vnDate.getHours();
  const minute = vnDate.getMinutes();

  if (truckWeightKg < 950) {
    if (hour < 8) {
      // Đặt trước 8h sáng: giao 08:00-12:00 cùng ngày
      const deliveryDateStr = `${pad(vnDate.getDate())}/${pad(vnDate.getMonth() + 1)}/${vnDate.getFullYear()}`;
      return `${deliveryDateStr} 08:00-12:00`;
    } else if (hour >= 8 && hour < 24) {
      // Trong khung 8-24h: giao từ lúc đặt đến đặt+6 tiếng, không vượt quá 24h
      const start = new Date(vnDate);
      const end = new Date(vnDate);
      end.setHours(Math.min(end.getHours() + 6, 24), minute);
      const dateStr = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`;
      const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      const endStr = end.getHours() === 24 ? "24:00" : `${pad(end.getHours())}:${pad(end.getMinutes())}`;
      return `${dateStr} ${startStr}-${endStr}`;
    } else {
      // Đặt sau 24h (gần như không xảy ra, nhưng để phòng)
      let deliveryDate = new Date(vnDate);
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      const deliveryDateStr = `${pad(deliveryDate.getDate())}/${pad(deliveryDate.getMonth() + 1)}/${deliveryDate.getFullYear()}`;
      return `${deliveryDateStr} 08:00-12:00`;
    }
  } else if (truckWeightKg >= 950 && truckWeightKg < 2500) {
    const dateStr = `${pad(vnDate.getDate())}/${pad(vnDate.getMonth() + 1)}/${vnDate.getFullYear()}`;
    if (city) {
      if (hour >= 20 || hour < 12) {
        return `${dateStr} 09:00-12:00`;
      } else {
        return `${dateStr} 20:00-24:00`;
      }
    } else {
      return `${dateStr} 08:00-24:00`;
    }
  } else {
    // >= 2.5 tấn
    const dateStr = `${pad(vnDate.getDate())}/${pad(vnDate.getMonth() + 1)}/${vnDate.getFullYear()}`;
    if (city) {
      return `${dateStr} 22:00-06:00`;
    } else {
      return `${dateStr} 24/24`;
    }
  }
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

      // === GEOCODING MỚI VỚI AUTO-VALIDATION & IMPROVEMENT ===
      let location = req.body.location;
      let geocodingInfo = null;

      if (!location || !location.latitude || !location.longitude) {
        const geocodingResult = await validateAndImproveGeocode(
          address,
          region.toLowerCase()
        );
        if (!geocodingResult.success) {
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
      }
      console.log("📍 Vị trí khách hàng:", location);

      // Tìm kho hàng gần nhất có đủ hàng
      const selectedWarehouse = await findNearestWarehouse(
        location,
        req.session.cart.items[0]._id,
        req.session.cart.items[0].quantity,
        region
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

      // === TÍNH TỔNG TRỌNG LƯỢNG VÀ THỂ TÍCH ===
      let totalWeight = 0;
      let totalVolume = 0;
      for (const item of req.session.cart.items) {
        const product = await Sanpham.findById(item._id);
        if (product) {
          totalWeight += (product.weight || 0) * item.quantity;
          // Đảm bảo lấy đúng volume đã được tính ở model
          totalVolume +=
            (product.volume ||
              ((product.length || 0) *
                (product.width || 0) *
                (product.height || 0)) /
                1000000) * item.quantity;
        }
      }
      const Truck = require("../models/Truck");
      const trucks = await Truck.find({
        maxWeight: { $gte: totalWeight },
        boxVolumeM3: { $gte: totalVolume },
        warehouseId: selectedWarehouse._id,
      }).sort({ maxWeight: 1 });

      let truckWeightKg = 950; // mặc định
      if (trucks.length > 0) {
        truckWeightKg = trucks[0].maxWeight;
      }
      const deliveryTimeWindow = getDeliveryTimeWindowByTruckAndArea(
        truckWeightKg,
        finalDistrictName,
        orderCreationDate
      );
      console.log("DEBUG:", {
        truckWeightKg,
        finalDistrictName,
        orderCreationDate,
        deliveryTimeWindow,
      });

      // Tạo đơn hàng mới
      const newOrder = new DonHang({
        userId: req.session.user._id,
        warehouseId: selectedWarehouse._id,
        name,
        phone,
        deliveryTimeWindow,
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
        totalWeight,
        totalVolume,
        paymentMethod: method,
        status: orderStatus,
        estimatedDelivery: estimatedDeliveryVietnam,
        customerLocation: location,
        geocodingInfo: geocodingInfo,
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
          order: newOrder,
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
