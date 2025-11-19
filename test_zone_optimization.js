/**
 * TEST ZONE-BASED ROUTE OPTIMIZATION 🗺️
 * Demo hệ thống tối ưu giao hàng theo khu vực địa lý
 */

const VRPService = require("./src/services/VRPService");

console.log("🗺️  ZONE-BASED ROUTE OPTIMIZATION DEMO");
console.log("=".repeat(70));
console.log("Bài toán: 12 đơn hàng phân bố ở các khu vực khác nhau của TP.HCM");
console.log("Mục tiêu: Tối ưu giao hàng theo từng khu để tiết kiệm thời gian");
console.log();

// Dữ liệu test: 12 orders phân bố ở các quận khác nhau
const orders = [
  // Khu vực Quận 1 & 3 (trung tâm)
  {
    id: 1,
    weight: 2.1,
    address: "Nguyễn Huệ, Quận 1",
    location: { lat: 10.7764, lng: 106.7009 },
  },
  {
    id: 2,
    weight: 1.8,
    address: "Lê Lợi, Quận 1",
    location: { lat: 10.7739, lng: 106.6998 },
  },
  {
    id: 3,
    weight: 2.5,
    address: "Võ Văn Tần, Quận 3",
    location: { lat: 10.7823, lng: 106.6934 },
  },

  // Khu vực Quận 7 & Phú Mỹ Hưng
  {
    id: 4,
    weight: 3.2,
    address: "Nguyễn Thị Thập, Quận 7",
    location: { lat: 10.7411, lng: 106.6913 },
  },
  {
    id: 5,
    weight: 1.9,
    address: "Huỳnh Tấn Phát, Quận 7",
    location: { lat: 10.7354, lng: 106.7019 },
  },
  {
    id: 6,
    weight: 2.7,
    address: "Tân Thuận, Quận 7",
    location: { lat: 10.7389, lng: 106.7095 },
  },

  // Khu vực Thủ Đức & Quận 9
  {
    id: 7,
    weight: 1.6,
    address: "Võ Văn Ngân, Thủ Đức",
    location: { lat: 10.8503, lng: 106.7717 },
  },
  {
    id: 8,
    weight: 2.3,
    address: "Xa lộ Hà Nội, Quận 9",
    location: { lat: 10.8415, lng: 106.8071 },
  },
  {
    id: 9,
    weight: 1.4,
    address: "Đỗ Xuân Hợp, Quận 9",
    location: { lat: 10.8228, lng: 106.7583 },
  },

  // Khu vực Tân Bình & Gò Vấp
  {
    id: 10,
    weight: 2.8,
    address: "Cộng Hòa, Tân Bình",
    location: { lat: 10.8012, lng: 106.6557 },
  },
  {
    id: 11,
    weight: 1.5,
    address: "Quang Trung, Gò Vấp",
    location: { lat: 10.8391, lng: 106.6525 },
  },
  {
    id: 12,
    weight: 2.0,
    address: "Phan Huy Ích, Gò Vấp",
    location: { lat: 10.8278, lng: 106.6642 },
  },
];

// 3 shipper có sức chứa khác nhau
const shippers = [
  { id: "shipper_A", name: "Nguyễn Văn A", capacity: 8, experience: "high" },
  { id: "shipper_B", name: "Trần Thị B", capacity: 10, experience: "medium" },
  { id: "shipper_C", name: "Lê Minh C", capacity: 12, experience: "low" },
];

const warehouse = {
  name: "Kho 908 Phạm Văn Đồng",
  location: { lat: 10.8351, lng: 106.7301 },
};

// Ma trận khoảng cách giả lập (tính theo km và chuyển sang meters)
const distanceMatrix = [
  // Depot (908 PVD)
  [
    0, 15200, 14800, 16100, 12300, 13400, 14100, 2800, 8900, 5600, 8700, 9800,
    9200,
  ],

  // Quận 1 & 3 cluster
  [
    15200, 0, 1200, 2100, 13500, 14200, 14800, 16900, 18200, 17100, 12800,
    13600, 13200,
  ],
  [
    14800, 1200, 0, 1800, 13200, 13900, 14500, 16600, 17900, 16800, 12500,
    13300, 12900,
  ],
  [
    16100, 2100, 1800, 0, 14100, 14800, 15400, 17500, 18800, 17700, 11600,
    12400, 12000,
  ],

  // Quận 7 cluster
  [
    12300, 13500, 13200, 14100, 0, 1800, 2200, 13800, 15100, 14000, 15200,
    16000, 15600,
  ],
  [
    13400, 14200, 13900, 14800, 1800, 0, 1400, 14500, 15800, 14700, 15900,
    16700, 16300,
  ],
  [
    14100, 14800, 14500, 15400, 2200, 1400, 0, 15100, 16400, 15300, 16500,
    17300, 16900,
  ],

  // Thủ Đức & Quận 9 cluster
  [
    2800, 16900, 16600, 17500, 13800, 14500, 15100, 0, 3200, 2100, 11200, 12000,
    11600,
  ],
  [
    8900, 18200, 17900, 18800, 15100, 15800, 16400, 3200, 0, 4500, 14500, 15300,
    14900,
  ],
  [
    5600, 17100, 16800, 17700, 14000, 14700, 15300, 2100, 4500, 0, 12400, 13200,
    12800,
  ],

  // Tân Bình & Gò Vấp cluster
  [
    8700, 12800, 12500, 11600, 15200, 15900, 16500, 11200, 14500, 12400, 0,
    2100, 1700,
  ],
  [
    9800, 13600, 13300, 12400, 16000, 16700, 17300, 12000, 15300, 13200, 2100,
    0, 1400,
  ],
  [
    9200, 13200, 12900, 12000, 15600, 16300, 16900, 11600, 14900, 12800, 1700,
    1400, 0,
  ],
];

console.log("📍 PHÂN TÍCH KHU VỰC TỰ ĐỘNG:");
console.log("-".repeat(50));

// Phân tích phân bố địa lý
const analysis = VRPService.analyzeGeographicDistribution(
  orders,
  distanceMatrix
);

console.log();
console.log("📊 KẾT QUẢ PHÂN TÍCH:");
console.log(`• Tổng số khu vực: ${analysis.totalZones}`);
console.log(`• Trung bình orders/khu vực: ${analysis.averageOrdersPerZone}`);
console.log();

analysis.zoneDetails.forEach((zone) => {
  console.log(
    `Zone ${zone.zoneId}: ${zone.orderCount} orders, ${zone.totalWeight}kg, đường kính ${zone.diameter}`
  );
  console.log(`  └─ Trung tâm: ${zone.centerAddress}`);
});

console.log();
if (analysis.recommendations.length > 0) {
  console.log("💡 GỢI Ý TỐI ƯU:");
  analysis.recommendations.forEach((rec) => console.log(`   ${rec}`));
  console.log();
}

console.log("🚛 THỰC HIỆN TỐI ƯU THEO KHU VỰC:");
console.log("-".repeat(50));

// Giải bài toán VRP với zone-based optimization
const problem = {
  distanceMatrix: distanceMatrix,
  orders: orders,
  vehicles: shippers,
  depot: warehouse,
  options: {
    optimizationIterations: 100,
    analyzeZones: true,
  },
};

console.time("Zone Optimization Time");
const solution = VRPService.solveMultiVehicleVRP(problem);
console.timeEnd("Zone Optimization Time");

console.log();
console.log("📋 KẾT QUẢ CUỐI CÙNG:");
console.log("=".repeat(70));

console.log(
  `🎯 Tổng khoảng cách: ${(solution.totalDistance / 1000).toFixed(1)}km`
);
console.log(`⏱️  Tổng thời gian ước tính: ${solution.totalTime} phút`);
console.log(`📦 Số tuyến đường: ${solution.routes.length}`);
console.log();

solution.routes.forEach((route, index) => {
  if (route.orders.length === 0) return;

  console.log(`🚚 Tuyến ${index + 1} - ${route.vehicle.name}:`);
  console.log(`   📍 Số đơn hàng: ${route.orders.length}`);
  console.log(
    `   📏 Khoảng cách: ${(route.totalDistance / 1000).toFixed(1)}km`
  );
  console.log(`   ⚖️  Tải trọng: ${route.load}kg/${route.vehicle.capacity}kg`);
  console.log(`   ⏱️  Thời gian: ${route.totalTime} phút`);

  console.log(`   📋 Danh sách giao hàng:`);
  console.log(`      0️⃣  Kho ${warehouse.name}`);

  route.orders.forEach((order, orderIndex) => {
    console.log(
      `      ${orderIndex + 1}️⃣  ${order.address} - ${order.weight}kg`
    );
  });

  console.log(`      🔄 Về kho ${warehouse.name}`);
  console.log();
});

// Phân tích hiệu quả
console.log("📈 PHÂN TÍCH HIỆU QUẢ:");
console.log("-".repeat(30));

const avgDistancePerOrder = (
  solution.totalDistance /
  orders.length /
  1000
).toFixed(1);
const avgTimePerOrder = Math.round(solution.totalTime / orders.length);

console.log(`📊 Trung bình mỗi đơn hàng:`);
console.log(`   • Khoảng cách: ${avgDistancePerOrder}km`);
console.log(`   • Thời gian: ${avgTimePerOrder} phút`);
console.log();

console.log(`🏆 ƯU ĐIỂM CỦA ZONE-BASED OPTIMIZATION:`);
console.log(`   ✅ Giảm chi phí di chuyển giữa các khu vực xa`);
console.log(`   ✅ Shipper quen thuộc với khu vực được gán`);
console.log(`   ✅ Dễ dàng tăng/giảm shipper theo mật độ đơn hàng`);
console.log(`   ✅ Tối ưu thời gian giao hàng trong cùng khu vực`);
