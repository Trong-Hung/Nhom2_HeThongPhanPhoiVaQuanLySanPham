const Warehouse = require("../models/Warehouse");
const Sanpham = require("../models/Sanpham");


const {
  getProvinceName,
  getDistrictName,
  getWardName,
} = require("../../util/addressHelper");

const { geocode } = require("../../util/mapService");

async function createWarehouse(req, res) {
    try {
        const { name, address, products } = req.body;
        const coords = await geocode(address);

        if (!coords) {
            return res.status(400).send("Không thể lấy tọa độ từ địa chỉ.");
        }

        const warehouse = new Warehouse({
            name,
            address,
            location: { latitude: coords.latitude, longitude: coords.longitude },
            products
        });

        await warehouse.save();
        console.log(`✅ Kho mới tạo: ${warehouse.name}, tọa độ: ${warehouse.location.latitude}, ${warehouse.location.longitude}`);
        res.status(201).send(warehouse);
    } catch (error) {
        console.error("❌ Lỗi khi tạo kho:", error);
        res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
}




class WarehouseController {



   


   async updateWarehouse(req, res) {
    try {
        console.log("📌 Trước khi cập nhật kho:", req.body);

        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            console.error("❌ Kho không tồn tại:", req.params.id);
            return res.status(404).send("Kho không tồn tại!");
        }

        // 🔥 Cập nhật thông tin kho
        warehouse.name = req.body.name || warehouse.name;
        warehouse.address = req.body.address || warehouse.address;

        // 🔥 Nếu kho chưa có tọa độ, cập nhật từ địa chỉ
        if (!warehouse.location || warehouse.location.latitude === 0) {
            console.log("📌 Đang cập nhật tọa độ kho...");
            const coords = await geocode(warehouse.address);
            if (coords) {
                warehouse.location = { latitude: coords.latitude, longitude: coords.longitude };
                console.log("✅ Đã cập nhật tọa độ kho:", warehouse.location);
            } else {
                console.error("❌ Không thể lấy tọa độ từ địa chỉ.");
            }
        }

        await warehouse.save();
        console.log("✅ Kho sau khi cập nhật:", warehouse);

        res.redirect(`/admin/kho/${req.params.id}`);
    } catch (err) {
        console.error("❌ Lỗi khi cập nhật kho:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}


  async getWarehouses(req, res) {
    try {
      const warehouses = await Warehouse.find();
      res.status(200).json(warehouses);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách kho:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  }

  async getSanphams(req, res) {
    try {
      const sanphams = await Sanpham.find();
      res.status(200).json(sanphams);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách sản phẩm:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  }

  async importSanpham(req, res) {
    try {
      console.log("📌 Dữ liệu nhận được từ form:", req.body);

      if (!req.body.quantities || !req.body.warehouses) {
        console.error("❌ Lỗi: Dữ liệu gửi lên không đúng!");
        return res.status(400).send("Lỗi: Thiếu dữ liệu nhập hàng!");
      }

      const { quantities, warehouses } = req.body;

      for (const productId in quantities) {
        console.log("🔍 Đang xử lý sản phẩm:", productId);

        if (!warehouses[productId]) {
          console.error(`❌ Không tìm thấy kho cho sản phẩm: ${productId}`);
          continue; // Bỏ qua sản phẩm nếu không có kho nhập
        }

        const warehouseId = warehouses[productId];
        const quantity = parseInt(quantities[productId], 10);

        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) {
          console.error(`❌ Không tìm thấy kho: ${warehouseId}`);
          continue;
        }

        if (!warehouse.products) warehouse.products = []; // ✅ Đảm bảo `products` không bị `undefined`

        const productIndex = warehouse.products.findIndex(
          (p) => p.productId.toString() === productId
        );

        if (productIndex !== -1) {
  warehouse.products[productIndex].quantity += quantity;
} else {
  // Lấy thông tin sản phẩm
  const sanpham = await Sanpham.findById(productId);
  if (!sanpham) {
    console.error(`❌ Không tìm thấy sản phẩm: ${productId}`);
    continue;
  }
  warehouse.products.push({
    productId,
    name: sanpham.name,
    sku: sanpham.sku,
    category: sanpham.category,
    quantity
  });
}

        await warehouse.save();

        const sanpham = await Sanpham.findById(productId);
        if (sanpham) {
          sanpham.stockTotal += quantity;
          await sanpham.save();
        } else {
          console.error(`❌ Không tìm thấy sản phẩm: ${productId}`);
        }
      }

      res.redirect("/admin/nhaphang");
    } catch (err) {
      console.error("❌ Lỗi khi nhập hàng:", err);
      res.status(500).json({ message: "Lỗi hệ thống!" });
    }
  }

async importView(req, res) {
    try {
        const sanphams = await Sanpham.find();
        const warehouses = await Warehouse.find(); 

        console.log("📌 Debug danh sách sản phẩm:", sanphams);
        console.log("📌 Debug danh sách kho:", warehouses);

        res.render("sanpham/importSanpham", { sanphams, warehouses });
    } catch (err) {
        console.error("❌ Lỗi khi tải trang nhập hàng:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}


async listWarehouses(req, res) {
    try {
        const warehouses = await Warehouse.find(); // 🔥 Lấy danh sách kho từ database

        console.log("📌 Danh sách kho:", warehouses); // ✅ Debug xem có dữ liệu không

        res.render("warehouse/listWarehouses", { warehouses }); // ✅ Truyền danh sách kho vào View
    } catch (err) {
        console.error("❌ Lỗi khi lấy danh sách kho:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}

async manageWarehouse(req, res) {
    try {
        console.log("📌 ID kho nhận được:", req.params.id); // 🔥 Kiểm tra dữ liệu

        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            console.error("❌ Kho không tồn tại:", req.params.id);
            return res.status(404).send("Kho không tồn tại!");
        }

        console.log("📌 Quản lý kho:", warehouse);

        // 🔥 Truy vấn sản phẩm chứa kho này
        const productsInWarehouse = await Sanpham.find({
            warehouses: { $elemMatch: { warehouseId: req.params.id } }
        }).populate("warehouses.warehouseId");

        console.log("📌 Danh sách sản phẩm trong kho:", productsInWarehouse);

        res.render("warehouse/manageWarehouse", { warehouse, products: productsInWarehouse });
    } catch (err) {
        console.error("❌ Lỗi khi tải trang quản lý kho:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}












  async addWarehouseView(req, res) {
    res.render("warehouse/addWarehouse"); // ✅ Hiển thị form tạo kho
}

async createWarehouse(req, res) {
    try {
        console.log("📌 Dữ liệu nhận từ request:", req.body);

        const { name, detail, province, district, ward, longitude, latitude } = req.body;

        // 🔥 Lấy tên địa phương từ API
        const provinceName = await getProvinceName(province);
        const districtName = await getDistrictName(district);
        const wardName = await getWardName(ward, district);

        console.log("📌 Tỉnh:", provinceName);
        console.log("📌 Huyện:", districtName);
        console.log("📌 Xã:", wardName);

        // ✅ Kiểm tra xem thông tin địa chỉ có hợp lệ không
        if (!name || !detail || !provinceName || !districtName || !wardName) {
            console.error("❌ Tên kho và địa chỉ không được để trống!");
            return res.status(400).send("Lỗi: Vui lòng nhập đầy đủ thông tin!");
        }

        const address = `${detail}, ${wardName}, ${districtName}, ${provinceName}`; // ✅ Địa chỉ chuẩn hóa

        let finalLongitude = longitude;
        let finalLatitude = latitude;

        // 🔥 Nếu chưa có tọa độ, tự động lấy từ địa chỉ
        if (!longitude || !latitude) {
            console.log("📌 Đang lấy tọa độ tự động từ địa chỉ...");
            const coords = await geocode(address);
            if (coords) {
                finalLatitude = coords.latitude;
                finalLongitude = coords.longitude;
                console.log("✅ Đã lấy tọa độ:", finalLatitude, finalLongitude);
            } else {
                console.error("❌ Không thể lấy tọa độ từ địa chỉ.");
                return res.status(400).send("Lỗi: Không thể lấy tọa độ từ địa chỉ.");
            }
        }

        // ✅ Lưu kho vào database
        const warehouse = new Warehouse({
            name,
            address,
            province: provinceName,
            district: districtName,
            ward: wardName,
            location: { longitude: finalLongitude, latitude: finalLatitude } // 🔥 Ghi tọa độ vào database
        });

        await warehouse.save();
        console.log("✅ Kho mới đã được tạo:", warehouse);

        res.redirect("/admin/nhaphang");
    } catch (err) {
        console.error("❌ Lỗi khi tạo kho:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}


async addWarehouse(req, res) {
    try {
        const { name, address } = req.body;
        const warehouse = new Warehouse({ name, address });

        await warehouse.save();
        console.log("✅ Đã tạo kho mới:", warehouse);

        res.redirect("/admin/nhaphang"); // 🔥 Quay lại trang nhập hàng
    } catch (err) {
        console.error("❌ Lỗi khi tạo kho:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}

async createWarehouseView(req, res) {
    res.render("warehouse/createWarehouse"); // ✅ Hiển thị form nhập kho
}

// async createWarehouse(req, res) {
//     try {
//         console.log("📌 Dữ liệu nhận từ request:", req.body);

//         const { name, detail, province, district, ward, longitude, latitude } = req.body;

//         // 🔥 Lấy tên địa phương từ API
//         const provinceName = await getProvinceName(province);
//         const districtName = await getDistrictName(district);
//         const wardName = await getWardName(ward, district);

//         console.log("📌 Tỉnh:", provinceName);
//         console.log("📌 Huyện:", districtName);
//         console.log("📌 Xã:", wardName);

//         // ✅ Kiểm tra xem thông tin địa chỉ có hợp lệ không
//         if (!name || !detail || !provinceName || !districtName || !wardName) {
//             console.error("❌ Tên kho và địa chỉ không được để trống!");
//             return res.status(400).send("Lỗi: Vui lòng nhập đầy đủ thông tin!");
//         }

//         const address = `${detail}, ${wardName}, ${districtName}, ${provinceName}`; // ✅ Địa chỉ chuẩn hóa

//         // ✅ Lưu kho vào database
//         const warehouse = new Warehouse({
//             name,
//             address,
//             province: provinceName,
//             district: districtName,
//             ward: wardName,
//             location: { longitude, latitude } // 🔥 Ghi tọa độ vào database
//         });

//         await warehouse.save();
//         console.log("✅ Kho mới đã được tạo:", warehouse);

//         res.redirect("/admin/nhaphang");
//     } catch (err) {
//         console.error("❌ Lỗi khi tạo kho:", err);
//         res.status(500).send("Lỗi hệ thống!");
//     }
// }







async importToWarehouse(req, res) {
    try {
        console.log("📌 Nhận request nhập hàng:", req.body);

        const { warehouseId, productId, quantity } = req.body;
        
        if (!warehouseId || !productId || !quantity) {
            console.error("❌ Lỗi: Dữ liệu thiếu!");
            return res.status(400).send("Lỗi: Vui lòng nhập đầy đủ thông tin!");
        }

        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) {
            console.error("❌ Kho không tồn tại:", warehouseId);
            return res.status(404).send("Kho không tồn tại!");
        }

        const sanpham = await Sanpham.findById(productId);
        if (!sanpham) {
            console.error("❌ Sản phẩm không tồn tại:", productId);
            return res.status(404).send("Sản phẩm không tồn tại!");
        }

        // 🔥 Cập nhật sản phẩm trong kho thay vì `Sanpham.warehouses`
        let productEntry = warehouse.products.find(p => p.productId.toString() === productId);
        if (productEntry) {
            productEntry.quantity += parseInt(quantity);
        } else {
            warehouse.products.push({
                productId,
                name: sanpham.name,
                sku: sanpham.sku,
                category: sanpham.category,
                quantity: parseInt(quantity)
            });
        }

        await warehouse.save();
        console.log(`✅ Sản phẩm ${sanpham.name} đã được nhập vào kho ${warehouse.name}!`);

        res.redirect(`/admin/kho/${warehouseId}`);
    } catch (err) {
        console.error("❌ Lỗi khi nhập hàng vào kho:", err);
        res.status(500).send("Lỗi hệ thống!");
    }
}




}

// ✅ Xuất module đúng cách
module.exports = new WarehouseController();
