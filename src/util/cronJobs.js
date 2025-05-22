const cron = require("node-cron");
const DonHang = require("../app/models/DonHang");


// Lịch trình: chạy mỗi ngày lúc 00:00 (nửa đêm)
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🔄 Đang kiểm tra đơn hàng cần cập nhật...");

    // Tính thời gian 3 ngày trước
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Tìm các đơn hàng có trạng thái "Đã giao" lâu hơn 3 ngày
    const result = await DonHang.updateMany(
      { status: "Đã giao", createdAt: { $lte: threeDaysAgo } },
      { status: "Hoàn thành" }
    );

    console.log(
      `✅ Đã cập nhật ${result.modifiedCount} đơn hàng thành "Hoàn thành".`
    );
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật đơn hàng tự động:", err);
  }
});
