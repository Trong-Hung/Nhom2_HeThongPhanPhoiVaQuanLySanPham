const mongoose = require("mongoose");
const DonHang = require("./src/app/models/DonHang");
const User = require("./src/app/models/User");
const Warehouse = require("./src/app/models/Warehouse");

async function createSampleData() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/f8_education_dev");
    console.log("✅ Connected to MongoDB");

    // Delete existing test data
    await DonHang.deleteMany({ customerAddress: { $regex: /test|sample/i } });
    await User.deleteMany({ email: { $regex: /@test\.com/i } });

    // Create or get warehouse
    let warehouse = await Warehouse.findOne();
    if (!warehouse) {
      warehouse = new Warehouse({
        name: "Kho chính 908 Phạm Văn Đồng",
        location: { lat: 10.835067828591106, lng: 106.73007578112086 },
        address: "908 Phạm Văn Đồng, Hiệp Bình Chánh, Thủ Đức, TP.HCM",
        province: "Thành phố Hồ Chí Minh",
        district: "Thành phố Thủ Đức",
        ward: "Hiệp Bình Chánh",
      });
      await warehouse.save();
      console.log("🏢 Created warehouse:", warehouse.name);
    } else {
      console.log("🏢 Using existing warehouse:", warehouse.name);
    }

    // Create shippers (check required fields)
    const sampleShippers = [
      {
        fullname: "Nguyễn Văn An (Test)",
        phone: "0901234567",
        email: "shipper1@test.com",
        password: "test123",
        role: "shipper",
        isActive: true,
        region: "Miền Nam", // Add required region
        capacity: 15,
        workingHours: { start: 8, end: 18 },
        performance: 85,
      },
      {
        fullname: "Trần Thị Bình (Test)",
        phone: "0901234568",
        email: "shipper2@test.com",
        password: "test123",
        role: "shipper",
        isActive: true,
        region: "Miền Nam", // Add required region
        capacity: 12,
        workingHours: { start: 9, end: 17 },
        performance: 92,
      },
    ];

    for (let shipperData of sampleShippers) {
      let shipper = await User.findOne({ email: shipperData.email });
      if (!shipper) {
        shipper = new User(shipperData);
        await shipper.save();
        console.log("👤 Created shipper:", shipper.fullname);
      } else {
        console.log("👤 Using existing shipper:", shipper.fullname);
      }
    }

    // Get existing customer user or create one
    let testUser = await User.findOne({ email: "testcustomer@example.com" });
    if (!testUser) {
      testUser = new User({
        name: "Test Customer",
        fullname: "Test Customer",
        email: "testcustomer@example.com",
        password: "test123",
        role: "user",
        phone: "0901111111",
        region: "Miền Nam",
      });
      await testUser.save();
      console.log("👤 Created test customer:", testUser.fullname);
    }

    // Create sample orders with proper coordinates format (latitude/longitude)
    const today = new Date();
    const sampleOrders = [
      {
        userId: testUser._id,
        name: "Nguyễn Văn Linh",
        phone: "0901234567",
        address: "[TEST] 123 Nguyễn Văn Linh, Quận 7, TP.HCM",
        region: "Miền Nam",
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Sản phẩm test 1",
            price: 100000,
            quantity: 2,
          },
        ],
        totalQuantity: 2,
        totalPrice: 200000,
        paymentMethod: "cash",
        status: "Chờ xác nhận",
        customerLocation: { latitude: 10.7769, longitude: 106.7009 }, // Use latitude/longitude format
        estimatedDelivery: today,
        totalWeight: 2.5,
        priority: "normal",
        warehouseId: warehouse._id,
      },
      {
        userId: testUser._id,
        name: "Lê Văn Việt",
        phone: "0901234568",
        address: "[TEST] 456 Lê Văn Việt, Quận 9, TP.HCM",
        region: "Miền Nam",
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Sản phẩm test 2",
            price: 150000,
            quantity: 1,
          },
        ],
        totalQuantity: 1,
        totalPrice: 150000,
        paymentMethod: "momo",
        status: "Chờ xác nhận",
        customerLocation: { latitude: 10.8411, longitude: 106.8098 },
        estimatedDelivery: today,
        totalWeight: 1.8,
        priority: "high",
        warehouseId: warehouse._id,
      },
      {
        userId: testUser._id,
        name: "Võ Văn Ngân",
        phone: "0901234569",
        address: "[TEST] 789 Võ Văn Ngân, Thủ Đức, TP.HCM",
        region: "Miền Nam",
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Sản phẩm test 3",
            price: 80000,
            quantity: 4,
          },
        ],
        totalQuantity: 4,
        totalPrice: 320000,
        paymentMethod: "cash",
        status: "Chờ xác nhận",
        customerLocation: { latitude: 10.8515, longitude: 106.7717 },
        estimatedDelivery: today,
        totalWeight: 3.2,
        priority: "normal",
        warehouseId: warehouse._id,
      },
      {
        userId: testUser._id,
        name: "Quang Trung",
        phone: "0901234570",
        address: "[TEST] 321 Quang Trung, Quận 12, TP.HCM",
        region: "Miền Nam",
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Sản phẩm test 4",
            price: 60000,
            quantity: 2,
          },
        ],
        totalQuantity: 2,
        totalPrice: 120000,
        paymentMethod: "cash",
        status: "Chờ xác nhận",
        customerLocation: { latitude: 10.8276, longitude: 106.6345 },
        estimatedDelivery: today,
        totalWeight: 1.5,
        priority: "normal",
        warehouseId: warehouse._id,
      },
      {
        userId: testUser._id,
        name: "Hoàng Diệu",
        phone: "0901234571",
        address: "[TEST] 654 Hoàng Diệu, Quận 4, TP.HCM",
        region: "Miền Nam",
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Sản phẩm test 5",
            price: 90000,
            quantity: 3,
          },
        ],
        totalQuantity: 3,
        totalPrice: 270000,
        paymentMethod: "momo",
        status: "Chờ xác nhận",
        customerLocation: { latitude: 10.7657, longitude: 106.7037 },
        estimatedDelivery: today,
        totalWeight: 2.1,
        priority: "low",
        warehouseId: warehouse._id,
      },
    ];

    for (let orderData of sampleOrders) {
      const order = new DonHang(orderData);
      await order.save();
    }

    console.log(
      "📦 Created",
      sampleOrders.length,
      "sample orders with coordinates:"
    );
    sampleOrders.forEach((order, index) => {
      const lat = order.customerLocation.latitude;
      const lng = order.customerLocation.longitude;
      console.log(`  ${index + 1}. ${order.address.replace("[TEST] ", "")}`);
      console.log(`     Coordinates: ${lat}, ${lng}`);
    });

    console.log("\n🎯 Sample data ready for route optimization testing!");
    console.log("📍 Warehouse ID:", warehouse._id);
    console.log("📍 Date for testing:", today.toISOString().split("T")[0]);

    mongoose.disconnect();
    return {
      warehouseId: warehouse._id,
      testDate: today.toISOString().split("T")[0],
      ordersCount: sampleOrders.length,
    };
  } catch (error) {
    console.error("❌ Error creating sample data:", error);
    mongoose.disconnect();
  }
}

createSampleData();
