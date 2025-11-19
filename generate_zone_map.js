/**
 * ZONE VISUALIZATION GENERATOR 🗺️
 * Tạo code HTML để hiển thị zones trên map
 */

const VRPService = require("./src/services/VRPService");

function generateZoneVisualization(orders, distanceMatrix) {
  console.log("🗺️  GENERATING ZONE VISUALIZATION MAP");
  console.log("=".repeat(50));

  // Analyze zones
  const zones = VRPService.detectGeographicZones(orders, distanceMatrix);

  // Zone colors
  const zoneColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
  ];

  let mapHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Zone-Based Route Optimization</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        #map { height: 70vh; }
        #info { 
            position: absolute; 
            top: 10px; 
            right: 10px; 
            background: white; 
            padding: 15px; 
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            max-width: 300px;
        }
        .zone-info {
            margin: 10px 0;
            padding: 8px;
            border-left: 4px solid;
            background: #f8f9fa;
        }
        .legend {
            display: flex;
            align-items: center;
            margin: 5px 0;
        }
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <div id="info">
        <h3>🗺️ Zone Analysis</h3>
        <div><strong>Total Orders:</strong> ${orders.length}</div>
        <div><strong>Detected Zones:</strong> ${zones.length}</div>
        
        <h4>Zone Details:</h4>
`;

  // Add zone information
  zones.forEach((zone, index) => {
    const color = zoneColors[index % zoneColors.length];
    mapHTML += `
        <div class="zone-info" style="border-left-color: ${color};">
            <div class="legend">
                <div class="legend-color" style="background: ${color};"></div>
                <strong>Zone ${zone.id + 1}</strong>
            </div>
            <div>📍 ${zone.orderIndices.length} orders</div>
            <div>⚖️ ${zone.totalWeight.toFixed(1)}kg total</div>
            <div>📏 ${(zone.bounds.maxDistance / 1000).toFixed(1)}km diameter</div>
        </div>`;
  });

  mapHTML += `
    </div>

    <script>
        // Initialize map centered on Ho Chi Minh City
        const map = L.map('map').setView([10.8231, 106.6297], 11);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Warehouse location (908 PVD)
        const warehouseIcon = L.divIcon({
            className: 'warehouse-icon',
            html: '🏭',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        L.marker([10.8351, 106.7301], {icon: warehouseIcon})
            .addTo(map)
            .bindPopup('<b>🏭 Kho 908 PVD</b><br>Điểm xuất phát');
`;

  // Add orders and zones to map
  orders.forEach((order, orderIndex) => {
    // Find which zone this order belongs to
    let zoneIndex = 0;
    zones.forEach((zone, zIdx) => {
      if (zone.orderIndices.includes(orderIndex + 1)) {
        zoneIndex = zIdx;
      }
    });

    const color = zoneColors[zoneIndex % zoneColors.length];

    // Approximate coordinates (in real app, use geocoding)
    const coords = getApproxCoords(order.address);

    mapHTML += `
        // Order ${order.id} - Zone ${zoneIndex + 1}
        const order${order.id}Icon = L.divIcon({
            className: 'order-icon',
            html: '<div style="background: ${color}; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${order.id}</div>',
            iconSize: [25, 25],
            iconAnchor: [12.5, 12.5]
        });
        
        L.marker([${coords.lat}, ${coords.lng}], {icon: order${order.id}Icon})
            .addTo(map)
            .bindPopup('<b>📦 Order ${order.id}</b><br>${order.address}<br>⚖️ ${order.weight}kg<br>🗺️ Zone ${zoneIndex + 1}');
`;
  });

  // Add zone circles
  zones.forEach((zone, index) => {
    const color = zoneColors[index % zoneColors.length];
    const centerOrder = orders.find(
      (o, idx) => idx + 1 === zone.centerOrderIndex
    );
    const centerCoords = getApproxCoords(centerOrder.address);

    mapHTML += `
        // Zone ${zone.id + 1} circle
        L.circle([${centerCoords.lat}, ${centerCoords.lng}], {
            color: '${color}',
            fillColor: '${color}',
            fillOpacity: 0.1,
            radius: ${zone.bounds.maxDistance || 2000}
        }).addTo(map).bindPopup('<b>🗺️ Zone ${zone.id + 1}</b><br>📍 ${zone.orderIndices.length} orders<br>⚖️ ${zone.totalWeight.toFixed(1)}kg');
`;
  });

  mapHTML += `
        // Fit map to show all markers
        const group = new L.featureGroup();
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                group.addLayer(layer);
            }
        });
        map.fitBounds(group.getBounds().pad(0.1));
        
        // Add zone connection lines
        ${generateZoneConnections(zones, orders)}
        
    </script>
</body>
</html>`;

  return mapHTML;
}

function getApproxCoords(address) {
  // Simplified coordinate mapping for demo
  const coordMap = {
    "Nguyễn Huệ, Q1": { lat: 10.7764, lng: 106.7009 },
    "Đồng Khởi, Q1": { lat: 10.7748, lng: 106.704 },
    "Lê Lợi, Q1": { lat: 10.7739, lng: 106.6998 },
    "Pasteur, Q3": { lat: 10.7823, lng: 106.6934 },
    "Phú Mỹ Hưng, Q7": { lat: 10.7411, lng: 106.6913 },
    "Tân Thuận, Q7": { lat: 10.7389, lng: 106.7095 },
    "Nguyễn Thị Thập, Q7": { lat: 10.7354, lng: 106.7019 },
    "Võ Văn Ngân, Thủ Đức": { lat: 10.8503, lng: 106.7717 },
    "Kha Vạn Cân, Thủ Đức": { lat: 10.8485, lng: 106.7659 },
    "Đỗ Xuân Hợp, Q9": { lat: 10.8228, lng: 106.7583 },
    "Xa Lộ Hà Nội, Q9": { lat: 10.8415, lng: 106.8071 },
    "Cộng Hòa, Tân Bình": { lat: 10.8012, lng: 106.6557 },
    "Hoàng Văn Thụ, Tân Bình": { lat: 10.7999, lng: 106.6544 },
    "Quang Trung, Gò Vấp": { lat: 10.8391, lng: 106.6525 },
    "Phan Huy Ích, Gò Vấp": { lat: 10.8278, lng: 106.6642 },
  };

  return coordMap[address] || { lat: 10.8231, lng: 106.6297 };
}

function generateZoneConnections(zones, orders) {
  let connections = "";

  zones.forEach((zone) => {
    const centerOrder = orders.find(
      (o, idx) => idx + 1 === zone.centerOrderIndex
    );
    const centerCoords = getApproxCoords(centerOrder.address);

    zone.orderIndices.forEach((orderIdx) => {
      if (orderIdx !== zone.centerOrderIndex) {
        const order = orders[orderIdx - 1];
        const orderCoords = getApproxCoords(order.address);

        connections += `
        L.polyline([[${centerCoords.lat}, ${centerCoords.lng}], [${orderCoords.lat}, ${orderCoords.lng}]], {
            color: '#666',
            weight: 1,
            opacity: 0.3,
            dashArray: '5, 5'
        }).addTo(map);`;
      }
    });
  });

  return connections;
}

// Test data
const testOrders = [
  { id: 1, weight: 2.5, address: "Đồng Khởi, Q1" },
  { id: 2, weight: 1.8, address: "Nguyễn Huệ, Q1" },
  { id: 3, weight: 2.1, address: "Lê Lợi, Q1" },
  { id: 4, weight: 1.9, address: "Pasteur, Q3" },
  { id: 5, weight: 3.2, address: "Phú Mỹ Hưng, Q7" },
  { id: 6, weight: 2.7, address: "Tân Thuận, Q7" },
  { id: 7, weight: 2.3, address: "Nguyễn Thị Thập, Q7" },
  { id: 8, weight: 1.6, address: "Võ Văn Ngân, Thủ Đức" },
  { id: 9, weight: 2.4, address: "Kha Vạn Cân, Thủ Đức" },
  { id: 10, weight: 1.7, address: "Đỗ Xuân Hợp, Q9" },
  { id: 11, weight: 2.0, address: "Xa Lộ Hà Nội, Q9" },
  { id: 12, weight: 2.8, address: "Cộng Hòa, Tân Bình" },
  { id: 13, weight: 1.5, address: "Hoàng Văn Thụ, Tân Bình" },
  { id: 14, weight: 2.2, address: "Quang Trung, Gò Vấp" },
  { id: 15, weight: 1.3, address: "Phan Huy Ích, Gò Vấp" },
];

// Simplified distance matrix for zone detection
const testMatrix = [
  [
    0, 14500, 14200, 14800, 15100, 12800, 13400, 13900, 3200, 4100, 5800, 7200,
    8700, 9200, 9800, 9400,
  ],
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

// Generate and save HTML
const htmlContent = generateZoneVisualization(testOrders, testMatrix);

const fs = require("fs");
fs.writeFileSync("zone_visualization.html", htmlContent);

console.log("✅ Generated zone_visualization.html");
console.log(
  "🌐 Open zone_visualization.html in browser to view interactive map"
);
console.log();
console.log("📋 Map features:");
console.log("   🏭 Warehouse location (908 PVD)");
console.log("   📦 Orders with zone colors");
console.log("   🗺️ Zone boundaries and info");
console.log("   📊 Zone statistics panel");
console.log("   🔗 Zone connection lines");
