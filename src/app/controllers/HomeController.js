const Sanpham = require("../models/Sanpham");
const { mutipleMongooseToObject } = require("../../util/mongoose");

class HomeController {

  index(req, res, next) {
    Sanpham.find({})
    .then((sanphams) => {
      console.log("✅ Dữ liệu từ MongoDB:", sanphams); // Kiểm tra danh sách sản phẩm

      const formattedSanphams = sanphams.map((sanpham) => {
        return {
          _id: sanpham._id,
          name: sanpham.name,
          description: sanpham.description,
          slug: sanpham.slug,
          price: sanpham.price,
          // Đảm bảo cung cấp đường dẫn ảnh chính xác
          image: sanpham.image
            ? `/uploads/${sanpham.image}` // Đường dẫn ảnh từ thư mục uploads
            : "/uploads/default.jpg",      // Nếu không có ảnh, dùng ảnh mặc định
          createdAt: sanpham.createdAt,
          updatedAt: sanpham.updatedAt,
        };
      });

      console.log("✅ Dữ liệu đã format:", formattedSanphams);

      res.render("home", { sanphams: formattedSanphams });
    })
    .catch(err => console.error("❌ Lỗi khi lấy dữ liệu từ MongoDB:", err));
}

  // index(req, res, next) {
  //   Sanpham.find({})
  //   .then((sanphams) => {
  //     console.log("✅ Dữ liệu từ MongoDB:", sanphams); // Kiểm tra danh sách sản phẩm
  
  //     const formattedSanphams = sanphams.map((sanpham) => {
  //       return {
  //         _id: sanpham._id,
  //         name: sanpham.name,
  //         description: sanpham.description,
  //         slug: sanpham.slug,
  //         image: sanpham.image && sanpham.image.data
  //           ? `data:${sanpham.image.contentType};base64,${sanpham.image.data.toString("base64")}`
  //           : "/uploads/default.jpg",
  //         createdAt: sanpham.createdAt,
  //         updatedAt: sanpham.updatedAt,
  //       };
  //     });
  
  //     console.log("✅ Dữ liệu đã format:", formattedSanphams); // Kiểm tra danh sách sau khi format
  
  //     res.render("home", { sanphams: formattedSanphams });
  //   })
  //   .catch(err => console.error("❌ Lỗi khi lấy dữ liệu từ MongoDB:", err));
  
  // }
}

module.exports = new HomeController();
