const Sanpham = require("../models/Sanpham");
const Warehouse = require("../models/Warehouse"); // ✅ Import mô hình kho

const { mongooseToObject } = require("../../util/mongoose");
const fs = require("fs");
const path = require("path");

class SanphamController {
  async show(req, res, next) {
    console.log("📌 Nhận request với slug:", req.params.slug);

    if (!req.params.slug) {
      console.error("❌ Lỗi: Slug không được cung cấp!");
      return res.status(400).send("Lỗi: Slug không hợp lệ!");
    }

    try {
      const sanpham = await Sanpham.findOne({ slug: req.params.slug });

      if (!sanpham) {
        console.error("❌ Không tìm thấy sản phẩm với slug:", req.params.slug);
        return res.status(404).send("Product not found");
      }

      console.log("✅ Sản phẩm tìm thấy:", sanpham);

      res.render("sanpham/show", {
        sanpham: mongooseToObject(sanpham),
        image: sanpham.image ? `/uploads/${sanpham.image}` : "/uploads/default.jpg",
      });
    } catch (err) {
      console.error("❌ Lỗi MongoDB:", err);
      next(err);
    }
  }

  create(req, res) {
    res.render("sanpham/create");
  }







 async store(req, res, next) {
    console.log("📌 Nhận request tạo sản phẩm:", req.body);

    if (!req.file) {
        console.error("❌ Không tìm thấy file ảnh!");
        return res.status(400).send("Ảnh không hợp lệ hoặc không được chọn.");
    }

    const { name, sku, category, price, stockTotal } = req.body;

    if (!sku || !category || !price) {
        console.error("❌ Lỗi: SKU, Danh mục và Giá không được để trống!");
        return res.status(400).send("Lỗi: Vui lòng nhập đầy đủ SKU, Danh mục và Giá!");
    }

    try {
        // 🔥 Tạo sản phẩm mới
        const sanpham = new Sanpham({ name, sku, category, price, stockTotal, image: req.file.filename });
        await sanpham.save();

        // 🔥 Lấy danh sách tất cả kho trong hệ thống
        const warehouses = await Warehouse.find();
        if (warehouses.length > 0) {
            warehouses.forEach(async (warehouse) => {
                // 🔥 Thêm sản phẩm vào danh sách kho ngay khi tạo
                warehouse.products.push({
                    productId: sanpham._id,
                    name: sanpham.name,
                    sku: sanpham.sku,
                    category: sanpham.category,
                    quantity: 0  // Số lượng ban đầu = 0
                });

                await warehouse.save(); // 🔥 Cập nhật kho ngay lập tức
                console.log(`✅ Sản phẩm ${sanpham.name} đã được thêm vào kho ${warehouse.name}!`);
            });
        } else {
            console.error("❌ Không có kho nào để gán sản phẩm!");
        }

        res.redirect(`/sanpham/${sanpham.slug}`);
    } catch (error) {
        console.error("❌ Lỗi khi lưu sản phẩm:", error);
        next(error);
    }
}



  async edit(req, res, next) {
    console.log("📌 Đang chỉnh sửa sản phẩm với ID:", req.params.id);

    try {
      const sanpham = await Sanpham.findById(req.params.id);
      if (!sanpham) {
        console.error("❌ Không tìm thấy sản phẩm:", req.params.id);
        return res.status(404).send("Không tìm thấy sản phẩm!");
      }
      res.render("sanpham/edit", { sanpham: mongooseToObject(sanpham) });
    } catch (err) {
      console.error("❌ Lỗi khi truy xuất sản phẩm:", err);
      next(err);
    }
  }

  async update(req, res, next) {
    console.log("📌 Nhận request cập nhật:", req.body);
    console.log("📌 File ảnh nhận được:", req.file);

    let updateFields = { ...req.body };

    if (req.file) {
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
      updateFields.image = req.file.filename;
    }

    try {
      const updatedSanpham = await Sanpham.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });

      if (!updatedSanpham) {
        console.error("❌ Không tìm thấy sản phẩm:", req.params.id);
        return res.status(404).send("Không tìm thấy sản phẩm");
      }
      res.redirect(`/sanpham/${updatedSanpham.slug}`);
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật sản phẩm:", error);
      next(error);
    }
  }

  async delete(req, res, next) {
    console.log("📌 Nhận yêu cầu xóa sản phẩm với ID:", req.params.id);

    try {
      await Sanpham.deleteOne({ _id: req.params.id });
      console.log("✅ Đã xóa sản phẩm:", req.params.id);
      res.redirect("/me/stored/sanpham");
    } catch (error) {
      console.error("❌ Lỗi khi xóa sản phẩm:", error);
      next(error);
    }
  }
}

module.exports = new SanphamController();
