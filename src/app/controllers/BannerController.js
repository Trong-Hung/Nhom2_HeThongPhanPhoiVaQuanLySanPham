const fs = require("fs");
const path = require("path");

class BannerController {
    upload(req, res) {
        const bannerPath = path.join(__dirname, "../public/uploads/banner.jpg");

        if (req.file) {
            fs.writeFileSync(bannerPath, req.file.buffer);
            res.redirect("/admin/banner"); // ✅ Điều hướng sau khi cập nhật
        } else {
            res.status(400).send("Chưa chọn ảnh!");
        }
    }

    show(req, res) {
        res.render("admin/banner"); // ✅ Giao diện chỉnh sửa banner
    }
}

module.exports = new BannerController();
