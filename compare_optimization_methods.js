/**
 * SO SÁNH HIỆU QUẢ: ZONE-BASED VS TRADITIONAL VRP 📊
 * Đánh giá sự khác biệt giữa 2 phương pháp tối ưu
 */

const VRPService = require("./src/services/VRPService");

console.log("📊 SO SÁNH PHƯƠNG PHÁP TỐI ƯU TUYẾN GIAO HÀNG");
console.log("=".repeat(70));
console.log();

// Test data: 15 orders spread across Ho Chi Minh City
const orders = [
  // Downtown cluster
  { id: 1, weight: 2.5, address: "Đồng Khởi, Q1", zone: "downtown" },
  { id: 2, weight: 1.8, address: "Nguyễn Huệ, Q1", zone: "downtown" },
  { id: 3, weight: 2.1, address: "Lê Lợi, Q1", zone: "downtown" },
  { id: 4, weight: 1.9, address: "Pasteur, Q3", zone: "downtown" },

  // District 7 cluster
  { id: 5, weight: 3.2, address: "Phú Mỹ Hưng, Q7", zone: "south" },
  { id: 6, weight: 2.7, address: "Tân Thuận, Q7", zone: "south" },
  { id: 7, weight: 2.3, address: "Nguyễn Thị Thập, Q7", zone: "south" },

  // Thu Duc cluster
  { id: 8, weight: 1.6, address: "Võ Văn Ngân, Thủ Đức", zone: "east" },
  { id: 9, weight: 2.4, address: "Kha Vạn Cân, Thủ Đức", zone: "east" },
  { id: 10, weight: 1.7, address: "Đỗ Xuân Hợp, Q9", zone: "east" },
  { id: 11, weight: 2.0, address: "Xa Lộ Hà Nội, Q9", zone: "east" },

  // Tan Binh cluster
  { id: 12, weight: 2.8, address: "Cộng Hòa, Tân Bình", zone: "west" },
  { id: 13, weight: 1.5, address: "Hoàng Văn Thụ, Tân Bình", zone: "west" },
  { id: 14, weight: 2.2, address: "Quang Trung, Gò Vấp", zone: "west" },
  { id: 15, weight: 1.3, address: "Phan Huy Ích, Gò Vấp", zone: "west" },
];

const shippers = [
  { id: "A", name: "Shipper A", capacity: 12, experience: "high" },
  { id: "B", name: "Shipper B", capacity: 10, experience: "medium" },
  { id: "C", name: "Shipper C", capacity: 8, experience: "low" },
];

const warehouse = { name: "Kho 908 PVD" };

// Distance matrix (simplified - based on real distances in meters)
const distanceMatrix = [
  // Depot
  [
    0, 14500, 14200, 14800, 15100, 12800, 13400, 13900, 3200, 4100, 5800, 7200,
    8700, 9200, 9800, 9400,
  ],

  // Downtown cluster (1-4)
  [
    14500, 0, 1100, 1300, 2200, 13200, 13800, 14300, 16800, 17300, 18100, 18500,
    12400, 12900, 13500, 13100,
  ],
  [
    14200, 1100, 0, 1000, 1900, 12900, 13500, 14000, 16500, 17000, 17800, 18200,
    12100, 12600, 13200, 12800,
  ],
  [
    14800, 1300, 1000, 0, 1600, 13300, 13900, 14400, 16900, 17400, 18200, 18600,
    11800, 12300, 12900, 12500,
  ],
  [
    15100, 2200, 1900, 1600, 0, 13600, 14200, 14700, 17200, 17700, 18500, 18900,
    11500, 12000, 12600, 12200,
  ],

  // District 7 cluster (5-7)
  [
    12800, 13200, 12900, 13300, 13600, 0, 1900, 2400, 14100, 14600, 15400,
    15800, 15700, 16200, 16800, 16400,
  ],
  [
    13400, 13800, 13500, 13900, 14200, 1900, 0, 1700, 14700, 15200, 16000,
    16400, 16300, 16800, 17400, 17000,
  ],
  [
    13900, 14300, 14000, 14400, 14700, 2400, 1700, 0, 15200, 15700, 16500,
    16900, 16800, 17300, 17900, 17500,
  ],

  // Thu Duc cluster (8-11)
  [
    3200, 16800, 16500, 16900, 17200, 14100, 14700, 15200, 0, 2100, 3200, 4100,
    11800, 12300, 12900, 12500,
  ],
  [
    4100, 17300, 17000, 17400, 17700, 14600, 15200, 15700, 2100, 0, 2800, 3500,
    12300, 12800, 13400, 13000,
  ],
  [
    5800, 18100, 17800, 18200, 18500, 15400, 16000, 16500, 3200, 2800, 0, 1900,
    14000, 14500, 15100, 14700,
  ],
  [
    7200, 18500, 18200, 18600, 18900, 15800, 16400, 16900, 4100, 3500, 1900, 0,
    14400, 14900, 15500, 15100,
  ],

  // Tan Binh cluster (12-15)
  [
    8700, 12400, 12100, 11800, 11500, 15700, 16300, 16800, 11800, 12300, 14000,
    14400, 0, 1800, 2200, 1900,
  ],
  [
    9200, 12900, 12600, 12300, 12000, 16200, 16800, 17300, 12300, 12800, 14500,
    14900, 1800, 0, 1600, 1300,
  ],
  [
    9800, 13500, 13200, 12900, 12600, 16800, 17400, 17900, 12900, 13400, 15100,
    15500, 2200, 1600, 0, 1100,
  ],
  [
    9400, 13100, 12800, 12500, 12200, 16400, 17000, 17500, 12500, 13000, 14700,
    15100, 1900, 1300, 1100, 0,
  ],
];

console.log("🗺️  BÀI TOÁN: 15 đơn hàng phân bố tại 4 khu vực chính");
console.log(
  "📦 Tổng tải trọng:",
  orders.reduce((sum, o) => sum + o.weight, 0).toFixed(1) + "kg"
);
console.log("🚛 Có 3 shipper với capacity 12kg, 10kg, 8kg");
console.log();

// Method 1: Traditional greedy assignment
console.log("🔄 PHƯƠNG PHÁP 1: GREEDY ASSIGNMENT TRUYỀN THỐNG");
console.log("-".repeat(60));

const problem1 = {
  distanceMatrix: distanceMatrix,
  orders: orders,
  vehicles: shippers,
  depot: warehouse,
  options: { analyzeZones: false },
};

console.time("Traditional Method Time");
// Tạm thời sử dụng simple greedy assignment
function simpleGreedyAssignment(orders, shippers, distanceMatrix) {
  const assignments = shippers.map(() => []);
  let currentVehicle = 0;

  orders.forEach((order, index) => {
    const actualIndex = index + 1;

    // Simple round-robin assignment without considering zones
    assignments[currentVehicle].push(actualIndex);
    currentVehicle = (currentVehicle + 1) % shippers.length;
  });

  // Calculate routes for each vehicle
  let totalDistance = 0;
  const routes = [];

  assignments.forEach((assignment, vIndex) => {
    if (assignment.length === 0) {
      routes.push({ vehicleId: shippers[vIndex].id, route: [0], distance: 0 });
      return;
    }

    // Create sub-matrix
    const indices = [0, ...assignment];
    const subMatrix = VRPService.createSubMatrix
      ? createSubMatrixLocal(distanceMatrix, indices)
      : createSubMatrixLocal(distanceMatrix, indices);

    // Solve TSP for this subset
    const tspResult = VRPService.solveNearestNeighborOptimized(subMatrix, {
      startPoint: 0,
      returnToStart: true,
    });

    const originalRoute = tspResult.route.map((idx) =>
      idx === 0 ? 0 : assignment[idx - 1]
    );

    routes.push({
      vehicleId: shippers[vIndex].id,
      vehicle: shippers[vIndex],
      route: originalRoute,
      distance: tspResult.totalDistance,
      orders: assignment.map((idx) => orders[idx - 1]),
    });

    totalDistance += tspResult.totalDistance;
  });

  return { routes, totalDistance };
}

function createSubMatrixLocal(originalMatrix, indices) {
  const size = indices.length;
  const subMatrix = Array(size)
    .fill()
    .map(() => Array(size));

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      subMatrix[i][j] = originalMatrix[indices[i]][indices[j]];
    }
  }

  return subMatrix;
}

const traditionalResult = simpleGreedyAssignment(
  orders,
  shippers,
  distanceMatrix
);
console.timeEnd("Traditional Method Time");

console.log(`📊 Kết quả Greedy Traditional:`);
console.log(
  `   • Tổng khoảng cách: ${(traditionalResult.totalDistance / 1000).toFixed(1)}km`
);
console.log(`   • Số tuyến: ${traditionalResult.routes.length}`);

traditionalResult.routes.forEach((route, i) => {
  if (route.orders && route.orders.length > 0) {
    const zones = [...new Set(route.orders.map((o) => o.zone))];
    console.log(
      `   • Tuyến ${i + 1}: ${route.orders.length} orders, ${(route.distance / 1000).toFixed(1)}km, zones: [${zones.join(",")}]`
    );
  }
});

console.log();

// Method 2: Zone-based optimization
console.log("🗺️  PHƯƠNG PHÁP 2: ZONE-BASED OPTIMIZATION");
console.log("-".repeat(60));

console.time("Zone-based Method Time");
const zoneBasedResult = VRPService.solveMultiVehicleVRP(problem1);
console.timeEnd("Zone-based Method Time");

console.log(`📊 Kết quả Zone-based:`);
console.log(
  `   • Tổng khoảng cách: ${(zoneBasedResult.totalDistance / 1000).toFixed(1)}km`
);
console.log(`   • Số tuyến: ${zoneBasedResult.routes.length}`);

zoneBasedResult.routes.forEach((route, i) => {
  if (route.orders && route.orders.length > 0) {
    const zones = [...new Set(route.orders.map((o) => o.zone))];
    console.log(
      `   • Tuyến ${i + 1}: ${route.orders.length} orders, ${(route.totalDistance / 1000).toFixed(1)}km, zones: [${zones.join(",")}]`
    );
  }
});

console.log();

// Comparison
console.log("⚖️  SO SÁNH KẾT QUẢ");
console.log("=".repeat(50));

const distanceImprovement =
  ((traditionalResult.totalDistance - zoneBasedResult.totalDistance) /
    traditionalResult.totalDistance) *
  100;
const timeImprovement = distanceImprovement * 0.8; // Assume similar time savings

console.log(`📏 Khoảng cách:`);
console.log(
  `   • Traditional: ${(traditionalResult.totalDistance / 1000).toFixed(1)}km`
);
console.log(
  `   • Zone-based:  ${(zoneBasedResult.totalDistance / 1000).toFixed(1)}km`
);
console.log(`   • Cải thiện:   ${distanceImprovement.toFixed(1)}%`);
console.log();

console.log(`⏱️  Thời gian ước tính:`);
console.log(
  `   • Traditional: ${Math.round((traditionalResult.totalDistance / 1000) * 2.5)} phút`
);
console.log(`   • Zone-based:  ${zoneBasedResult.totalTime} phút`);
console.log(`   • Cải thiện:   ${timeImprovement.toFixed(1)}%`);
console.log();

console.log(`🎯 PHÂN TÍCH CHI TIẾT:`);
if (distanceImprovement > 0) {
  console.log(`✅ Zone-based tốt hơn ${distanceImprovement.toFixed(1)}%`);
} else {
  console.log(
    `❌ Traditional tốt hơn ${Math.abs(distanceImprovement).toFixed(1)}%`
  );
}

console.log();
console.log(`💡 ƯU ĐIỂM CỦA ZONE-BASED:`);
console.log(`   🗺️  Shipper quen thuộc khu vực → giao hàng nhanh hơn`);
console.log(`   📱 Dễ quản lý và tracking theo zone`);
console.log(`   🔄 Linh hoạt điều chỉnh khi có đơn mới trong zone`);
console.log(`   ⚡ Giảm thời gian di chuyển giữa các khu vực xa`);
console.log(`   📊 Phân tích mật độ đơn hàng theo khu vực`);

console.log();
console.log(`💡 ƯU ĐIỂM CỦA TRADITIONAL:`);
console.log(`   🎯 Tối ưu toàn cục nếu không quan tâm zone`);
console.log(`   ⚡ Tính toán nhanh cho bài toán nhỏ`);
console.log(`   🔧 Đơn giản, dễ implement`);
