const transporter = require("../config/email");
const DonHang = require("../app/models/DonHang");
const User = require("../app/models/User");
const Sanpham = require("../app/models/Sanpham");

class EmailService {
  // Gửi email xác nhận đơn hàng
  async sendOrderConfirmation(orderId) {
    try {
      // Lấy thông tin đơn hàng đầy đủ
      const order = await DonHang.findById(orderId)
        .populate("userId", "name email phone")
        .populate("items._id", "name price image slug")
        .populate("warehouseId", "name address");

      if (!order || !order.userId || !order.userId.email) {
        throw new Error(
          "Không tìm thấy thông tin đơn hàng hoặc email khách hàng"
        );
      }

      // Tạo nội dung email
      const emailContent = this.generateOrderConfirmationEmail(order);

      const mailOptions = {
        from: '"EXVN E-commerce" <noreply@exvn.com>',
        to: order.userId.email,
        cc: order.userId.email, // Copy cho khách hàng
        subject: `[EXVN] Xác nhận đơn hàng #${order._id}`,
        html: emailContent,
      };

      // Gửi email
      const info = await transporter.sendMail(mailOptions);
      console.log(
        `✉️ Email đơn hàng đã gửi tới ${order.userId.email}:`,
        info.messageId
      );

      return {
        success: true,
        messageId: info.messageId,
        recipient: order.userId.email,
      };
    } catch (error) {
      console.error("❌ Lỗi gửi email đơn hàng:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Gửi email cập nhật trạng thái đơn hàng
  async sendOrderStatusUpdate(orderId, newStatus) {
    try {
      const order = await DonHang.findById(orderId)
        .populate("userId", "name email")
        .populate("assignedShipper", "name phone");

      if (!order || !order.userId || !order.userId.email) {
        throw new Error(
          "Không tìm thấy thông tin đơn hàng hoặc email khách hàng"
        );
      }

      let subject, content;

      switch (newStatus) {
        case "Đang vận chuyển":
          subject = `[EXVN] Đơn hàng #${order._id} đang được vận chuyển`;
          content = this.generateShippingEmail(order);
          break;
        case "Đã giao":
          subject = `[EXVN] Đơn hàng #${order._id} đã được giao thành công`;
          content = this.generateDeliveredEmail(order);
          break;
        case "Đã hủy":
          subject = `[EXVN] Đơn hàng #${order._id} đã bị hủy`;
          content = this.generateCancelledEmail(order);
          break;
        default:
          return { success: false, error: "Trạng thái không hỗ trợ gửi email" };
      }

      const mailOptions = {
        from: '"EXVN E-commerce" <noreply@exvn.com>',
        to: order.userId.email,
        subject: subject,
        html: content,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️ Email cập nhật trạng thái đã gửi:`, info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        status: newStatus,
      };
    } catch (error) {
      console.error("❌ Lỗi gửi email cập nhật:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Tạo nội dung email xác nhận đơn hàng
  generateOrderConfirmationEmail(order) {
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item._id && item._id.image ? item._id.image : "/uploads/1748778137374.jpg"}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${this.formatCurrency(item.price)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
          ${this.formatCurrency(item.price * item.quantity)}
        </td>
      </tr>
    `
      )
      .join("");

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Xác nhận đơn hàng</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Cảm ơn bạn đã đặt hàng!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Đơn hàng của bạn đã được xác nhận thành công</p>
      </div>

      <!-- Thông tin đơn hàng -->
      <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; color: #495057; font-size: 20px;">📋 Thông tin đơn hàng</h2>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Mã đơn hàng:</strong></span>
            <span style="color: #007bff; font-weight: bold;">#${order._id}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Ngày đặt:</strong></span>
            <span>${new Date(order.createdAt).toLocaleString("vi-VN")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Trạng thái:</strong></span>
            <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${order.status}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Phương thức thanh toán:</strong></span>
            <span>${order.paymentMethod === "momo" ? "💳 MoMo" : "💵 Tiền mặt"}</span>
          </div>
        </div>

        <!-- Thông tin giao hàng -->
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px;">🚚 Thông tin giao hàng</h3>
          <p style="margin: 5px 0;"><strong>Người nhận:</strong> ${order.name}</p>
          <p style="margin: 5px 0;"><strong>Số điện thoại:</strong> ${order.phone}</p>
          <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${order.address}</p>
          ${order.warehouseId ? `<p style="margin: 5px 0;"><strong>Kho xuất:</strong> ${order.warehouseId.name} - ${order.warehouseId.address}</p>` : ""}
        </div>

        <!-- Chi tiết sản phẩm -->
        <div>
          <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 18px;">🛍️ Chi tiết sản phẩm</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 15px 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Ảnh</th>
                <th style="padding: 15px 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Sản phẩm</th>
                <th style="padding: 15px 10px; text-align: center; border-bottom: 2px solid #dee2e6;">SL</th>
                <th style="padding: 15px 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Đơn giá</th>
                <th style="padding: 15px 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Tổng cộng -->
          <div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Tổng số lượng:</span>
              <span><strong>${order.totalQuantity} sản phẩm</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; color: #dc3545; border-top: 2px solid #dee2e6; padding-top: 10px;">
              <span><strong>Tổng tiền:</strong></span>
              <span><strong>${this.formatCurrency(order.totalPrice)}</strong></span>
            </div>
          </div>
        </div>

        <!-- Lưu ý -->
        <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h4 style="margin: 0 0 10px 0; color: #856404;">📝 Lưu ý quan trọng</h4>
          <ul style="margin: 0; padding-left: 20px; color: #856404;">
            <li>Vui lòng kiểm tra thông tin đơn hàng và liên hệ ngay nếu có sai sót</li>
            <li>Đơn hàng sẽ được xử lý trong vòng 24h kể từ khi xác nhận</li>
            <li>Bạn sẽ nhận được thông báo khi đơn hàng được giao cho shipper</li>
            <li>Vui lòng chuẩn bị đủ tiền mặt nếu chọn thanh toán COD</li>
          </ul>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #495057; color: white; padding: 25px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="margin: 0 0 10px 0; font-size: 16px;">Cảm ơn bạn đã tin tưởng <strong>EXVN E-commerce</strong>! 🙏</p>
        <p style="margin: 0; font-size: 14px; opacity: 0.8;">
          📞 Hotline: 1900-xxxx | 📧 Email: support@exvn.com | 🌐 Website: exvn.com
        </p>
      </div>

    </body>
    </html>
    `;
  }

  // Tạo email thông báo đang vận chuyển
  generateShippingEmail(order) {
    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🚚 Đơn hàng đang được giao!</h1>
      </div>
      <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Xin chào <strong>${order.userId.name}</strong>,</p>
        <p>Đơn hàng <strong>#${order._id}</strong> của bạn đang được vận chuyển!</p>
        ${
          order.assignedShipper
            ? `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0;">📱 Thông tin shipper</h3>
          <p><strong>Tên:</strong> ${order.assignedShipper.name}</p>
          <p><strong>SĐT:</strong> ${order.assignedShipper.phone}</p>
        </div>
        `
            : ""
        }
        <p>Vui lòng chuẩn bị sẵn sàng nhận hàng và số tiền thanh toán (nếu COD).</p>
        <p style="color: #666;">Cảm ơn bạn đã mua sắm tại EXVN!</p>
      </div>
    </body>
    </html>
    `;
  }

  // Tạo email thông báo đã giao
  generateDeliveredEmail(order) {
    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🎉 Giao hàng thành công!</h1>
      </div>
      <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Xin chào <strong>${order.userId.name}</strong>,</p>
        <p>Đơn hàng <strong>#${order._id}</strong> đã được giao thành công!</p>
        <p>Cảm ơn bạn đã tin tưởng và mua sắm tại EXVN. Chúng tôi hy vọng bạn hài lòng với sản phẩm!</p>
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0;"><strong>💡 Đánh giá sản phẩm:</strong> Hãy để lại đánh giá để giúp khách hàng khác!</p>
        </div>
        <p style="color: #666;">Chúc bạn một ngày tuyệt vời! 🌟</p>
      </div>
    </body>
    </html>
    `;
  }

  // Tạo email thông báo hủy đơn
  generateCancelledEmail(order) {
    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">❌ Đơn hàng đã bị hủy</h1>
      </div>
      <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Xin chào <strong>${order.userId.name}</strong>,</p>
        <p>Rất tiếc, đơn hàng <strong>#${order._id}</strong> của bạn đã bị hủy.</p>
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ hotline để được hỗ trợ.</p>
        <p>Chúng tôi xin lỗi vì sự bất tiện này và hy vọng được phục vụ bạn trong tương lai!</p>
        <p style="color: #666;">Trân trọng,<br>Đội ngũ EXVN</p>
      </div>
    </body>
    </html>
    `;
  }

  // Format tiền tệ
  formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }
}

module.exports = new EmailService();
