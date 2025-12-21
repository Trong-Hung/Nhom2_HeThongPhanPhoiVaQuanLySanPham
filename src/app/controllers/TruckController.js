const Truck = require("../models/Truck");
const User = require("../models/User");
const Warehouse = require('../models/Warehouse');

function calculateBoxVolumeM3(boxLength, boxWidth, boxHeight) {
  if (!boxLength || !boxWidth || !boxHeight) return 0;
  return (boxLength * boxWidth * boxHeight) / 1_000_000;
}
class TruckController {
  // Danh sách xe
async index(req, res) {
    const trucks = await Truck.find().populate("driver warehouseId");
    // Thêm trường boxVolumeM3 cho từng xe
    const trucksWithVolume = trucks.map(truck => ({
      ...truck.toObject(),
      boxVolumeM3: calculateBoxVolumeM3(truck.boxLength, truck.boxWidth, truck.boxHeight)
    }));
    res.render("truck/index", { trucks: trucksWithVolume });
  }

  // Form thêm xe
  async create(req, res) {
  const drivers = await User.find({ role: "shipper" });
  const warehouses = await Warehouse.find();
  res.render("truck/create", { drivers, warehouses });
}

  // Lưu xe mới
  async store(req, res) {
    const { licensePlate, type, maxWeight, boxLength, boxWidth, boxHeight, warehouseId, driver } = req.body;
    const boxVolumeM3 = calculateBoxVolumeM3(boxLength, boxWidth, boxHeight);
    const newTruck = await Truck.create({
      licensePlate, type, maxWeight, boxLength, boxWidth, boxHeight,
      boxVolumeM3,
      warehouseId: warehouseId || null,
      driver: driver || null
    });
    if (driver) {
      await User.findByIdAndUpdate(driver, { truck: newTruck._id });
    }
    res.redirect("/truck");
  }

  // Form sửa xe
  async edit(req, res) {
  const truck = await Truck.findById(req.params.id).populate("driver warehouseId");
  const drivers = await User.find({ role: "shipper" });
  const warehouses = await Warehouse.find();
  res.render("truck/edit", { truck, drivers, warehouses });
}

  // Cập nhật xe
  async update(req, res) {
    const { licensePlate, type, maxWeight, boxLength, boxWidth, boxHeight, warehouseId, driver } = req.body;
    const boxVolumeM3 = calculateBoxVolumeM3(boxLength, boxWidth, boxHeight);
    const truck = await Truck.findById(req.params.id);
    if (truck.driver && truck.driver.toString() !== driver) {
      await User.findByIdAndUpdate(truck.driver, { truck: null });
    }
    await Truck.findByIdAndUpdate(req.params.id, {
      licensePlate, type, maxWeight, boxLength, boxWidth, boxHeight,
      boxVolumeM3,
      warehouseId: warehouseId || null,
      driver: driver || null
    });
    if (driver) {
      await User.findByIdAndUpdate(driver, { truck: req.params.id });
    }
    res.redirect("/truck");
  }

  // Xóa xe
  async delete(req, res) {
  const truck = await Truck.findById(req.params.id);
  if (truck && truck.driver) {
    await User.findByIdAndUpdate(truck.driver, { truck: null });
  }
  await Truck.findByIdAndDelete(req.params.id);
  res.redirect("/truck");
}
}

module.exports = new TruckController();