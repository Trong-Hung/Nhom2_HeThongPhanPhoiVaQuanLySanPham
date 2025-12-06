# 📱 API ENDPOINTS CHO MOBILE APP

**Base URL:** `http://172.xxx.xxx.xxx:3000` (thay xxx.xxx.xxx.xxx bằng IP máy ảo Android)

---

## 🔐 AUTHENTICATION APIs

### 1. Login

- **Method:** `POST`
- **Endpoint:** `/auth/login`
- **Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Response:**

```json
{
  "success": true,
  "user": {
    "_id": "userId",
    "name": "User Name",
    "email": "user@example.com",
    "role": "shipper"
  }
}
```

### 2. Logout

- **Method:** `POST`
- **Endpoint:** `/auth/logout`

---

## 📦 SHIPPER ORDER APIs

### 3. Lấy đơn hàng đang sắp xếp

- **Method:** `GET`
- **Endpoint:** `/shipper/api/pending-orders`
- **Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "orderId",
      "name": "Tên khách hàng",
      "phone": "0123456789",
      "address": "Địa chỉ giao hàng",
      "status": "Đang sắp xếp",
      "routeOrder": 1,
      "isOptimized": true,
      "warehouseId": { "name": "Kho ABC" }
    }
  ],
  "metadata": {
    "totalOrders": 5,
    "optimizedOrders": 3,
    "isRouteOptimized": true
  }
}
```

### 4. Lấy đơn hàng đang vận chuyển

- **Method:** `GET`
- **Endpoint:** `/shipper/api/active-orders`
- **Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "orderId",
      "name": "Tên khách hàng",
      "phone": "0123456789",
      "address": "Địa chỉ giao hàng",
      "status": "Đang vận chuyển",
      "routeOrder": 2,
      "warehouseId": { "name": "Kho ABC" },
      "customerLocation": {
        "latitude": 10.8231,
        "longitude": 106.6297
      }
    }
  ]
}
```

### 5. Lấy đơn hàng đã giao

- **Method:** `GET`
- **Endpoint:** `/shipper/api/delivered-orders`

### 6. Chi tiết đơn hàng

- **Method:** `GET`
- **Endpoint:** `/shipper/api/order/:id`
- **Response:**

```json
{
  "success": true,
  "data": {
    "_id": "orderId",
    "name": "Tên khách hàng",
    "phone": "0123456789",
    "address": "Địa chỉ giao hàng",
    "items": [
      {
        "name": "Sản phẩm A",
        "price": 100000,
        "quantity": 2
      }
    ],
    "totalPrice": 200000,
    "warehouseId": {
      "name": "Kho ABC",
      "location": {
        "latitude": 10.8231,
        "longitude": 106.6297
      }
    },
    "customerLocation": {
      "latitude": 10.7769,
      "longitude": 106.7009
    },
    "routeData": {
      "distance": 15200,
      "duration": 1800,
      "geometry": {...}
    }
  }
}
```

### 7. Nhận đơn hàng (xác nhận)

- **Method:** `POST`
- **Endpoint:** `/shipper/api/confirm/:id`
- **Response:**

```json
{
  "success": true,
  "data": { "orderId": "...", "status": "Đang vận chuyển" },
  "message": "Nhận đơn hàng thành công"
}
```

### 8. Đánh dấu đã giao

- **Method:** `POST`
- **Endpoint:** `/shipper/api/mark-delivered/:id`
- **Response:**

```json
{
  "success": true,
  "data": { "orderId": "...", "status": "Đã giao" },
  "message": "Đánh dấu giao hàng thành công"
}
```

### 9. Tối ưu lộ trình đơn hàng

- **Method:** `POST`
- **Endpoint:** `/shipper/optimize-routes`
- **Response:**

```json
{
  "success": true,
  "message": "Đã tối ưu 5 đơn hàng 'Đang vận chuyển' thành công!",
  "optimizedCount": 5,
  "route": [0, 2, 1, 3]
}
```

### 10. Lấy chỉ đường

- **Method:** `GET`
- **Endpoint:** `/shipper/api/directions/:id`
- **Response:**

```json
{
  "success": true,
  "data": {
    "order": { "_id": "...", "name": "...", "address": "..." },
    "warehouse": {
      "name": "Kho ABC",
      "location": { "latitude": 10.8231, "longitude": 106.6297 }
    },
    "customer": {
      "location": { "latitude": 10.7769, "longitude": 106.7009 }
    },
    "route": {
      "distance": 15200,
      "duration": 1800,
      "geometry": {...},
      "directions": [...]
    }
  }
}
```

---

## 🚛 SHIPPER TRANSFER APIs

### 11. Lấy phiếu điều chuyển đang sắp xếp

- **Method:** `GET`
- **Endpoint:** `/shipper/api/transfers/pending`
- **Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "transferId",
      "transferId": "T-2024-001",
      "sourceWarehouse": { "name": "Kho A", "address": "..." },
      "destinationWarehouse": { "name": "Kho B", "address": "..." },
      "status": "Đang sắp xếp",
      "routeOrder": 0,
      "items": [
        {
          "productId": { "name": "Sản phẩm A" },
          "quantity": 10
        }
      ]
    }
  ]
}
```

### 12. Lấy phiếu điều chuyển đang vận chuyển

- **Method:** `GET`
- **Endpoint:** `/shipper/api/transfers/active`

### 13. Lấy phiếu điều chuyển đã giao

- **Method:** `GET`
- **Endpoint:** `/shipper/api/transfers/completed`

### 14. Chi tiết phiếu điều chuyển

- **Method:** `GET`
- **Endpoint:** `/shipper/api/transfer/:id`
- **Response:**

```json
{
  "success": true,
  "data": {
    "_id": "transferId",
    "transferId": "T-2024-001",
    "sourceWarehouse": {
      "name": "Kho A",
      "address": "Địa chỉ kho A",
      "location": { "latitude": 10.8231, "longitude": 106.6297 }
    },
    "destinationWarehouse": {
      "name": "Kho B",
      "address": "Địa chỉ kho B",
      "location": { "latitude": 10.7769, "longitude": 106.7009 }
    },
    "status": "Đang vận chuyển",
    "items": [...],
    "routeOrder": 1
  }
}
```

### 15. Nhận phiếu điều chuyển

- **Method:** `POST`
- **Endpoint:** `/shipper/api/transfer/confirm/:id`

### 16. Đánh dấu phiếu điều chuyển đã giao

- **Method:** `POST`
- **Endpoint:** `/shipper/api/transfer/mark-delivered/:id`

### 17. Tối ưu lộ trình phiếu điều chuyển

- **Method:** `POST`
- **Endpoint:** `/shipper/optimize-transfer-routes`
- **Response:**

```json
{
  "success": true,
  "message": "Đã tối ưu 3 phiếu điều chuyển 'Đang vận chuyển' thành công!",
  "optimizedCount": 3,
  "route": [0, 1, 2]
}
```

---

## 🗺️ MAP & ROUTING APIs

### 18. Test OSRM Connection

- **Method:** `GET`
- **Endpoint:** `/api/routes/test-osrm`
- **Response:**

```json
{
  "success": true,
  "message": "OSRM server hoạt động bình thường",
  "data": {
    "osrmStatus": "Connected",
    "serverUrl": "http://localhost:5000",
    "testResults": [...]
  }
}
```

---

## 📊 DASHBOARD APIs

### 19. Shipper Dashboard

- **Method:** `GET`
- **Endpoint:** `/api/routes/dashboard?date=2024-11-30`
- **Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOrders": 50,
      "assignedOrders": 45,
      "unassignedOrders": 5,
      "completedOrders": 40,
      "assignmentRate": "90.0%",
      "completionRate": "80.0%"
    },
    "shipperPerformance": [...]
  }
}
```

---

## 🏪 WAREHOUSE APIs

### 20. Lấy chi tiết kho

- **Method:** `GET`
- **Endpoint:** `/admin/api/warehouses/:id`
- **Response:**

```json
{
  "success": true,
  "warehouse": {
    "_id": "warehouseId",
    "name": "Kho ABC",
    "address": "Địa chỉ kho",
    "location": { "latitude": 10.8231, "longitude": 106.6297 },
    "products": [
      {
        "productId": {
          "_id": "productId",
          "name": "Sản phẩm A",
          "sku": "SKU-001"
        },
        "quantity": 100
      }
    ]
  }
}
```

---

## ⚙️ UTILITY APIs

### 21. Get All Warehouses

- **Method:** `GET`
- **Endpoint:** `/admin/api/warehouses`

### 22. Debug Transfers (Development only)

- **Method:** `GET`
- **Endpoint:** `/shipper/debug/transfers`

---

## 📋 NOTES CHO DEVELOPER MOBILE:

1. **Base URL:** Thay `localhost:3000` thành `172.xxx.xxx.xxx:3000` (IP máy ảo Android)

2. **Authentication:** Sử dụng session cookies - cần enable cookie support trong HTTP client

3. **Error Handling:** Tất cả API đều trả về format:

```json
{
  "success": false,
  "message": "Thông báo lỗi"
}
```

4. **CORS:** Đã config cho phép cross-origin requests

5. **Real-time:** Có thể implement WebSocket cho real-time updates

6. **Map Integration:**

   - OSRM server chạy trên `localhost:5000`
   - Fallback về Haversine distance nếu OSRM down
   - Support Google Maps deeplink

7. **Status Flow:**
   - Orders: `Chờ xác nhận` → `Đang sắp xếp` → `Đang vận chuyển` → `Đã giao`
   - Transfers: `Đang sắp xếp` → `Đang vận chuyển` → `Đã giao`
