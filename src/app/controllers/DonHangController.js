const mongoose = require("mongoose");
const DonHang = require("../models/DonHang");
const Warehouse = require("../models/Warehouse");
const User = require("../models/User");
const Product = require("../models/Sanpham");
const EmailService = require("../../services/EmailService");
const axios = require("axios");

// === THÊM IMPORT MỚI CHO AUTO-OPTIMIZATION ===
const mapService = require("../../util/mapService");
const vrpService = require("../../services/VRPService");

// === THÊM GEOCODING VALIDATOR ===
const {
  validateAndImproveGeocode,
  suggestAddressCorrections,
  standardizeVietnameseAddress,
} = require("../../util/geocodingValidator");

class DonHangController {
  // Lấy danh sách đơn hàng (admin)
  async index(req, res) {
    try {
      const orders = await DonHang.find()
        .sort({ createdAt: -1 })
        .populate("warehouseId");
      res.render("admin/qldonhang", { orders });
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  } // Xem chi tiết đơn hàng (admin)

  async viewOrderDetail(req, res) {
    try {
      const order = await DonHang.findById(req.params.id)
        .populate("warehouseId")
        .populate("assignedShipper");
      const shippers = await User.find({
        role: "shipper",
        region: order.region,
      });
      let paymentMethodText = "Không xác định";
      if (order.paymentMethod === "cash")
        paymentMethodText = "Thanh toán khi nhận hàng";
      if (order.paymentMethod === "vnpay")
        paymentMethodText = "Thanh toán qua VNPay";
      const estimatedDeliveryText = order.estimatedDelivery
        ? order.estimatedDelivery.toLocaleString("vi-VN")
        : "Chưa có";
      res.render("admin/order_detail", {
        order,
        shippers,
        paymentMethodText,
        estimatedDeliveryText,
      });
    } catch (err) {
      console.error("Lỗi khi xem chi tiết đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // === HÀM PHÂN TÍCH TẢI TRỌNG VÀ GỢI Ý SHIPPER TỐI ưU ===
  async getShipperWorkload(shipperId) {
    try {
      const activeOrders = await DonHang.find({
        assignedShipper: shipperId,
        status: { $in: ["Đang sắp xếp", "Đang vận chuyển"] },
      });

      const workload = {
        totalOrders: activeOrders.length,
        totalValue: activeOrders.reduce(
          (sum, order) => sum + order.totalPrice,
          0
        ),
        totalItems: activeOrders.reduce(
          (sum, order) => sum + order.totalQuantity,
          0
        ),
        averageDistance: 0, // Tính sau nếu cần
        lastAssignedAt:
          activeOrders.length > 0
            ? Math.max(...activeOrders.map((o) => o.updatedAt.getTime()))
            : 0,
      };

      return workload;
    } catch (error) {
      console.error("Lỗi tính tải trọng shipper:", error);
      return {
        totalOrders: 0,
        totalValue: 0,
        totalItems: 0,
        averageDistance: 0,
        lastAssignedAt: 0,
      };
    }
  }

  // Tự động gợi ý shipper tốt nhất cho đơn hàng
  async suggestBestShipper(orderId) {
    try {
      const order = await DonHang.findById(orderId);
      if (!order) return null;

      // 1. Lấy tất cả shipper trong cùng vùng
      const availableShippers = await User.find({
        role: "shipper",
        region: order.region,
      });

      if (availableShippers.length === 0) {
        console.warn(`⚠️ Không có shipper nào trong vùng ${order.region}`);
        return null;
      }

      // 2. Phân tích tải trọng từng shipper
      const shipperAnalysis = await Promise.all(
        availableShippers.map(async (shipper) => {
          const workload = await this.getShipperWorkload(shipper._id);

          // Tính điểm ưu tiên (thấp hơn = tốt hơn)
          const priorityScore =
            workload.totalOrders * 10 + // Số đơn hiện tại
            workload.totalItems * 2 + // Tổng sản phẩm
            (workload.totalValue / 100000) * 5; // Giá trị đơn hàng (chia 100k để chuẩn hóa)

          return {
            shipper,
            workload,
            priorityScore,
            lastAssignedHours:
              workload.lastAssignedAt > 0
                ? (Date.now() - workload.lastAssignedAt) / (1000 * 60 * 60)
                : 999,
          };
        })
      );

      // 3. Sắp xếp theo thứ tự ưu tiên
      shipperAnalysis.sort((a, b) => {
        // Ưu tiên shipper có ít đơn hơn
        if (a.workload.totalOrders !== b.workload.totalOrders) {
          return a.workload.totalOrders - b.workload.totalOrders;
        }

        // Nếu cùng số đơn, ưu tiên shipper được gán lâu hơn
        if (Math.abs(a.lastAssignedHours - b.lastAssignedHours) > 2) {
          return b.lastAssignedHours - a.lastAssignedHours;
        }

        // Cuối cùng theo điểm priority
        return a.priorityScore - b.priorityScore;
      });

      const bestShipper = shipperAnalysis[0];

      console.log(`🎯 Gợi ý shipper tốt nhất cho đơn ${orderId}:`);
      console.log(
        `- Shipper: ${bestShipper.shipper.name} (${bestShipper.shipper._id})`
      );
      console.log(`- Đơn hiện tại: ${bestShipper.workload.totalOrders}`);
      console.log(`- Tổng sản phẩm: ${bestShipper.workload.totalItems}`);
      console.log(
        `- Gán lần cuối: ${bestShipper.lastAssignedHours.toFixed(1)}h trước`
      );
      console.log(`- Điểm ưu tiên: ${bestShipper.priorityScore.toFixed(2)}`);

      return bestShipper.shipper;
    } catch (error) {
      console.error("Lỗi gợi ý shipper:", error);
      return null;
    }
  }

  // Tự động gán shipper (dành cho admin muốn gán tự động)
  async autoAssignShipper(req, res) {
    const self = this; // Lưu context
    try {
      const orderId = req.params.id;

      const suggestedShipper = await self.suggestBestShipper(orderId);
      if (!suggestedShipper) {
        return res.status(404).json({
          error: "Không tìm thấy shipper phù hợp",
          suggestion: "Vui lòng gán thủ công hoặc kiểm tra lại vùng giao hàng",
        });
      }

      // Gán shipper được gợi ý
      req.body.shipperId = suggestedShipper._id.toString();
      return await self.assignShipper(req, res);
    } catch (error) {
      console.error("Lỗi tự động gán shipper:", error);
      return res.status(500).json({ error: "Lỗi hệ thống" });
    }
  }

  // === HÀM ĐÃ NÂNG CẤP - AUTO OPTIMIZATION ===
  // Gán shipper cho đơn hàng (admin) - Tích hợp Geocoding + Auto Optimize
  async assignShipper(req, res) {
    try {
      const { shipperId } = req.body;
      const orderId = req.params.id;

      // 1. Lấy đơn hàng
      const order = await DonHang.findById(orderId);
      if (!order) {
        return res.status(404).send("Không tìm thấy đơn hàng.");
      }

      // 2. LẤY TỌA ĐỘ (LOGIC "LỰA CHỌN A")
      let coords = null;
      // Chỉ geocode nếu chưa có tọa độ hoặc địa chỉ đã thay đổi
      if (order.address && !order.customerLocation?.latitude) {
        console.log(`Đang Geocode cho địa chỉ: ${order.address}`);
        coords = await mapService.geocodeAddress(order.address);
      }

      // 3. Cập nhật đơn hàng
      order.assignedShipper = shipperId;
      order.status = "Đang sắp xếp"; // Trạng thái sẵn sàng cho shipper

      if (coords) {
        // 4. LƯU TỌA ĐỘ VÀO DATABASE
        order.customerLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        console.log("✅ Đã lưu tọa độ vào đơn hàng!");
      } else if (order.customerLocation?.latitude) {
        console.log("ℹ️ Đơn hàng đã có tọa độ từ trước.");
      } else {
        console.warn(`⚠️ Không tìm thấy tọa độ cho đơn hàng ${orderId}`);
      }

      // 5. Lưu đơn hàng trước
      await order.save();

      // === 6. 🚀 AUTO-OPTIMIZE TẤT CẢ ĐƠN HÀNG CỦA SHIPPER ===
      console.log(`🧠 Bắt đầu tối ưu lộ trình cho shipper ${shipperId}...`);
      await this.autoOptimizeShipperRoute(shipperId);

      // 7. Redirect với thông báo thành công
      res.redirect("/admin/qldonhang");
    } catch (err) {
      console.error("❌ Lỗi khi gán shipper:", err);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  // === HÀM MỚI: TỰ ĐỘNG TỐI ƯU LỘ TRÌNH ===
  async autoOptimizeShipperRoute(shipperId) {
    try {
      const User = require("../models/User");
      const Warehouse = require("../models/Warehouse");
      const { getDistanceMatrix } = require("../../util/mapService");

      // 1. Lấy thông tin shipper
      const shipper = await User.findById(shipperId);
      if (!shipper || shipper.role !== "shipper") {
        console.error("❌ Không tìm thấy shipper hợp lệ");
        return false;
      }

      // 2. Tìm kho hàng theo vùng
      const warehouse = await Warehouse.findOne({ region: shipper.region });
      if (!warehouse || !warehouse.location) {
        console.error("❌ Không tìm thấy kho hàng cho vùng:", shipper.region);
        return false;
      }

      // 3. Lấy tất cả đơn hàng active của shipper (bao gồm cả đang vận chuyển)
      const ordersToOptimize = await DonHang.find({
        assignedShipper: shipperId,
        status: { $in: ["Đang sắp xếp", "Đang vận chuyển"] },
      });

      console.log(
        `📦 Tìm thấy ${ordersToOptimize.length} đơn hàng của shipper ${shipperId} cần tối ưu`
      );

      if (ordersToOptimize.length === 0) {
        console.log("ℹ️ Không có đơn hàng nào cần tối ưu");
        return true;
      }

      if (ordersToOptimize.length === 1) {
        // Chỉ có 1 đơn hàng, set routeOrder = 1
        const singleOrder = ordersToOptimize[0];
        singleOrder.routeOrder = 1;
        singleOrder.optimizedAt = new Date();
        await singleOrder.save();
        console.log(
          `📦 Đơn duy nhất ${singleOrder._id.toString().slice(-6)} → Thứ tự: 1`
        );
        return true;
      }

      // 4. Chuẩn bị danh sách tọa độ
      const points = [
        {
          latitude: warehouse.location.latitude,
          longitude: warehouse.location.longitude,
        },
      ];
      const validOrders = [];

      ordersToOptimize.forEach((order) => {
        if (order.customerLocation && order.customerLocation.latitude) {
          points.push({
            latitude: order.customerLocation.latitude,
            longitude: order.customerLocation.longitude,
          });
          validOrders.push(order);
        } else {
          console.warn(`⚠️ Đơn hàng ${order._id} thiếu tọa độ, bỏ qua tối ưu`);
        }
      });

      if (validOrders.length === 0) {
        console.log("❌ Không có đơn hàng nào có tọa độ hợp lệ");
        return false;
      }

      // 5. Gọi OSRM để lấy ma trận khoảng cách
      console.log(
        `🗺️ Đang tính ma trận khoảng cách cho ${points.length} điểm...`
      );
      console.log(
        "📍 Danh sách tọa độ:",
        points.map(
          (p, i) =>
            `${i}: (${p.latitude}, ${p.longitude}) ${i === 0 ? "(Kho)" : "(Đơn " + validOrders[i - 1]._id.toString().slice(-6) + ")"}`
        )
      );

      const distanceMatrix = await getDistanceMatrix(points);

      if (!distanceMatrix) {
        console.error("❌ Không thể lấy ma trận từ OSRM");
        return false;
      }

      console.log("🔢 Ma trận khoảng cách (km):");
      distanceMatrix.forEach((row, i) => {
        console.log(`   ${i}: [${row.map((d) => d.toFixed(1)).join(", ")}]`);
      });

      // 6. Chạy thuật toán VRP
      console.log(`🤖 Đang chạy thuật toán tối ưu...`);
      const routeIndices = vrpService.solveNearestNeighbor(distanceMatrix);
      console.log("🎯 Lộ trình tối ưu (indices):", routeIndices);

      // 7. Cập nhật routeOrder cho từng đơn hàng
      console.log("📋 Kết quả tối ưu từ VRP:", routeIndices);

      const updatePromises = [];
      let actualRoutePosition = 1; // Bắt đầu từ 1 (0 là kho)

      for (let i = 0; i < routeIndices.length; i++) {
        const index = routeIndices[i];

        if (index === 0) {
          // Điểm 0 là kho, bỏ qua
          console.log(`🏪 Vị trí ${i}: Kho hàng (điểm xuất phát)`);
          continue;
        }

        const orderToUpdate = validOrders[index - 1];
        orderToUpdate.routeOrder = actualRoutePosition;
        orderToUpdate.optimizedAt = new Date();

        console.log(
          `📦 Vị trí ${i}: Đơn ${orderToUpdate._id.toString().slice(-6)} → Thứ tự: ${actualRoutePosition}`
        );
        updatePromises.push(orderToUpdate.save());
        actualRoutePosition++;
      }

      await Promise.all(updatePromises);

      console.log(`✅ Tối ưu thành công ${validOrders.length} đơn hàng!`);
      return true;
    } catch (error) {
      console.error("💥 Lỗi trong autoOptimizeShipperRoute:", error);
      return false;
    }
  }

  // Hủy gán shipper cho đơn hàng
  async unassignShipper(req, res) {
    try {
      const orderId = req.params.id;

      const order = await DonHang.findById(orderId);
      if (!order) {
        return res.status(404).send("Không tìm thấy đơn hàng.");
      }

      const previousShipperId = order.assignedShipper;

      // Xóa thông tin shipper và reset route optimization
      order.assignedShipper = null;
      order.routeOrder = 0;
      order.optimizedAt = null;
      order.status = "Chờ xác nhận"; // Reset về trạng thái chờ xác nhận

      await order.save();

      console.log(`✅ Đã hủy gán shipper cho đơn hàng ${orderId}`);

      // Nếu có shipper trước đó, tối ưu lại các đơn còn lại của shipper đó
      if (previousShipperId) {
        console.log(
          `🔄 Đang tối ưu lại lộ trình cho shipper ${previousShipperId}...`
        );
        await this.autoOptimizeShipperRoute(previousShipperId);
      }

      res.redirect(`/admin/donhang/${orderId}`);
    } catch (error) {
      console.error("Lỗi hủy gán shipper:", error);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Cập nhật trạng thái đơn hàng (admin)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await DonHang.findById(id).populate("warehouseId");
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng!");

      const prevStatus = order.status; // Nếu chuyển sang "Đang vận chuyển" hoặc "Đã giao" thì trừ kho

      if (
        (status === "Đang vận chuyển" || status === "Đã giao") &&
        order.warehouseId &&
        prevStatus !== "Đang vận chuyển" &&
        prevStatus !== "Đã giao"
      ) {
        const warehouse = order.warehouseId;
        order.items.forEach((item) => {
          const productInWarehouse = warehouse.products.find(
            (p) => p.productId.toString() === item._id.toString()
          );
          if (productInWarehouse) {
            productInWarehouse.quantity -= item.quantity;
            if (productInWarehouse.quantity < 0)
              productInWarehouse.quantity = 0;
          }
        });
        await warehouse.save();
      } // Nếu chuyển từ "Đã giao" hoặc "Hoàn thành" về trạng thái khác thì cộng lại kho

      if (
        (prevStatus === "Đã giao" || prevStatus === "Hoàn thành") &&
        status !== "Đã giao" &&
        status !== "Hoàn thành" &&
        order.warehouseId
      ) {
        const warehouse = order.warehouseId;
        order.items.forEach((item) => {
          const productInWarehouse = warehouse.products.find(
            (p) => p.productId.toString() === item._id.toString()
          );
          if (productInWarehouse) {
            productInWarehouse.quantity += item.quantity;
          }
        });
        await warehouse.save();
      }

      order.status = status;
      await order.save(); // Gửi email thông báo cập nhật trạng thái

      try {
        if (order.email) {
          await EmailService.sendOrderStatusUpdate(order._id, status);
        }
      } catch (emailError) {
        console.error("Lỗi gửi email cập nhật trạng thái:", emailError);
      }

      res.redirect("/admin/donhang");
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  } // Xác nhận đã nhận hàng (user)

  async confirmReceived(req, res) {
    try {
      const { id } = req.params;
      const order = await DonHang.findById(id).populate("warehouseId");
      if (!order || order.status !== "Đã giao") {
        return res
          .status(400)
          .send("Đơn hàng không hợp lệ hoặc đã được xác nhận.");
      }
      const warehouse = order.warehouseId;
      if (warehouse) {
        order.items.forEach((item) => {
          const productInWarehouse = warehouse.products.find(
            (p) => p.productId.toString() === item._id.toString()
          );
          if (productInWarehouse) {
            productInWarehouse.quantity -= item.quantity;
            if (productInWarehouse.quantity < 0)
              productInWarehouse.quantity = 0;
          }
        });
        await warehouse.save();
      }
      order.status = "Hoàn thành";
      await order.save();
      res.redirect(`/donhang/${id}`);
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  } // Hủy đơn hàng (user)

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const order = await DonHang.findById(id);
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng.");
      if (order.status !== "Chờ xác nhận") {
        return res.status(400).send("Không thể hủy đơn hàng ở trạng thái này.");
      }
      order.status = "Đã hủy";
      order.cancelReason = reason;
      await order.save();
      return res.redirect(`/donhang/${id}`);
    } catch (err) {
      return res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  } // Xem chi tiết đơn hàng (user)

  async viewOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await DonHang.findById(id)
        .populate("warehouseId")
        .populate("assignedShipper");
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng.");
      let paymentMethodText = "Không xác định";
      if (order.paymentMethod === "cash")
        paymentMethodText = "Thanh toán khi nhận hàng";
      if (order.paymentMethod === "vnpay")
        paymentMethodText = "Thanh toán qua VNPay";
      const estimatedDeliveryText = order.estimatedDelivery
        ? order.estimatedDelivery.toLocaleString("vi-VN")
        : "Chưa có";
      res.render("user/chitietdonhang", {
        estimatedDeliveryText,
        paymentMethodText,
        order,
      });
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  } // Lấy danh sách đơn hàng của user

  async userOrders(req, res) {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }
    const userId = req.session.user._id;
    const allOrders = await DonHang.find({ userId }).sort({ createdAt: -1 });
    const ordersPending = allOrders.filter(
      (o) => o.status === "Chờ xác nhận" || o.status === "Đang sắp xếp"
    );
    const ordersShipping = allOrders.filter(
      (o) => o.status === "Đang vận chuyển"
    );
    const ordersDelivered = allOrders.filter(
      (o) => o.status === "Đã giao" || o.status === "Hoàn thành"
    );
    const ordersCanceled = allOrders.filter((o) => o.status === "Đã hủy");
    res.render("user/donhangme", {
      ordersPending,
      ordersShipping,
      ordersDelivered,
      ordersCanceled,
    });
  } // Tìm kho gần nhất có hàng (dùng cho đặt hàng)

  async findNearestWarehouse(customerLocation, productId, quantity) {
    const warehouses = await Warehouse.find();
    let closestWarehouse = null;
    let minDistance = Infinity;
    for (const warehouse of warehouses) {
      if (
        !warehouse.location ||
        !warehouse.location.latitude ||
        !warehouse.location.longitude
      )
        continue;
      const productEntry = warehouse.products.find(
        (p) => p.productId.toString() === productId
      );
      if (productEntry && productEntry.quantity >= quantity) {
        // Sửa lỗi: warehouse.location không tồn tại trong model,
        // Giả sử model Warehouse của bạn có 'coordinates: { latitude, longitude }'
        const distance = await this.getDistance(
          {
            latitude: warehouse.coordinates.latitude,
            longitude: warehouse.coordinates.longitude,
          },
          customerLocation
        );
        if (distance !== null && distance < minDistance) {
          minDistance = distance;
          closestWarehouse = warehouse;
        }
      }
    }
    return closestWarehouse;
  } // === HÀM ĐÃ NÂNG CẤP ===
  // Hàm phụ trợ tính khoảng cách (sử dụng OSRM)

  async getDistance(from, to) {
    // from và to là { latitude, longitude }

    // OSRM dùng format: {lon},{lat}
    const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    // Đảm bảo "bộ não" OSRM của bạn đang chạy ở 127.0.0.1:5000
    const url = `http://127.0.0.1:5000/route/v1/driving/${coords}`;

    try {
      const response = await axios.get(url);
      const route = response.data.routes[0];

      if (route && route.distance) {
        return route.distance; // Trả về khoảng cách (bằng mét)
      }
      return null; // Không tìm thấy đường
    } catch (error) {
      console.error("Lỗi khi gọi OSRM cho getDistance:", error.message);
      return null;
    }
  } // Tổng kết doanh thu và số lượng bán

  async summary(req, res) {
    try {
      const { from, to } = req.query;
      const filter = { status: "Hoàn thành" };

      if (from || to) {
        filter.updatedAt = {};
        if (from) filter.updatedAt.$gte = new Date(from);
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          filter.updatedAt.$lte = toDate;
        }
      }

      const orders = await DonHang.find(filter);

      let totalRevenue = 0,
        totalSold = 0;
      let cashRevenue = 0,
        momoRevenue = 0;
      let cashSold = 0,
        momoSold = 0;

      orders.forEach((order) => {
        totalRevenue += order.totalPrice || 0;
        totalSold += order.totalQuantity || 0;
        if (order.paymentMethod === "cash") {
          cashRevenue += order.totalPrice || 0;
          cashSold += order.totalQuantity || 0;
        }
        if (order.paymentMethod === "momo") {
          momoRevenue += order.totalPrice || 0;
          momoSold += order.totalQuantity || 0;
        }
      });

      res.render("admin/summary", {
        totalRevenue,
        totalSold,
        cashRevenue,
        momoRevenue,
        cashSold,
        momoSold,
        orders,
        query: req.query,
      });
    } catch (err) {
      res.status(500).send("Lỗi hệ thống khi tổng kết doanh thu!");
    }
  }

  // Debug endpoint để force optimize (không cần auth)
  async debugForceOptimize(req, res) {
    try {
      const { shipperId } = req.params;

      if (shipperId) {
        // Optimize specific shipper
        console.log(`🔧 DEBUG: Force optimizing shipper ${shipperId}`);
        const success = await this.autoOptimizeShipperRoute(shipperId);

        res.json({
          success,
          message: success
            ? `Đã tối ưu shipper ${shipperId}`
            : `Lỗi khi tối ưu shipper ${shipperId}`,
          shipperId,
        });
      } else {
        // Optimize all unoptimized orders
        const unoptimizedOrders = await DonHang.find({
          status: { $in: ["Đang sắp xếp", "Đang vận chuyển"] },
          routeOrder: { $in: [0, null] },
          assignedShipper: { $ne: null },
        }).populate("assignedShipper");

        console.log(
          `🔧 DEBUG: Found ${unoptimizedOrders.length} unoptimized orders`
        );

        const shipperGroups = {};
        unoptimizedOrders.forEach((order) => {
          const sId = order.assignedShipper._id.toString();
          if (!shipperGroups[sId]) {
            shipperGroups[sId] = [];
          }
          shipperGroups[sId].push(order._id.toString().slice(-6));
        });

        let totalOptimized = 0;
        for (const [sId, orders] of Object.entries(shipperGroups)) {
          console.log(
            `🔧 Optimizing shipper ${sId} với ${orders.length} đơn: [${orders.join(", ")}]`
          );
          const success = await this.autoOptimizeShipperRoute(sId);
          if (success) totalOptimized += orders.length;
        }

        res.json({
          success: true,
          message: `Đã tối ưu ${totalOptimized} đơn hàng`,
          totalOptimized,
          shipperGroups,
        });
      }
    } catch (error) {
      console.error("Debug force optimize error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Force optimize tất cả đơn hàng chưa có routeOrder
  async forceOptimizeAllShippers(req, res) {
    try {
      const allShippers = await User.find({ role: "shipper" });
      let totalOptimized = 0;

      for (const shipper of allShippers) {
        // Tìm các đơn hàng chưa được tối ưu (routeOrder = 0)
        const unoptimizedOrders = await DonHang.find({
          assignedShipper: shipper._id,
          status: { $in: ["Đang sắp xếp", "Đang vận chuyển"] },
          routeOrder: { $in: [0, null] },
        });

        if (unoptimizedOrders.length > 0) {
          console.log(
            `🔄 Tối ưu ${unoptimizedOrders.length} đơn hàng cho shipper ${shipper.name}`
          );
          const success = await this.autoOptimizeShipperRoute(shipper._id);
          if (success) totalOptimized += unoptimizedOrders.length;
        }
      }

      res.json({
        success: true,
        message: `Đã tối ưu ${totalOptimized} đơn hàng cho tất cả shipper`,
        totalOptimized,
      });
    } catch (error) {
      console.error("Lỗi force optimize:", error);
      res.status(500).json({ error: "Lỗi hệ thống" });
    }
  }

  // Dashboard quản lý shipper với thống kê tải trọng
  async shipperDashboard(req, res) {
    try {
      // Lấy tất cả shipper
      const allShippers = await User.find({ role: "shipper" });

      // Phân tích tải trọng từng shipper
      const shipperStats = await Promise.all(
        allShippers.map(async (shipper) => {
          const workload = await this.getShipperWorkload(shipper._id);

          // Lấy thêm thống kê đơn hàng theo trạng thái
          const ordersByStatus = await DonHang.aggregate([
            { $match: { assignedShipper: shipper._id } },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalValue: { $sum: "$totalPrice" },
              },
            },
          ]);

          const statusStats = {};
          ordersByStatus.forEach((stat) => {
            statusStats[stat._id] = {
              count: stat.count,
              totalValue: stat.totalValue,
            };
          });

          return {
            shipper,
            workload,
            statusStats,
            efficiency:
              workload.totalOrders > 0
                ? (workload.totalValue / workload.totalOrders).toFixed(0)
                : 0, // Giá trị trung bình/đơn
          };
        })
      );

      // Sắp xếp theo hiệu quả (giá trị/đơn hàng cao nhất)
      shipperStats.sort((a, b) => b.efficiency - a.efficiency);

      // Thống kê tổng quan
      const totalActiveOrders = await DonHang.countDocuments({
        status: { $in: ["Đang sắp xếp", "Đang vận chuyển"] },
      });

      const unassignedOrders = await DonHang.countDocuments({
        assignedShipper: null,
        status: { $in: ["Chờ xác nhận", "Chờ thanh toán"] },
      });

      res.render("admin/shipper_dashboard", {
        shipperStats,
        totalActiveOrders,
        unassignedOrders,
        title: "Quản lý Shipper",
      });
    } catch (error) {
      console.error("Lỗi dashboard shipper:", error);
      res.status(500).send("Lỗi hệ thống!");
    }
  }
}

const donHangController = new DonHangController();

// Bind tất cả methods để đảm bảo context this đúng
Object.getOwnPropertyNames(DonHangController.prototype)
  .filter(
    (name) =>
      name !== "constructor" && typeof donHangController[name] === "function"
  )
  .forEach((name) => {
    donHangController[name] = donHangController[name].bind(donHangController);
  });

module.exports = donHangController;
