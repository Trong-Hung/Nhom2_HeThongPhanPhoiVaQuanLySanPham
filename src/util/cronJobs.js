const cron = require("node-cron");
const DonHang = require("../app/models/DonHang");

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🔄 Đang kiểm tra đơn hàng cần cập nhật...");

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const result = await DonHang.updateMany(
      { status: "Đã giao", createdAt: { $lte: threeDaysAgo } },
      { status: "Hoàn thành" }
    );

    console.log(
      ` Đã cập nhật ${result.modifiedCount} đơn hàng thành "Hoàn thành".`
    );
  } catch (err) {
    console.error("Lỗi khi cập nhật đơn hàng tự động:", err);
  }
});
