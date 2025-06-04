const Warehouse = require("../models/Warehouse");
const Sanpham = require("../models/Sanpham");
const { getRegionByProvince } = require("../../util/regions");
const {
  getProvinceName,
  getDistrictName,
  getWardName,
} = require("../../util/addressHelper");
const { geocode } = require("../../util/mapService");

class WarehouseController {
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

      const address = `${detail}, ${wardName}, ${districtName}, ${provinceName}`;
      let finalLongitude = longitude;
      let finalLatitude = latitude;

      if (!longitude || !latitude) {
        const coords = await geocode(address);
        if (coords) {
          finalLatitude = coords.latitude;
          finalLongitude = coords.longitude;
        } else {
          return res.status(400).send("Lỗi: Không thể lấy tọa độ từ địa chỉ.");
        }
      }
      const region = getRegionByProvince(provinceName);

      const warehouse = new Warehouse({
        name,
        address,
        province: provinceName,
        district: districtName,
        ward: wardName,
        region,
        location: { longitude: finalLongitude, latitude: finalLatitude },
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
      const provinceName = await getProvinceName(province);
      const districtName = await getDistrictName(district);
      const wardName = await getWardName(ward, district);

      warehouse.name = name || warehouse.name;
      warehouse.address = detail || warehouse.address;
      warehouse.province = provinceName || warehouse.province;
      warehouse.district = districtName || warehouse.district;
      warehouse.ward = wardName || warehouse.ward;
      warehouse.region = getRegionByProvince(provinceName) || warehouse.region;

      let finalLongitude = longitude;
      let finalLatitude = latitude;

      if (!longitude || !latitude) {
        const coords = await geocode(warehouse.address);
        if (coords) {
          finalLatitude = coords.latitude;
          finalLongitude = coords.longitude;
        }
      }
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
      const { warehouseId, productId, quantity } = req.body;
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
