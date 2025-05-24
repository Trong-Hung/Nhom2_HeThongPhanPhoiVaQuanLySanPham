const DonHang = require("../models/DonHang");
const User = require("../models/User");
const axios = require("axios");

const { getRoute, geocode } = require("../../util/mapService");








class ShipperController {
  // 🔥 Hiển thị danh sách đơn hàng "Đang sắp xếp" theo vùng của shipper
  async showPendingOrders(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).send("❌ Bạn không có quyền truy cập đơn hàng.");
      }
      


      const shipperRegion = req.session.user.region;
      console.log("📌 Kiểm tra vùng miền shipper:", shipperRegion);

      const orders = await DonHang.find({ status: "Đang sắp xếp", region: shipperRegion });
      console.log("📦 Đơn hàng đang sắp xếp:", orders);
      console.log("📦 Kết quả truy vấn đơn hàng:", orders);

      res.render("shipper/dang_sap_xep", { orders });
    } catch (err) {
      console.error("❌ Lỗi khi tải đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  // 🔥 Hiển thị danh sách đơn hàng "Đang vận chuyển" mà shipper đang giao
 async showActiveOrders(req, res) {
  try {
    if (!req.session.user || req.session.user.role !== "shipper") {
      return res.status(403).send("❌ Bạn không có quyền truy cập đơn hàng.");
    }

    // 🔥 Kiểm tra dữ liệu shipper trong session
    console.log("📌 Kiểm tra toàn bộ session user:", req.session.user);

    const shipperId = req.session.user._id;
    const shipperRegion = req.session.user.region;

    if (!shipperId || !shipperRegion) {
      console.log("❌ Không tìm thấy thông tin shipper.");
      return res.status(400).send("Lỗi: Không có thông tin vùng miền của shipper.");
    }

    console.log("📌 ID shipper:", shipperId);
    console.log("📌 Vùng miền shipper:", shipperRegion);

    // 🔥 Kiểm tra có đơn hàng nào đúng với vùng miền và shipper không
    const orders = await DonHang.find({ status: "Đang vận chuyển", assignedShipper: shipperId, region: shipperRegion });

    console.log("📦 Đơn hàng đang vận chuyển:", orders.length > 0 ? orders : "❌ Không có đơn hàng phù hợp");

    res.render("shipper/dang_van_chuyen", { orders });
  } catch (err) {
    console.error("❌ Lỗi khi tải đơn hàng:", err);
    res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
  }
}


  // 🔥 API xác nhận đơn hàng từ "Đang sắp xếp" → "Đang vận chuyển"
  async confirmOrder(req, res) {
  try {
    const orderId = req.params.id;
    const shipperId = req.session.user._id;
    const shipperRegion = req.session.user.region;

    console.log("📌 Xác nhận đơn hàng:", { orderId, shipperId, shipperRegion });

    const order = await DonHang.findById(orderId);
    if (!order) {
      console.log("❌ Không tìm thấy đơn hàng.");
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
    }

    if (order.status !== "Đang sắp xếp") {
      console.log("❌ Đơn hàng không hợp lệ:", order.status);
      return res.status(400).json({ success: false, message: "Đơn hàng không ở trạng thái hợp lệ." });
    }

    // 🔥 Cập nhật trạng thái và shipper nhận đơn
    order.assignedShipper = shipperId;
    order.status = "Đang vận chuyển";
    await order.save();

    console.log(`✅ Đơn hàng ${orderId} đã được giao cho shipper ${shipperId} tại vùng ${shipperRegion}`);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi xác nhận đơn hàng:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
}


  // 🔥 API chỉ đường từ vị trí shipper đến địa chỉ giao hàng







  // 🔥 Các phương thức trong class của bạn

async getDirections(req, res) {
    try {
        const orderId = req.params.id;
        const order = await DonHang.findById(orderId);

        if (!order || order.status !== "Đang vận chuyển") {
            console.error("❌ Đơn hàng chưa được nhận hoặc không hợp lệ.");
            return res.status(404).send("❌ Đơn hàng chưa được nhận hoặc không hợp lệ.");
        }

        let warehouseLocation = "Quận 1, Thành phố Hồ Chí Minh";
        let destinationLocation = order.address;

        console.log("📌 Địa chỉ giao hàng:", destinationLocation);

        const warehouseCoords = await geocode(warehouseLocation);
        const destinationCoords = await geocode(destinationLocation);

        if (!warehouseCoords || !destinationCoords) {
            console.error("❌ Không thể lấy tọa độ!");
            return res.status(404).send("Không thể lấy tọa độ.");
        }

        console.log("📌 Tọa độ xuất phát:", warehouseCoords);
        console.log("📌 Tọa độ điểm giao hàng:", destinationCoords);

        // 🔥 Gửi request tìm đường với `steps=true` để lấy hướng dẫn di chuyển
        const route = await getRoute(
            `${warehouseCoords.lat},${warehouseCoords.lon}`,
            `${destinationCoords.lat},${destinationCoords.lon}`,
            { steps: true, overview: "full", geometries: "geojson" } // 🔥 Bật hướng dẫn chi tiết
        );

        if (!route) {
            console.error("❌ Không tìm thấy tuyến đường.");
            return res.status(404).send("Không tìm thấy tuyến đường.");
        }

        console.log(`✅ Lộ trình tìm thấy:`);
        console.log(`📏 Khoảng cách: ${(route.distance / 1000).toFixed(2)} km`);
        console.log(`⏳ Thời gian dự kiến: ${Math.round(route.duration / 60)} phút`);
        console.log("🔥 Dữ liệu tuyến đường:", route.geometry.coordinates);
        console.log("🔥 Kiểm tra toàn bộ phản hồi API:", JSON.stringify(route, null, 2));


        // 🔥 Kiểm tra xem API có trả về dữ liệu `steps` hay không
        if (!route.legs || !route.legs[0] || !route.legs[0].steps || route.legs[0].steps.length === 0) {
            console.error("❌ Không có hướng dẫn di chuyển từ API!");
        } else {
            console.log("✅ Hướng dẫn di chuyển:");
            route.legs[0].steps.forEach((step, index) => {
                console.log(`#${index + 1}: ${step.maneuver.instruction} - 📏 ${(step.distance / 1000).toFixed(2)} km, ⏳ ${Math.round(step.duration / 60)} phút`);
            });
        }

        // 🔥 Trích xuất từng bước hướng dẫn di chuyển
        const steps = route.legs[0].steps.map(step => ({
            distance: (step.distance / 1000).toFixed(2) + " km",
            duration: Math.round(step.duration / 60) + " phút",
            instruction: step.maneuver.instruction
        }));

        res.render("shipper/maps", {
            routePath: JSON.stringify(route.geometry.coordinates),
            route: route,
            order: order,
            steps: steps
        });

    } catch (err) {
        console.error(`❌ Lỗi hệ thống khi lấy chỉ đường: ${err.message}`);
        res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
}


}










module.exports = new ShipperController();
