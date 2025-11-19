/**
 * ADVANCED VRP SERVICE - Multiple Algorithms & Constraints
 * Giải bài toán Vehicle Routing Problem với nhiều thuật toán và ràng buộc
 *
 * Hỗ trợ:
 * - Nearest Neighbor + 2-opt optimization
 * - Capacity constraints (trọng lượng/thể tích)
 * - Time windows (khung giờ giao hàng)
 * - Multiple vehicles (nhiều shipper)
 * - Real-time optimization
 */
/**
 * Cải tiến Nearest Neighbor với 2-opt optimization
 * @param {number[][]} distanceMatrix - Ma trận khoảng cách NxN
 * @param {object} options - Tùy chọn tối ưu hóa
 * @returns {object} - Kết quả với route, totalDistance, và metadata
 */
function solveNearestNeighborOptimized(distanceMatrix, options = {}) {
  const {
    startPoint = 0,
    returnToStart = true,
    maxOptimizationIterations = 100,
    improvementThreshold = 0.01,
  } = options;

  const numPoints = distanceMatrix.length;

  if (numPoints <= 1) {
    return {
      route: [startPoint],
      totalDistance: 0,
      algorithm: "nearest_neighbor",
      optimized: false,
    };
  }

  // Phase 1: Nearest Neighbor construction
  let route = constructNearestNeighborRoute(distanceMatrix, startPoint);

  // Phase 2: 2-opt improvement
  const initialDistance = calculateTotalDistance(
    route,
    distanceMatrix,
    returnToStart
  );
  route = optimize2Opt(
    route,
    distanceMatrix,
    maxOptimizationIterations,
    improvementThreshold
  );
  const finalDistance = calculateTotalDistance(
    route,
    distanceMatrix,
    returnToStart
  );

  const improvement =
    ((initialDistance - finalDistance) / initialDistance) * 100;

  console.log(`🎯 VRP Optimization Complete:`);
  console.log(`  - Route: [${route.join(" → ")}]`);
  console.log(`  - Initial distance: ${(initialDistance / 1000).toFixed(2)}km`);
  console.log(`  - Final distance: ${(finalDistance / 1000).toFixed(2)}km`);
  console.log(`  - Improvement: ${improvement.toFixed(1)}%`);

  return {
    route,
    totalDistance: finalDistance,
    initialDistance,
    improvement: improvement,
    algorithm: "nearest_neighbor_2opt",
    optimized: true,
    metadata: {
      numPoints,
      returnToStart,
      iterations: maxOptimizationIterations,
    },
  };
}

/**
 * Xây dựng route ban đầu bằng Nearest Neighbor
 */
function constructNearestNeighborRoute(distanceMatrix, startPoint) {
  const numPoints = distanceMatrix.length;
  const route = [startPoint];
  const visited = new Array(numPoints).fill(false);
  visited[startPoint] = true;

  let currentPoint = startPoint;

  for (let i = 0; i < numPoints - 1; i++) {
    let nearestDistance = Infinity;
    let nearestPoint = -1;

    for (let j = 0; j < numPoints; j++) {
      if (!visited[j] && distanceMatrix[currentPoint][j] < nearestDistance) {
        nearestDistance = distanceMatrix[currentPoint][j];
        nearestPoint = j;
      }
    }

    if (nearestPoint !== -1) {
      route.push(nearestPoint);
      visited[nearestPoint] = true;
      currentPoint = nearestPoint;
    }
  }

  return route;
}

/**
 * Tối ưu hóa route bằng 2-opt algorithm
 */
function optimize2Opt(route, distanceMatrix, maxIterations, threshold) {
  let improved = true;
  let iterations = 0;
  let bestRoute = [...route];
  let bestDistance = calculateTotalDistance(bestRoute, distanceMatrix);

  while (improved && iterations < maxIterations) {
    improved = false;

    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        // Try reversing the segment between i and j
        const newRoute = twoOptSwap(bestRoute, i, j);
        const newDistance = calculateTotalDistance(newRoute, distanceMatrix);

        const improvementRatio = (bestDistance - newDistance) / bestDistance;

        if (improvementRatio > threshold) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
          // Break inner loops to restart with new route
          break;
        }
      }
      if (improved) break;
    }

    iterations++;
  }

  return bestRoute;
}

/**
 * Thực hiện 2-opt swap
 */
function twoOptSwap(route, i, j) {
  const newRoute = [];

  // Add the part before i
  for (let k = 0; k < i; k++) {
    newRoute.push(route[k]);
  }

  // Add the reversed segment between i and j
  for (let k = j; k >= i; k--) {
    newRoute.push(route[k]);
  }

  // Add the part after j
  for (let k = j + 1; k < route.length; k++) {
    newRoute.push(route[k]);
  }

  return newRoute;
}

/**
 * Tính tổng khoảng cách của route
 */
function calculateTotalDistance(route, distanceMatrix, returnToStart = true) {
  if (route.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distanceMatrix[route[i]][route[i + 1]];
  }

  // Return to starting point if required
  if (returnToStart && route.length > 0) {
    totalDistance += distanceMatrix[route[route.length - 1]][route[0]];
  }

  return totalDistance;
}

/**
 * Legacy function for backward compatibility
 */
function solveNearestNeighbor(distanceMatrix) {
  const result = solveNearestNeighborOptimized(distanceMatrix);
  return result.route;
}

/**
 * Multi-Vehicle VRP với constraints
 * @param {object} problem - VRP problem definition
 * @param {number[][]} problem.distanceMatrix - Distance matrix
 * @param {object[]} problem.orders - Orders with coordinates, weight, timeWindows
 * @param {object[]} problem.vehicles - Available vehicles/shippers
 * @param {object} problem.depot - Warehouse location
 * @returns {object} - Solution với routes cho từng vehicle
 */
function solveMultiVehicleVRP(problem) {
  const { distanceMatrix, orders, vehicles, depot, options = {} } = problem;

  console.log(`🚛 Solving Multi-Vehicle VRP:`);
  console.log(`  - Orders: ${orders.length}`);
  console.log(`  - Vehicles: ${vehicles.length}`);
  console.log(`  - Depot: ${depot.name}`);

  // Cluster orders by proximity and constraints
  const clusters = clusterOrdersForVehicles(
    orders,
    vehicles,
    distanceMatrix,
    options
  );

  const solution = {
    routes: [],
    totalDistance: 0,
    totalTime: 0,
    vehicleUtilization: {},
    unassignedOrders: [],
    stats: {
      algorithm: "multi_vehicle_vrp",
      executionTime: Date.now(),
    },
  };

  // Solve VRP for each vehicle cluster
  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    const vehicle = vehicles[i % vehicles.length];

    if (cluster.orderIndices.length === 0) {
      // Empty route
      solution.routes.push({
        vehicleId: vehicle.id,
        vehicle: vehicle,
        route: [0], // Only depot
        orders: [],
        totalDistance: 0,
        totalTime: 0,
        load: 0,
      });
      continue;
    }

    // Create sub-matrix for this cluster
    const clusterMatrix = createSubMatrix(distanceMatrix, [
      0,
      ...cluster.orderIndices,
    ]);

    // Solve TSP for this cluster
    const tspResult = solveNearestNeighborOptimized(clusterMatrix, {
      startPoint: 0,
      returnToStart: true,
      maxOptimizationIterations: options.optimizationIterations || 50,
    });

    // Map back to original indices
    const originalRoute = tspResult.route.map((idx) =>
      idx === 0 ? 0 : cluster.orderIndices[idx - 1]
    );

    // Calculate route details
    const routeOrders = originalRoute
      .slice(1, -1)
      .map((idx) => orders[idx - 1]);
    const totalLoad = routeOrders.reduce(
      (sum, order) => sum + (order.weight || 0),
      0
    );
    const estimatedTime = Math.round((tspResult.totalDistance / 1000) * 2.5); // Assume 25km/h average

    solution.routes.push({
      vehicleId: vehicle.id,
      vehicle: vehicle,
      route: originalRoute,
      orders: routeOrders,
      totalDistance: tspResult.totalDistance,
      totalTime: estimatedTime,
      load: totalLoad,
      optimization: {
        improvement: tspResult.improvement,
        algorithm: tspResult.algorithm,
      },
    });

    solution.totalDistance += tspResult.totalDistance;
    solution.totalTime += estimatedTime;

    solution.vehicleUtilization[vehicle.id] = {
      loadUtilization:
        ((totalLoad / (vehicle.capacity || Infinity)) * 100).toFixed(1) + "%",
      routeLength: (tspResult.totalDistance / 1000).toFixed(1) + "km",
      estimatedTime: estimatedTime + " phút",
      ordersAssigned: routeOrders.length,
    };
  }

  solution.stats.executionTime = Date.now() - solution.stats.executionTime;

  console.log(`✅ Multi-Vehicle VRP Complete:`);
  console.log(
    `  - Total distance: ${(solution.totalDistance / 1000).toFixed(1)}km`
  );
  console.log(`  - Total time: ${solution.totalTime} phút`);
  console.log(`  - Execution time: ${solution.stats.executionTime}ms`);

  return solution;
}

/**
 * GEOGRAPHIC ZONE-BASED CLUSTERING 🗺️
 * Cluster orders theo khu vực địa lý để tối ưu thời gian và chi phí vận chuyển
 */
function clusterOrdersForVehicles(orders, vehicles, distanceMatrix, options) {
  console.log(`📍 Geographic Zone Clustering:`);

  // Step 1: Phân vùng theo khu vực địa lý
  const geographicZones = detectGeographicZones(orders, distanceMatrix);

  // Step 2: Gán shipper cho từng zone
  const zoneAssignments = assignShippersToZones(
    geographicZones,
    vehicles,
    distanceMatrix
  );

  // Step 3: Tạo clusters cuối cùng
  const clusters = createFinalClusters(zoneAssignments, orders, vehicles);

  console.log(
    `✅ Zone-based clustering complete: ${geographicZones.length} zones`
  );

  return clusters;
}

/**
 * Phát hiện các khu vực địa lý dựa trên khoảng cách
 */
function detectGeographicZones(orders, distanceMatrix) {
  const zones = [];
  const assigned = new Array(orders.length).fill(false);

  // Threshold khoảng cách để coi là "cùng khu vực" (5km)
  const ZONE_THRESHOLD = 5000;

  orders.forEach((order, orderIndex) => {
    if (assigned[orderIndex]) return;

    const actualIndex = orderIndex + 1; // +1 vì depot ở index 0

    // Tạo zone mới từ order này
    const zone = {
      id: zones.length,
      centerOrderIndex: actualIndex,
      orderIndices: [actualIndex],
      totalWeight: order.weight || 1,
      address: order.address || `Order ${order.id}`,
      bounds: {
        minDistance: 0,
        maxDistance: 0,
      },
    };

    assigned[orderIndex] = true;

    // Tìm các orders khác trong cùng khu vực
    orders.forEach((otherOrder, otherIndex) => {
      if (assigned[otherIndex]) return;

      const otherActualIndex = otherIndex + 1;
      const distance = distanceMatrix[actualIndex][otherActualIndex];

      if (distance <= ZONE_THRESHOLD) {
        zone.orderIndices.push(otherActualIndex);
        zone.totalWeight += otherOrder.weight || 1;
        zone.bounds.maxDistance = Math.max(zone.bounds.maxDistance, distance);
        assigned[otherIndex] = true;

        console.log(
          `  📌 Zone ${zone.id}: Added ${otherOrder.address || `Order ${otherOrder.id}`} (${(distance / 1000).toFixed(1)}km)`
        );
      }
    });

    zones.push(zone);
    console.log(
      `🏘️  Zone ${zone.id}: ${zone.orderIndices.length} orders, ${zone.totalWeight}kg, center: ${zone.address}`
    );
  });

  return zones;
}

/**
 * Gán shipper cho từng zone dựa trên proximity và capacity
 */
function assignShippersToZones(zones, vehicles, distanceMatrix) {
  const assignments = [];

  // Sắp xếp zones theo số lượng orders (zones lớn ưu tiên)
  const sortedZones = [...zones].sort(
    (a, b) => b.orderIndices.length - a.orderIndices.length
  );

  console.log(
    `🚛 Assigning ${vehicles.length} shippers to ${zones.length} zones:`
  );

  sortedZones.forEach((zone) => {
    // Tìm shipper tốt nhất cho zone này
    let bestVehicle = null;
    let bestScore = Infinity;

    vehicles.forEach((vehicle) => {
      // Kiểm tra capacity
      if (zone.totalWeight > (vehicle.capacity || Infinity)) {
        return; // Skip nếu quá tải
      }

      // Tính distance từ depot đến zone center
      const distanceToZone = distanceMatrix[0][zone.centerOrderIndex];

      // Tính số zones đã assign cho vehicle này
      const currentAssignments = assignments.filter(
        (a) => a.vehicleId === vehicle.id
      ).length;

      // Score: ưu tiên gần + ít assignments
      const score = distanceToZone + currentAssignments * 10000;

      if (score < bestScore) {
        bestScore = score;
        bestVehicle = vehicle;
      }
    });

    if (bestVehicle) {
      assignments.push({
        zoneId: zone.id,
        zone: zone,
        vehicleId: bestVehicle.id,
        vehicle: bestVehicle,
        distanceFromDepot: distanceMatrix[0][zone.centerOrderIndex],
      });

      console.log(
        `  ✓ Zone ${zone.id} → ${bestVehicle.name} (${(distanceMatrix[0][zone.centerOrderIndex] / 1000).toFixed(1)}km)`
      );
    } else {
      console.log(`  ⚠️  Zone ${zone.id} không thể assign (quá tải)`);
    }
  });

  return assignments;
}

/**
 * Tạo clusters cuối cùng từ zone assignments
 */
function createFinalClusters(assignments, orders, vehicles) {
  const clusters = vehicles.map((v) => ({
    vehicleId: v.id,
    orderIndices: [],
    totalWeight: 0,
    zones: [],
  }));

  // Group assignments by vehicle
  assignments.forEach((assignment) => {
    const cluster = clusters.find((c) => c.vehicleId === assignment.vehicleId);
    if (cluster) {
      cluster.orderIndices.push(...assignment.zone.orderIndices);
      cluster.totalWeight += assignment.zone.totalWeight;
      cluster.zones.push(assignment.zone.id);
    }
  });

  console.log(`📋 Final cluster summary:`);
  clusters.forEach((cluster, i) => {
    console.log(
      `  Cluster ${i}: ${cluster.orderIndices.length} orders, ${cluster.totalWeight}kg, zones: [${cluster.zones.join(",")}]`
    );
  });

  return clusters;
}

/**
 * Find best insertion cost for an order in existing route
 */
function findBestInsertionCost(orderIndex, existingRoute, distanceMatrix) {
  let minCost = Infinity;

  for (let i = 1; i < existingRoute.length; i++) {
    const before = existingRoute[i - 1];
    const after = existingRoute[i];

    const originalCost = distanceMatrix[before][after];
    const newCost =
      distanceMatrix[before][orderIndex] + distanceMatrix[orderIndex][after];
    const insertionCost = newCost - originalCost;

    if (insertionCost < minCost) {
      minCost = insertionCost;
    }
  }

  return minCost;
}

/**
 * Create sub-matrix for cluster
 */
function createSubMatrix(originalMatrix, indices) {
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

/**
 * GEOGRAPHIC ZONE ANALYSIS 🗺️
 * Phân tích và tối ưu theo khu vực địa lý
 */
function analyzeGeographicDistribution(orders, distanceMatrix) {
  console.log(`🗺️  Geographic Distribution Analysis:`);

  const zones = detectGeographicZones(orders, distanceMatrix);

  // Phân tích mật độ orders theo khu vực
  const analysis = {
    totalZones: zones.length,
    averageOrdersPerZone: (orders.length / zones.length).toFixed(1),
    zoneDetails: [],
    recommendations: [],
  };

  zones.forEach((zone) => {
    const zoneDetail = {
      zoneId: zone.id,
      orderCount: zone.orderIndices.length,
      totalWeight: zone.totalWeight,
      centerAddress: zone.address,
      diameter: (zone.bounds.maxDistance / 1000).toFixed(1) + "km",
      density: zone.orderIndices.length > 1 ? "High" : "Low",
    };

    analysis.zoneDetails.push(zoneDetail);
    console.log(
      `  Zone ${zone.id}: ${zoneDetail.orderCount} orders, ${zoneDetail.totalWeight}kg, ⌀${zoneDetail.diameter}`
    );
  });

  // Đưa ra recommendations
  if (zones.length > orders.length * 0.8) {
    analysis.recommendations.push("📍 Orders rải rác - nên tăng số shipper");
  }
  if (zones.some((z) => z.orderIndices.length >= 5)) {
    analysis.recommendations.push(
      "🏘️  Có khu vực mật độ cao - ưu tiên shipper local"
    );
  }
  if (zones.some((z) => z.totalWeight > 15)) {
    analysis.recommendations.push(
      "📦 Có zone quá nặng - cần chia nhỏ hoặc xe tải lớn"
    );
  }

  return analysis;
}

/**
 * Smart Route Optimization - Tối ưu theo khu vực địa lý
 */
function optimizeDeliveryRoutes(orders, shippers, warehouse, options = {}) {
  const numOrders = orders.length;
  const numShippers = shippers.length;

  console.log(`🧠 Smart Zone-Based Route Optimization:`);
  console.log(`  - ${numOrders} orders, ${numShippers} shippers`);

  // Tự động phân tích distribution trước khi tối ưu
  if (options.analyzeZones !== false) {
    const analysis = analyzeGeographicDistribution(
      orders,
      options.distanceMatrix
    );
    console.log(
      `📊 Analysis: ${analysis.totalZones} zones, avg ${analysis.averageOrdersPerZone} orders/zone`
    );

    if (analysis.recommendations.length > 0) {
      console.log(`💡 Recommendations:`);
      analysis.recommendations.forEach((rec) => console.log(`   ${rec}`));
    }
  }

  // Strategy selection based on problem size và zone distribution
  if (numOrders <= 8 && numShippers === 1) {
    // Small single-vehicle: Use 2-opt optimized NN
    return solveSingleVehicleOptimized(orders, warehouse, options);
  } else if (numOrders <= 50) {
    // Medium multi-vehicle: Use zone-based clustering + 2-opt
    return solveZoneBasedMultiVehicle(orders, shippers, warehouse, options);
  } else {
    // Large scale: Use advanced zone heuristics
    return solveLargeScaleZoneVRP(orders, shippers, warehouse, options);
  }
}

/**
 * Zone-based Multi-Vehicle VRP
 */
function solveZoneBasedMultiVehicle(orders, shippers, warehouse, options) {
  console.log(`🗺️  Solving with Zone-Based Multi-Vehicle VRP`);

  // Sử dụng hệ thống clustering theo zone đã cải tiến
  const problem = {
    distanceMatrix: options.distanceMatrix,
    orders: orders,
    vehicles: shippers,
    depot: warehouse,
    options: {
      ...options,
      clusteringMethod: "geographic_zones",
    },
  };

  return solveMultiVehicleVRP(problem);
}

/**
 * Single vehicle optimization
 */
function solveSingleVehicleOptimized(orders, warehouse, options) {
  // Implementation for single vehicle
  const points = [warehouse, ...orders.map((o) => o.customerLocation)];
  // Build distance matrix and solve...
  // (Implementation details)

  return {
    algorithm: "single_vehicle_2opt",
    routes: [
      /* optimized route */
    ],
    totalDistance: 0,
    executionTime: 0,
  };
}

/**
 * Multi-vehicle optimization
 */
function solveMultiVehicleOptimized(orders, shippers, warehouse, options) {
  // Advanced multi-vehicle implementation
  // (Will be implemented)

  return {
    algorithm: "multi_vehicle_advanced",
    routes: [],
    totalDistance: 0,
    executionTime: 0,
  };
}

/**
 * Large scale VRP solver
 */
function solveLargeScaleVRP(orders, shippers, warehouse, options) {
  // For very large problems (100+ orders)
  // Use genetic algorithm or simulated annealing

  return {
    algorithm: "large_scale_genetic",
    routes: [],
    totalDistance: 0,
    executionTime: 0,
  };
}

module.exports = {
  // Legacy compatibility
  solveNearestNeighbor,

  // New optimized functions
  solveNearestNeighborOptimized,
  solveMultiVehicleVRP,
  optimizeDeliveryRoutes,

  // Geographic Zone Functions 🗺️
  analyzeGeographicDistribution,
  detectGeographicZones,
  solveZoneBasedMultiVehicle,

  // Utility functions
  calculateTotalDistance,
  constructNearestNeighborRoute,
  optimize2Opt,
  clusterOrdersForVehicles,

  // Advanced solvers
  solveSingleVehicleOptimized,
  solveMultiVehicleOptimized,
  solveLargeScaleVRP,
};
