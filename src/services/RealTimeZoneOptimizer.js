/**
 * REAL-TIME ZONE OPTIMIZATION 🔄
 * Tối ưu động khi có đơn hàng mới vào zone
 */

const VRPService = require("./src/services/VRPService");

class RealTimeZoneOptimizer {
  constructor() {
    this.activeZones = new Map();
    this.activeShippers = new Map();
    this.warehouseLocation = { lat: 10.8351, lng: 106.7301 };
  }

  /**
   * Khởi tạo hệ thống với orders và shippers ban đầu
   */
  initialize(initialOrders, shippers, distanceMatrix) {
    console.log("🔄 KHỞI TẠO REAL-TIME ZONE OPTIMIZER");
    console.log("=".repeat(50));

    // Detect initial zones
    const zones = VRPService.detectGeographicZones(
      initialOrders,
      distanceMatrix
    );

    // Store zones
    zones.forEach((zone) => {
      this.activeZones.set(zone.id, {
        ...zone,
        assignedShipper: null,
        orders: zone.orderIndices.map((idx) => initialOrders[idx - 1]),
        lastOptimized: Date.now(),
        isActive: true,
      });
    });

    // Store shippers
    shippers.forEach((shipper) => {
      this.activeShippers.set(shipper.id, {
        ...shipper,
        currentZone: null,
        currentLoad: 0,
        isActive: true,
        location: this.warehouseLocation, // Start at warehouse
      });
    });

    console.log(
      `✅ Initialized with ${zones.length} zones, ${shippers.length} shippers`
    );
    this.displayCurrentState();

    return this.optimizeInitialAssignments(distanceMatrix);
  }

  /**
   * Tối ưu assignments ban đầu
   */
  optimizeInitialAssignments(distanceMatrix) {
    console.log("\n🎯 OPTIMIZING INITIAL ZONE ASSIGNMENTS");
    console.log("-".repeat(40));

    const zones = Array.from(this.activeZones.values());
    const shippers = Array.from(this.activeShippers.values());

    // Simple assignment algorithm
    zones.forEach((zone) => {
      let bestShipper = null;
      let bestScore = Infinity;

      shippers.forEach((shipper) => {
        if (shipper.currentZone !== null) return; // Already assigned

        // Check capacity
        if (zone.totalWeight > shipper.capacity) return;

        // Calculate score: distance to zone center
        const score = distanceMatrix[0][zone.centerOrderIndex];

        if (score < bestScore) {
          bestScore = score;
          bestShipper = shipper;
        }
      });

      if (bestShipper) {
        zone.assignedShipper = bestShipper.id;
        bestShipper.currentZone = zone.id;
        bestShipper.currentLoad = zone.totalWeight;

        console.log(
          `   ✓ Zone ${zone.id} (${zone.totalWeight}kg) → ${bestShipper.name}`
        );
      } else {
        console.log(
          `   ⚠️ Zone ${zone.id} không thể assign (quá tải hoặc hết shipper)`
        );
      }
    });

    return this.getCurrentSolution();
  }

  /**
   * Thêm đơn hàng mới vào hệ thống
   */
  addNewOrder(newOrder, estimatedCoords, distanceToExistingOrders) {
    console.log(`\n📦 THÊM ĐƠN HÀNG MỚI: ${newOrder.address}`);
    console.log("-".repeat(40));

    // Find best zone for new order
    const bestZone = this.findBestZoneForOrder(
      newOrder,
      distanceToExistingOrders
    );

    if (bestZone) {
      return this.insertOrderIntoZone(newOrder, bestZone.id);
    } else {
      return this.createNewZoneForOrder(newOrder);
    }
  }

  /**
   * Tìm zone tốt nhất cho order mới
   */
  findBestZoneForOrder(newOrder, distanceToOrders) {
    const ZONE_THRESHOLD = 5000; // 5km
    let bestZone = null;
    let bestScore = Infinity;

    this.activeZones.forEach((zone, zoneId) => {
      // Check if order is close enough to existing orders in zone
      let isCloseToZone = false;
      let minDistance = Infinity;

      zone.orderIndices.forEach((orderIdx) => {
        const distance = distanceToOrders[orderIdx - 1] || Infinity;
        if (distance <= ZONE_THRESHOLD) {
          isCloseToZone = true;
          minDistance = Math.min(minDistance, distance);
        }
      });

      if (!isCloseToZone) return;

      // Check capacity if there's assigned shipper
      if (zone.assignedShipper) {
        const shipper = this.activeShippers.get(zone.assignedShipper);
        if (
          shipper &&
          shipper.currentLoad + newOrder.weight > shipper.capacity
        ) {
          return; // Skip if would exceed capacity
        }
      }

      // Score = average distance to zone + load factor
      const loadFactor = zone.totalWeight / 10; // Prefer less loaded zones
      const score = minDistance + loadFactor * 1000;

      if (score < bestScore) {
        bestScore = score;
        bestZone = zone;
      }
    });

    if (bestZone) {
      console.log(
        `   🎯 Best zone: Zone ${bestZone.id} (distance: ${(bestScore / 1000).toFixed(1)}km)`
      );
    } else {
      console.log(`   ❌ Không tìm thấy zone phù hợp (quá xa hoặc quá tải)`);
    }

    return bestZone;
  }

  /**
   * Thêm order vào zone hiện tại
   */
  insertOrderIntoZone(newOrder, zoneId) {
    const zone = this.activeZones.get(zoneId);
    const shipper = zone.assignedShipper
      ? this.activeShippers.get(zone.assignedShipper)
      : null;

    console.log(`   ➕ Thêm vào Zone ${zoneId}`);

    // Update zone
    const newOrderIndex = this.getNextOrderIndex();
    zone.orderIndices.push(newOrderIndex);
    zone.orders.push(newOrder);
    zone.totalWeight += newOrder.weight;
    zone.lastOptimized = Date.now();

    // Update shipper load
    if (shipper) {
      shipper.currentLoad += newOrder.weight;
      console.log(
        `   📊 ${shipper.name} load: ${shipper.currentLoad}/${shipper.capacity}kg`
      );
    }

    // Trigger re-optimization for this zone
    this.reoptimizeZone(zoneId);

    console.log(`   ✅ Order added successfully to Zone ${zoneId}`);
    return this.getCurrentSolution();
  }

  /**
   * Tạo zone mới cho order
   */
  createNewZoneForOrder(newOrder) {
    console.log(`   🆕 Tạo zone mới cho order`);

    const newZoneId = this.activeZones.size;
    const newOrderIndex = this.getNextOrderIndex();

    const newZone = {
      id: newZoneId,
      centerOrderIndex: newOrderIndex,
      orderIndices: [newOrderIndex],
      orders: [newOrder],
      totalWeight: newOrder.weight,
      assignedShipper: null,
      bounds: { minDistance: 0, maxDistance: 0 },
      lastOptimized: Date.now(),
      isActive: true,
    };

    this.activeZones.set(newZoneId, newZone);

    // Try to assign available shipper
    const availableShipper = this.findAvailableShipper(newOrder.weight);
    if (availableShipper) {
      newZone.assignedShipper = availableShipper.id;
      availableShipper.currentZone = newZoneId;
      availableShipper.currentLoad = newOrder.weight;

      console.log(
        `   ✓ Assigned ${availableShipper.name} to new Zone ${newZoneId}`
      );
    } else {
      console.log(`   ⚠️ Không có shipper available cho zone mới`);
    }

    console.log(`   ✅ Created new Zone ${newZoneId}`);
    return this.getCurrentSolution();
  }

  /**
   * Tìm shipper available
   */
  findAvailableShipper(requiredCapacity) {
    for (let [id, shipper] of this.activeShippers) {
      if (
        shipper.currentZone === null &&
        shipper.capacity >= requiredCapacity &&
        shipper.isActive
      ) {
        return shipper;
      }
    }
    return null;
  }

  /**
   * Re-optimize zone khi có thay đổi
   */
  reoptimizeZone(zoneId) {
    const zone = this.activeZones.get(zoneId);
    console.log(
      `   🔄 Re-optimizing Zone ${zoneId} with ${zone.orders.length} orders`
    );

    // In real implementation, would recalculate optimal route within zone
    // For now, just update timestamp
    zone.lastOptimized = Date.now();
  }

  /**
   * Lấy trạng thái hiện tại
   */
  getCurrentSolution() {
    const zones = Array.from(this.activeZones.values());
    const solution = {
      zones: zones.length,
      activeShippers: Array.from(this.activeShippers.values()).filter(
        (s) => s.currentZone !== null
      ).length,
      totalOrders: zones.reduce((sum, z) => sum + z.orders.length, 0),
      totalWeight: zones.reduce((sum, z) => sum + z.totalWeight, 0),
      zoneDetails: zones.map((z) => ({
        zoneId: z.id,
        orders: z.orders.length,
        weight: z.totalWeight,
        shipper: z.assignedShipper
          ? this.activeShippers.get(z.assignedShipper)?.name
          : "Unassigned",
        lastOptimized: new Date(z.lastOptimized).toLocaleTimeString(),
      })),
    };

    return solution;
  }

  /**
   * Hiển thị trạng thái hiện tại
   */
  displayCurrentState() {
    console.log("\n📊 CURRENT SYSTEM STATE");
    console.log("-".repeat(30));

    const solution = this.getCurrentSolution();

    console.log(`🗺️ Active Zones: ${solution.zones}`);
    console.log(`🚛 Active Shippers: ${solution.activeShippers}`);
    console.log(`📦 Total Orders: ${solution.totalOrders}`);
    console.log(`⚖️ Total Weight: ${solution.totalWeight.toFixed(1)}kg`);
    console.log();

    solution.zoneDetails.forEach((zone) => {
      console.log(
        `Zone ${zone.zoneId}: ${zone.orders} orders, ${zone.weight.toFixed(1)}kg → ${zone.shipper}`
      );
    });
  }

  getNextOrderIndex() {
    // Simple counter for demo
    return Date.now() % 10000;
  }
}

// DEMO: Real-time scenario
console.log("🔄 REAL-TIME ZONE OPTIMIZATION DEMO");
console.log("=".repeat(60));
console.log();

const optimizer = new RealTimeZoneOptimizer();

// Initial data
const initialOrders = [
  { id: 1, weight: 2.5, address: "Nguyễn Huệ, Q1" },
  { id: 2, weight: 1.8, address: "Lê Lợi, Q1" },
  { id: 3, weight: 3.2, address: "Phú Mỹ Hưng, Q7" },
  { id: 4, weight: 2.1, address: "Tân Thuận, Q7" },
  { id: 5, weight: 1.6, address: "Võ Văn Ngân, Thủ Đức" },
  { id: 6, weight: 2.4, address: "Đỗ Xuân Hợp, Q9" },
];

const shippers = [
  { id: "A", name: "Shipper A", capacity: 8 },
  { id: "B", name: "Shipper B", capacity: 10 },
  { id: "C", name: "Shipper C", capacity: 6 },
];

// Simplified distance matrix
const distanceMatrix = [
  [0, 15000, 14500, 12500, 13000, 3000, 5500],
  [15000, 0, 1200, 13000, 13500, 17000, 18000],
  [14500, 1200, 0, 12500, 13000, 16500, 17500],
  [12500, 13000, 12500, 0, 1800, 14000, 15000],
  [13000, 13500, 13000, 1800, 0, 14500, 15500],
  [3000, 17000, 16500, 14000, 14500, 0, 3200],
  [5500, 18000, 17500, 15000, 15500, 3200, 0],
];

// Initialize system
optimizer.initialize(initialOrders, shippers, distanceMatrix);

// Simulate new orders arriving
console.log("\n" + "=".repeat(60));
console.log("📱 SIMULATION: NEW ORDERS ARRIVING");
console.log("=".repeat(60));

// New order 1: Close to existing zone
setTimeout(() => {
  const newOrder1 = { id: 7, weight: 1.9, address: "Đồng Khởi, Q1" };
  const distances1 = [999, 800, 15000, 14000, 18000, 17000]; // Close to Q1 orders

  optimizer.addNewOrder(newOrder1, { lat: 10.7748, lng: 106.704 }, distances1);
  optimizer.displayCurrentState();
}, 100);

// New order 2: Requires new zone
setTimeout(() => {
  const newOrder2 = { id: 8, weight: 2.2, address: "Cộng Hòa, Tân Bình" };
  const distances2 = [999, 12000, 11500, 15000, 16000, 9000, 10000]; // Far from all

  optimizer.addNewOrder(newOrder2, { lat: 10.8012, lng: 106.6557 }, distances2);
  optimizer.displayCurrentState();
}, 200);

// New order 3: Close to Thu Duc zone
setTimeout(() => {
  const newOrder3 = { id: 9, weight: 1.7, address: "Kha Vạn Cân, Thủ Đức" };
  const distances3 = [999, 16500, 16000, 14500, 15000, 2100, 4200]; // Close to Thu Duc

  optimizer.addNewOrder(newOrder3, { lat: 10.8485, lng: 106.7659 }, distances3);
  optimizer.displayCurrentState();

  console.log("\n🎯 FINAL SUMMARY:");
  console.log("✅ Real-time zone optimization hoàn thành");
  console.log("📊 3 orders mới đã được tối ưu và phân bổ");
  console.log("🗺️ Zones được tự động điều chỉnh theo địa lý");
  console.log("🚛 Shippers được phân công hợp lý theo capacity");
}, 300);

console.log("\n⏱️ Processing real-time orders...");

module.exports = RealTimeZoneOptimizer;
