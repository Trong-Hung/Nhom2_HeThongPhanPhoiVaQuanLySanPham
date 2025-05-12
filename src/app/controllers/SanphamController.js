const Sanpham = require("../models/Sanpham");
const { mongooseToObject } = require("../../util/mongoose");
const fs = require("fs");
const path = require("path");


class SanphamController {



show(req, res, next) {
    console.log("📌 Nhận request với slug:", req.params.slug); // Kiểm tra slug được gửi đến

    Sanpham.findOne({ slug: req.params.slug })
      .then((sanpham) => {
        if (!sanpham) {
          console.log("❌ Không tìm thấy sản phẩm với slug:", req.params.slug);
          return res.status(404).send("Product not found");
        }

        console.log("✅ Sản phẩm tìm thấy:", sanpham); // Kiểm tra dữ liệu sản phẩm

        // Kiểm tra nếu `image` có tên và tạo đường dẫn chính xác
        const imagePath = sanpham.image
            ? `/uploads/${sanpham.image}` // Đường dẫn ảnh theo tên tệp trong cơ sở dữ liệu
            : "/uploads/default.jpg";      // Nếu không có ảnh, dùng ảnh mặc định

        console.log("📸 Đường dẫn ảnh được gửi:", imagePath); // Kiểm tra ảnh trước khi render

        res.render("sanpham/show", {
          sanpham: mongooseToObject(sanpham),
          image: imagePath, // Truyền đường dẫn ảnh cho view
        });
      })
      .catch((err) => {
        console.error("❌ Lỗi khi lấy dữ liệu từ MongoDB:", err);
        next(err);
      });
}


  create(req, res, next) {
    res.render("sanpham/create");
  }

 store(req, res, next) {
  console.log("Request file:", req.file); // Kiểm tra tệp ảnh

  // Kiểm tra nếu không có file ảnh hoặc ảnh không hợp lệ
  if (!req.file) {
    return res.status(400).send("Ảnh không hợp lệ hoặc không được chọn.");
  }

  const formData = req.body;

  // Lưu tên file ảnh vào cơ sở dữ liệu
  formData.image = req.file.filename;

  const sanpham = new Sanpham(formData);

  sanpham
    .save()
    .then((savedSanpham) => {
      console.log("Đã lưu vào MongoDB:", savedSanpham);
      res.redirect(`/sanpham/${savedSanpham.slug}`);
    })
    .catch((error) => {
      console.error("Lỗi khi lưu:", error);
      next(error);
    });
}



edit(req, res) {
    Sanpham.findById(req.params.id) // ✅ Dùng _id thay vì slug
      .then((sanpham) => {
        res.render("sanpham/edit", { sanpham: mongooseToObject(sanpham) });
      })
      .catch((err) => console.log(err));
}


update(req, res, next) {
    console.log("📌 Request body:", req.body);
    console.log("📌 File ảnh nhận được:", req.file);

    const updateFields = { ...req.body };

    // Nếu có ảnh mới, cập nhật trường `image` với tên ảnh mới
    if (req.file) {
        // Xử lý xóa ảnh cũ nếu có
        if (req.body.oldImage) {
            const oldImagePath = path.join(__dirname, "../uploads", req.body.oldImage);
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error("❌ Không thể xóa ảnh cũ:", err);
                } else {
                    console.log("✅ Đã xóa ảnh cũ");
                }
            });
        }

        // Cập nhật tên file ảnh mới
        updateFields.image = req.file.filename;
    }

    Sanpham.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true })
        .then((updatedSanpham) => {
            if (!updatedSanpham) {
                return res.status(404).send("Không tìm thấy sản phẩm");
            }
            res.redirect(`/sanpham/${updatedSanpham.slug}`);
        })
        .catch((error) => {
            console.error("❌ Lỗi khi cập nhật:", error);
            next(error);
        });
}









// update(req, res, next) {
//     Sanpham.updateOne({ _id: req.params.id }, req.body) // ✅ Dùng _id thay vì slug
//         .then(() => res.redirect(`/sanpham/${req.params.id}`)) // ✅ Chuyển hướng về sản phẩm đã cập nhật
//         .catch(next);
// }

delete(req, res, next) {
    Sanpham.deleteOne({ _id: req.params.id })
      .then(() => res.redirect("/me/stored/sanpham")) // <- đảm bảo đường này tồn tại
      .catch(next);
}

}

module.exports = new SanphamController();
