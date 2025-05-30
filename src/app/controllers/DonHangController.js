const DonHang = require("../models/DonHang");
const Warehouse = require("../models/Warehouse");
const User = require("../models/User");





class DonHangController {



   async viewOrderDetail(req, res) {
  try {
    console.log("==> [viewOrderDetail] req.params.id:", req.params.id);
    // Populate cả warehouseId và assignedShipper
    const order = await DonHang.findById(req.params.id)
      .populate('warehouseId')
      .populate('assignedShipper');
    console.log("==> [viewOrderDetail] order:", order);

    // Lấy danh sách shipper cùng miền (nếu cần chọn lại)
    const shippers = await User.find({ role: "shipper", region: order.region });
    console.log("==> [viewOrderDetail] shippers (theo miền):", shippers.length);
    let paymentMethodText = "Không xác định";
if (order.paymentMethod === "cash") paymentMethodText = "Thanh toán khi nhận hàng";
if (order.paymentMethod === "vnpay") paymentMethodText = "Thanh toán qua VNPay";
const estimatedDeliveryText = order.estimatedDelivery
  ? order.estimatedDelivery.toLocaleString("vi-VN")
  : "Chưa có";
res.render("admin/order_detail", { order, shippers, paymentMethodText, estimatedDeliveryText });

  } catch (err) {
    console.error("❌ [viewOrderDetail] Lỗi:", err);
    res.status(500).send("Lỗi hệ thống!");
  }
}

    async index(req, res) {
      try {
        console.log("==> [index] Truy vấn danh sách đơn hàng...");
        const orders = await DonHang.find().sort({ createdAt: -1 }).populate("warehouseId");
        console.log("==> [index] Đơn hàng sau khi lấy kho:", orders.length);
        res.render("admin/qldonhang", { orders });
      } catch (err) {
        console.error("❌ [index] Lỗi khi lấy danh sách đơn hàng:", err);
        res.status(500).send("Lỗi hệ thống!");
      }
    }
    
    


async index(req, res) {
    try {
        console.log(" Truy vấn danh sách đơn hàng...");
        const orders = await DonHang.find().sort({ createdAt: -1 }).populate("warehouseId");

        console.log(" Đơn hàng sau khi lấy kho:", orders);

        res.render("admin/qldonhang", { orders });
    } catch (err) {
        console.error(" Lỗi khi lấy danh sách đơn hàng:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}


async updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await DonHang.findById(id).populate("warehouseId");

        if (!order) {
            return res.status(404).send(" Không tìm thấy đơn hàng!");
        }

        if (status === "Đang vận chuyển" && order.warehouseId) {
            const warehouse = order.warehouseId;

            order.items.forEach(item => {
                const productInWarehouse = warehouse.products.find(p => p.productId.toString() === item._id.toString());
                if (productInWarehouse) {
                    productInWarehouse.quantity -= item.quantity;
                    if (productInWarehouse.quantity < 0) {
                        productInWarehouse.quantity = 0;
                    }
                }
            });

            await warehouse.save();
            console.log(` Đã giảm tồn kho từ kho ${warehouse.name}`);
        }

        order.status = status;
        await order.save();
        console.log(` Đã cập nhật trạng thái đơn hàng: ${status}`);

        res.redirect("/admin/donhang");
    } catch (err) {
        console.error(" Lỗi khi cập nhật trạng thái đơn hàng:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}



async confirmReceived(req, res) {
    try {
        const { id } = req.params;
        const order = await DonHang.findById(id).populate("warehouseId");

        if (!order || order.status !== "Đã giao") {
            return res.status(400).send("Đơn hàng không hợp lệ hoặc đã được xác nhận.");
        }

        const warehouse = order.warehouseId;
        if (warehouse) {
            order.items.forEach(item => {
                const productInWarehouse = warehouse.products.find(p => p.productId.toString() === item._id.toString());
                if (productInWarehouse) {
                    productInWarehouse.quantity -= item.quantity;
                    if (productInWarehouse.quantity < 0) {
                        productInWarehouse.quantity = 0;
                    }
                }
            });

            await warehouse.save();
            console.log(` Đã giảm tồn kho từ kho ${warehouse.name} khi đơn hàng hoàn thành.`);
        }

        order.status = "Hoàn thành";
        await order.save();

        console.log(" Đơn hàng đã được xác nhận là hoàn thành!");
        res.redirect(`/donhang/${id}`);
    } catch (err) {
        console.error(" Lỗi khi xử lý đơn hàng:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}



//   async updateStatus(req, res) {
//     const { id } = req.params;
//     const { status } = req.body;

//     await DonHang.findByIdAndUpdate(id, { status });
//     res.redirect("/admin/donhang"); // Chuyển hướng đến danh sách đơn hàng
//   }

//   async confirmReceived(req, res) {
//   const { id } = req.params;
//   const order = await DonHang.findById(id);

//   if (!order || order.status !== "Đã giao") {
//     return res.status(400).send("Đơn hàng không hợp lệ hoặc đã được xác nhận.");
//   }

//   order.status = "Hoàn thành"; // Cập nhật trạng thái
//   await order.save();

//   return res.redirect(`/donhang/${id}`); // 🔥 Chuyển hướng về chi tiết đơn hàng
// }




  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await DonHang.findById(id);

      if (!order) {
        return res.status(404).send("Không tìm thấy đơn hàng.");
      }

      if (order.status !== "Chờ xác nhận") {
        return res.status(400).send("Không thể hủy đơn hàng ở trạng thái này.");
      }

      order.status = "Đã hủy";
      order.cancelReason = reason;
      await order.save();

      return res.redirect(`/donhang/${id}`);
    } catch (err) {
      console.error("Lỗi khi hủy đơn hàng:", err);
      return res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

async viewOrder(req, res) {
  try {
    const { id } = req.params;
    const order = await DonHang.findById(id)
      .populate("warehouseId")
      .populate("assignedShipper");

    if (!order) {
      return res.status(404).send("Không tìm thấy đơn hàng.");
    }

    // Xử lý text cho hiển thị
    let paymentMethodText = "Không xác định";
    if (order.paymentMethod === "cash") paymentMethodText = "Thanh toán khi nhận hàng";
    if (order.paymentMethod === "vnpay") paymentMethodText = "Thanh toán qua VNPay";
    const estimatedDeliveryText = order.estimatedDelivery
      ? order.estimatedDelivery.toLocaleString("vi-VN")
      : "Chưa có";

    res.render("user/chitietdonhang", {
          estimatedDeliveryText,
  paymentMethodText,
      order,
   
    });
  } catch (err) {
    console.error(" Lỗi khi lấy đơn hàng:", err);
    res.status(500).send("Lỗi hệ thống!");
  }
}


async userOrders(req, res) {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  const userId = req.session.user._id;
  const allOrders = await DonHang.find({ userId }).sort({ createdAt: -1 });

  const ordersPending = allOrders.filter(o => o.status === "Chờ xác nhận" || o.status === "Đang sắp xếp");
  const ordersShipping = allOrders.filter(o => o.status === "Đang vận chuyển");
  const ordersDelivered = allOrders.filter(o => o.status === "Đã giao" || o.status === "Hoàn thành");
  const ordersCanceled = allOrders.filter(o => o.status === "Đã hủy");

  res.render("user/donhangme", { ordersPending, ordersShipping, ordersDelivered, ordersCanceled });
}
}

module.exports = new DonHangController();
