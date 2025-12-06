# 📱 MOBILE API ENDPOINTS

Base URL: `http://172.20.10.2:3000`
⚠️ **Lưu ý**: Thay IP `172.20.10.2` bằng IP thực tế của máy chủ

## 🔐 AUTHENTICATION

### 1. Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "shipper@example.com",
  "password": "password"
}

Response:
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "Tên shipper",
    "role": "shipper",
    "email": "email"
  },
  "message": "Đăng nhập thành công"
}
```

### 2. Logout

```http
POST /auth/logout
```

## 📦 ĐƠN HÀNG (ORDERS)

### 1. Lấy đơn hàng đang sắp xếp

```http
GET /shipper/api/pending-orders
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "name": "Tên khách hàng",
      "phone": "0123456789",
      "address": "Địa chỉ giao hàng",
      "status": "Đang sắp xếp",
      "routeOrder": 1,
      "isOptimized": true,
      "warehouseId": {
        "name": "Tên kho",
        "address": "Địa chỉ kho"
      }
    }
  ],
  "metadata": {
    "totalOrders": 5,
    "optimizedOrders": 3,
    "isRouteOptimized": true
  }
}
```

### 2. Lấy đơn hàng đang vận chuyển

```http
GET /shipper/api/active-orders
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "name": "Tên khách hàng",
      "phone": "0123456789",
      "address": "Địa chỉ giao hàng",
      "status": "Đang vận chuyển",
      "routeOrder": 2,
      "totalPrice": 150000,
      "items": [...],
      "warehouseId": {...}
    }
  ]
}
```

### 3. Lấy đơn hàng đã giao

```http
GET /shipper/api/delivered-orders
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": [...],
  "message": "Lấy lịch sử đơn hàng thành công"
}
```

### 4. Lấy chi tiết đơn hàng

```http
GET /shipper/api/order/{order_id}
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": {
    "_id": "order_id",
    "name": "Tên khách hàng",
    "phone": "0123456789",
    "address": "Địa chỉ đầy đủ",
    "items": [...],
    "totalPrice": 150000,
    "status": "Đang vận chuyển",
    "warehouseId": {...},
    "routeData": {
      "distance": 5000,
      "duration": 900,
      "geometry": {...}
    }
  }
}
```

### 5. Nhận đơn hàng

```http
POST /shipper/api/confirm/{order_id}
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": {...},
  "message": "Nhận đơn hàng thành công"
}
```

### 6. Đánh dấu đã giao

```http
POST /shipper/api/mark-delivered/{order_id}
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": {...},
  "message": "Đánh dấu giao hàng thành công"
}
```

### 7. Lấy chỉ đường

```http
GET /shipper/api/directions/{order_id}
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": {
    "order": {...},
    "warehouse": {
      "name": "Tên kho",
      "address": "Địa chỉ kho",
      "location": {
        "latitude": 10.762622,
        "longitude": 106.660172
      }
    },
    "customer": {
      "address": "Địa chỉ khách hàng",
      "location": {
        "latitude": 10.762622,
        "longitude": 106.660172
      }
    },
    "route": {
      "distance": 5000,
      "duration": 900,
      "geometry": {...}
    }
  }
}
```

## 🚚 PHIẾU ĐIỀU CHUYỂN (TRANSFERS)

### 1. Lấy phiếu điều chuyển đang sắp xếp

```http
GET /shipper/transfers/api/pending
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": [
    {
      "_id": "transfer_id",
      "transferId": "TF001",
      "sourceWarehouse": {
        "name": "Kho A",
        "address": "Địa chỉ kho A"
      },
      "destinationWarehouse": {
        "name": "Kho B",
        "address": "Địa chỉ kho B"
      },
      "status": "Đang sắp xếp",
      "items": [...],
      "routeOrder": 0
    }
  ]
}
```

### 2. Lấy phiếu điều chuyển đang vận chuyển

```http
GET /shipper/transfers/api/active
Headers: Cookie: session_cookie
```

### 3. Lấy phiếu điều chuyển đã giao

```http
GET /shipper/transfers/api/delivered
Headers: Cookie: session_cookie
```

### 4. Lấy chi tiết phiếu điều chuyển

```http
GET /shipper/transfers/api/{transfer_id}
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": {
    "_id": "transfer_id",
    "transferId": "TF001",
    "sourceWarehouse": {...},
    "destinationWarehouse": {...},
    "items": [
      {
        "productId": {...},
        "quantity": 10
      }
    ],
    "status": "Đang vận chuyển",
    "createdAt": "2025-11-30T10:30:00.000Z"
  }
}
```

### 5. Nhận phiếu điều chuyển

```http
POST /shipper/transfer/confirm/{transfer_id}
Headers: Cookie: session_cookie
```

### 6. Đánh dấu phiếu điều chuyển đã giao

```http
POST /shipper/transfer/mark-delivered/{transfer_id}
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "message": "Phiếu điều chuyển đã được giao thành công"
}
```

## ⚡ TỐI ƯU LỘ TRÌNH

### 1. Tối ưu lộ trình đơn hàng

```http
POST /shipper/optimize-routes
Headers: Cookie: session_cookie
Content-Type: application/json
Body: {}

Response:
{
  "success": true,
  "message": "Đã tối ưu 3 đơn hàng 'Đang vận chuyển' thành công!",
  "optimizedCount": 3,
  "route": [0, 2, 1, 3]
}
```

### 2. Tối ưu lộ trình phiếu điều chuyển

```http
POST /shipper/optimize-transfer-routes
Headers: Cookie: session_cookie
Content-Type: application/json
Body: {}

Response:
{
  "success": true,
  "message": "Đã tối ưu 2 phiếu điều chuyển 'Đang vận chuyển' thành công!",
  "optimizedCount": 2,
  "route": [0, 1, 2]
}
```

## 🗺️ BẢN ĐỒ & ĐỊNH VỊ

### 1. Lấy ma trận khoảng cách

```http
GET /api/routes/test-osrm
No authentication required

Response:
{
  "success": true,
  "message": "OSRM server hoạt động bình thường",
  "data": {
    "osrmStatus": "Connected",
    "serverUrl": "http://localhost:5000",
    "testResults": [
      {
        "from": "Warehouse (908 Phạm Văn Đồng)",
        "to": "District 1",
        "distance": "8.50 km",
        "duration": "25.3 phút"
      }
    ]
  }
}
```

## 🏪 KHO HÀNG

### 1. Lấy danh sách kho hàng

```http
GET /admin/api/warehouses
Headers: Cookie: session_cookie (admin)

Response:
{
  "success": true,
  "warehouses": [
    {
      "_id": "warehouse_id",
      "name": "Trung Tâm Miền Nam",
      "address": "908 Phạm Văn Đồng",
      "location": {
        "latitude": 10.835067,
        "longitude": 106.730075
      },
      "products": [...]
    }
  ]
}
```

### 2. Lấy chi tiết kho hàng

```http
GET /admin/api/warehouse/{warehouse_id}
Headers: Cookie: session_cookie (admin)

Response:
{
  "success": true,
  "warehouse": {
    "_id": "warehouse_id",
    "name": "Tên kho",
    "address": "Địa chỉ kho",
    "location": {...},
    "products": [
      {
        "productId": {
          "_id": "product_id",
          "name": "Tên sản phẩm",
          "sku": "SKU001"
        },
        "quantity": 100
      }
    ]
  }
}
```

## 📊 DEBUG & MONITORING

### 1. Debug transfers

```http
GET /shipper/debug/transfers
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "data": {
    "myTransfers": [...],
    "allTransfers": [...],
    "statusBreakdown": {
      "Đang sắp xếp": 2,
      "Đang vận chuyển": 1,
      "Đã giao": 5
    }
  }
}
```

### 2. Reset route order (DEBUG)

```http
GET /shipper/debug/reset-route-order
Headers: Cookie: session_cookie

Response:
{
  "success": true,
  "message": "Reset 3 đơn hàng thành công",
  "orders": [...]
}
```

## 🔧 ERROR HANDLING

Tất cả API đều trả về error theo format:

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "error": "Chi tiết lỗi kỹ thuật (nếu có)"
}
```

## 📝 NOTES CHO DEV MOBILE:

1. **Authentication**: Sử dụng session cookies, cần implement cookie handling
2. **OSRM Server**: Chạy trên port 5000, cần kiểm tra kết nối
3. **IP Configuration**: Thay `172.20.10.2` bằng IP thực tế của server
4. **Status Codes**:

   - 200: Success
   - 400: Bad Request
   - 403: Forbidden
   - 404: Not Found
   - 500: Internal Server Error

5. **Mobile Specific Endpoints**: Tất cả `/shipper/api/*` endpoints được tối ưu cho mobile app
