const Warehouse = require("../models/Warehouse");
const Sanpham = require("../models/Sanpham");
const { getRegionByProvince } = require("../../util/regions");
const {
  getProvinceName,
  getDistrictName,
  getWardName,
} = require("../../util/addressHelper");

// === SỬA LỖI: Import đúng tên hàm từ mapService ===
const { geocodeAddress } = require("../../util/mapService");

class WarehouseController {
  // API method để lấy danh sách warehouses (cho frontend)
  async getWarehousesAPI(req, res) {
    try {
      const warehouses = await Warehouse.find().select(
        "name location address province district ward"
      );
      res.json(warehouses);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách kho:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy danh sách kho",
      });
    }
  }
  // Hiển thị danh sách kho
  async listWarehouses(req, res) {
    try {
      const warehouses = await Warehouse.find();
      res.render("warehouse/listWarehouses", { warehouses });
    } catch (err) {
      console.error("Lỗi khi lấy danh sách kho:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Trang tạo kho mới
  async createWarehouseView(req, res) {
    res.render("warehouse/createWarehouse");
  }

  // Tạo kho mới
  async createWarehouse(req, res) {
    try {
      const { name, detail, province, district, ward, longitude, latitude } =
        req.body;

      const provinceName = await getProvinceName(province);
      const districtName = await getDistrictName(district);
      const wardName = await getWardName(ward, district);

      if (!name || !detail || !provinceName || !districtName || !wardName) {
        return res.status(400).send("Lỗi: Vui lòng nhập đầy đủ thông tin!");
      }

      // Tạo địa chỉ đầy đủ để tìm tọa độ
      const fullAddress = `${detail}, ${wardName}, ${districtName}, ${provinceName}`;
      console.log(`📍 Đang tìm tọa độ cho kho mới: ${fullAddress}`);

      let finalLongitude = longitude;
      let finalLatitude = latitude;

      // Nếu người dùng không nhập tọa độ thủ công, thì tự động tìm
      if (!longitude || !latitude) {
        // === SỬA LỖI: Gọi hàm geocodeAddress ===
        const coords = await geocodeAddress(fullAddress);

        if (coords) {
          console.log("✅ Tìm thấy tọa độ:", coords);
          finalLatitude = coords.latitude;
          finalLongitude = coords.longitude;
        } else {
          console.warn("⚠️ Không tìm thấy tọa độ, kho sẽ không có GPS.");
          // Tùy chọn: Có thể return lỗi nếu bắt buộc phải có tọa độ
          // return res.status(400).send("Lỗi: Không thể xác định tọa độ từ địa chỉ này.");
        }
      }

      const region = getRegionByProvince(provinceName);

      const warehouse = new Warehouse({
        name,
        address: detail, // Lưu địa chỉ chi tiết
        province: provinceName,
        district: districtName,
        ward: wardName,
        region,
        // Lưu object location (hoặc coordinates tùy model của bạn)
        location: {
          longitude: finalLongitude || 0,
          latitude: finalLatitude || 0,
        },
      });

      await warehouse.save();
      res.redirect(`/admin/kho/${warehouse._id}`);
    } catch (err) {
      console.error("❌ Lỗi khi tạo kho:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Trang sửa kho
  async editWarehouseView(req, res) {
    try {
      const warehouse = await Warehouse.findById(req.params.id);
      if (!warehouse) return res.status(404).send("Kho không tồn tại!");
      res.render("warehouse/editWarehouse", { warehouse });
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Cập nhật kho
  async updateWarehouse(req, res) {
    try {
      const warehouse = await Warehouse.findById(req.params.id);
      if (!warehouse) return res.status(404).send("Kho không tồn tại!");

      const { name, detail, province, district, ward, longitude, latitude } =
        req.body;

      // Cập nhật tên
      warehouse.name = name || warehouse.name;

      // Cập nhật địa chỉ hành chính (nếu có thay đổi)
      if (province) warehouse.province = await getProvinceName(province);
      if (district) warehouse.district = await getDistrictName(district);
      if (ward) warehouse.ward = await getWardName(ward, district);
      if (detail) warehouse.address = detail;

      // Cập nhật vùng miền
      warehouse.region =
        getRegionByProvince(warehouse.province) || warehouse.region;

      let finalLongitude = longitude;
      let finalLatitude = latitude;

      // Nếu không nhập tọa độ thủ công, thử Geocode lại theo địa chỉ mới
      if (!longitude || !latitude) {
        const fullAddress = `${warehouse.address}, ${warehouse.ward}, ${warehouse.district}, ${warehouse.province}`;
        console.log(`📍 Đang cập nhật tọa độ cho: ${fullAddress}`);

        // === SỬA LỖI: Gọi hàm geocodeAddress ===
        const coords = await geocodeAddress(fullAddress);

        if (coords) {
          finalLatitude = coords.latitude;
          finalLongitude = coords.longitude;
        }
      }

      // Cập nhật location
      warehouse.location = {
        longitude: finalLongitude || warehouse.location.longitude,
        latitude: finalLatitude || warehouse.location.latitude,
      };

      await warehouse.save();
      res.redirect(`/admin/kho/${warehouse._id}`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật kho:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Xóa kho
  async deleteWarehouse(req, res) {
    try {
      await Warehouse.findByIdAndDelete(req.params.id);
      res.redirect("/admin/kho");
    } catch (error) {
      res.status(500).send("Lỗi xóa kho!");
    }
  }

  // Trang quản lý chi tiết kho
  async manageWarehouse(req, res) {
    try {
      const warehouse = await Warehouse.findById(req.params.id).populate(
        "products.productId"
      );
      if (!warehouse) return res.status(404).send("Kho không tồn tại!");
      const allProducts = await Sanpham.find();
      res.render("warehouse/manageWarehouse", { warehouse, allProducts });
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Nhập hàng vào kho (view)
  async importView(req, res) {
    try {
      const sanphams = await Sanpham.find();
      const warehouses = await Warehouse.find();
      res.render("sanpham/importSanpham", { sanphams, warehouses });
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Nhập hàng vào kho (xử lý)
  async importSanpham(req, res) {
    try {
      const warehouseId = req.params.id || req.body.warehouseId;
      const { productId, quantity } = req.body;
      const warehouse =
        await Warehouse.findById(warehouseId).populate("products.productId");
      if (!warehouse) return res.status(404).send("Không tìm thấy kho!");

      // Tìm sản phẩm trong kho
      let productEntry = warehouse.products.find(
        (p) => p.productId._id.toString() === productId
      );
      if (productEntry) {
        productEntry.quantity += parseInt(quantity, 10);
      } else {
        const sanpham = await Sanpham.findById(productId);
        if (!sanpham) return res.status(404).send("Không tìm thấy sản phẩm!");
        warehouse.products.push({
          productId: sanpham._id,
          name: sanpham.name,
          sku: sanpham.sku,
          category: sanpham.category,
          quantity: parseInt(quantity, 10),
        });
      }
      await warehouse.save();

      // Lấy lại dữ liệu để render lại trang quản lý kho
      const allProducts = await Sanpham.find();
      const updatedWarehouse =
        await Warehouse.findById(warehouseId).populate("products.productId");
      res.render("warehouse/manageWarehouse", {
        warehouse: updatedWarehouse,
        allProducts,
        success: "Nhập hàng thành công!",
      });
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  }
}
module.exports = new WarehouseController();
