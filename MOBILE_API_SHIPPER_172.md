# API DOCUMENTATION CHO MOBILE APP SHIPPER

## 🌐 BASE URLs (Chọn theo môi trường)

**Local Development:**

```
http://localhost:3000/shipper
```

**Network IPs (LAN/WiFi):**

```
http://172.31.160.1:3000/shipper        (WSL)
http://192.168.1.21:3000/shipper        (WiFi)
http://192.168.187.1:3000/shipper       (VMware)
```

**Android Emulator:**

```
http://10.0.2.2:3000/shipper
```

**Real Device (WiFi):**

```
http://192.168.1.21:3000/shipper        ← TESTED & WORKING
```

## 🔐 AUTHENTICATION

⚠️ **QUAN TRỌNG:** Tất cả APIs yêu cầu session authentication. Shipper phải đăng nhập trước khi sử dụng.

### Login Flow cho Mobile:

1. **POST** `http://10.0.2.2:3000/auth/login`
2. **Request Body:**

```json
{
  "email": "shipper@example.com",
  "password": "password123"
}
```

3. **Response:** Nhận `connect.sid` cookie
4. **Sử dụng cookie** cho tất cả API calls sau

**Headers required cho mọi API:**

```
Cookie: connect.sid=xxx (session cookie từ login)
Content-Type: application/json
```

---

## 📦 ĐƠN HÀNG APIs

### 1. Lấy đơn hàng đang sắp xếp

**GET** `/api/pending-orders`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f123...",
      "name": "Nguyễn Văn A",
      "phone": "0987654321",
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "status": "Đang sắp xếp",
      "totalPrice": 500000,
      "items": [
        {
          "name": "Sản phẩm A",
          "price": 250000,
          "quantity": 2
        }
      ],
      "warehouseId": {
        "name": "Kho Miền Nam",
        "address": "908 Phạm Văn Đồng"
      },
      "routeOrder": 1,
      "isOptimized": true,
      "displayOrder": 1,
      "routeInfo": "Điểm 1 trong lộ trình tối ưu",
      "createdAt": "2025-11-30T10:30:00Z"
    }
  ],
  "metadata": {
    "totalOrders": 5,
    "optimizedOrders": 3,
    "isRouteOptimized": true
  },
  "message": "Lấy lộ trình giao hàng đã tối ưu thành công"
}
```

### 2. Lấy đơn hàng đang vận chuyển

**GET** `/api/active-orders`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f123...",
      "name": "Trần Thị B",
      "phone": "0123456789",
      "address": "456 Đường XYZ, Quận 3, TP.HCM",
      "status": "Đang vận chuyển",
      "totalPrice": 750000,
      "routeOrder": 2,
      "warehouseId": {
        "name": "Kho Miền Nam",
        "location": {
          "latitude": 10.8351,
          "longitude": 106.7301
        }
      },
      "customerLocation": {
        "latitude": 10.7769,
        "longitude": 106.7009
      }
    }
  ],
  "message": "Lấy đơn hàng đang vận chuyển thành công"
}
```

### 3. Lấy đơn hàng đã giao

**GET** `/api/delivered-orders`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f123...",
      "name": "Lê Văn C",
      "status": "Đã giao",
      "totalPrice": 300000,
      "deliveredAt": "2025-11-30T14:30:00Z",
      "updatedAt": "2025-11-30T14:30:00Z"
    }
  ],
  "message": "Lấy lịch sử đơn hàng thành công"
}
```

### 4. Lấy chi tiết đơn hàng

**GET** `/api/order/{orderId}`

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "65f123...",
    "name": "Nguyễn Văn A",
    "phone": "0987654321",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "status": "Đang vận chuyển",
    "totalPrice": 500000,
    "paymentMethod": "cash",
    "items": [
      {
        "name": "Son môi MAC",
        "price": 250000,
        "quantity": 2
      }
    ],
    "warehouseId": {
      "name": "Kho Miền Nam",
      "address": "908 Phạm Văn Đồng",
      "location": {
        "latitude": 10.8351,
        "longitude": 106.7301
      }
    },
    "customerLocation": {
      "latitude": 10.7769,
      "longitude": 106.7009
    },
    "routeData": {
      "distance": 15500,
      "duration": 1800,
      "geometry": "encoded_polyline_string"
    }
  },
  "message": "Lấy chi tiết đơn hàng thành công"
}
```

### 5. Nhận đơn hàng (Chuyển từ "Đang sắp xếp" → "Đang vận chuyển")

**POST** `/api/confirm/{orderId}`

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "65f123...",
    "status": "Đang vận chuyển",
    "assignedShipper": "65f456..."
  },
  "message": "Nhận đơn hàng thành công"
}
```

### 6. Đánh dấu đã giao hàng

**POST** `/api/mark-delivered/{orderId}`

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "65f123...",
    "status": "Đã giao",
    "deliveredAt": "2025-11-30T14:30:00Z"
  },
  "message": "Đánh dấu giao hàng thành công"
}
```

### 7. Lấy chỉ đường

**GET** `/api/directions/{orderId}`

**Response:**

```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "65f123...",
      "name": "Nguyễn Văn A",
      "phone": "0987654321",
      "address": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "warehouse": {
      "name": "Kho Miền Nam",
      "address": "908 Phạm Văn Đồng",
      "location": {
        "latitude": 10.8351,
        "longitude": 106.7301
      }
    },
    "customer": {
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "location": {
        "latitude": 10.7769,
        "longitude": 106.7009
      }
    },
    "route": {
      "distance": 15500,
      "duration": 1800,
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.7301, 10.8351],
          [106.7009, 10.7769]
        ]
      }
    }
  },
  "message": "Lấy thông tin chỉ đường thành công"
}
```

---

## 🛣️ TỐI ƯU LỘ TRÌNH APIs

### 8. Tối ưu lộ trình đơn hàng

**POST** `/optimize-routes`

**Response:**

```json
{
  "success": true,
  "message": "Đã tối ưu 5 đơn hàng 'Đang vận chuyển' thành công!",
  "optimizedCount": 5,
  "route": [0, 2, 1, 3, 4]
}
```

### 9. Tối ưu lộ trình cũ (deprecated)

**POST** `/api/my-routes/optimize`

**Response:**

```json
{
  "success": true,
  "message": "Tối ưu lộ trình cho 3 đơn hàng thành công.",
  "optimizedRoute": [
    {
      "type": "Warehouse",
      "name": "Kho Miền Nam",
      "address": "908 Phạm Văn Đồng"
    },
    {
      "_id": "65f123...",
      "name": "Nguyễn Văn A",
      "address": "123 Đường ABC"
    }
  ]
}
```

---

## 🚛 PHIẾU ĐIỀU CHUYỂN APIs

### 10. Lấy phiếu điều chuyển đang sắp xếp

**GET** `/transfers/dang-sap-xep` (WEB View)
Hoặc tạo API endpoint mới: **GET** `/api/transfers/pending`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f789...",
      "transferId": "T-20251130-001",
      "sourceWarehouse": {
        "name": "Kho Miền Nam",
        "address": "908 Phạm Văn Đồng"
      },
      "destinationWarehouse": {
        "name": "HUB Hà Nội",
        "address": "587 Tam Trinh"
      },
      "status": "Đang sắp xếp",
      "items": [
        {
          "productId": {
            "name": "Son môi MAC"
          },
          "quantity": 10
        }
      ],
      "routeOrder": 0,
      "createdAt": "2025-11-30T08:00:00Z"
    }
  ]
}
```

### 11. Lấy phiếu điều chuyển đang vận chuyển

**GET** `/transfers/dang-van-chuyen` (WEB View)
Hoặc: **GET** `/api/transfers/active`

### 12. Lấy phiếu điều chuyển đã giao

**GET** `/transfers/da-giao` (WEB View)
Hoặc: **GET** `/api/transfers/completed`

### 13. Chi tiết phiếu điều chuyển

**GET** `/transfers/{transferId}` (WEB View)
Hoặc: **GET** `/api/transfers/{transferId}`

### 14. Nhận phiếu điều chuyển

**POST** `/transfers/confirm/{transferId}` (WEB Action)
Hoặc: **POST** `/api/transfers/confirm/{transferId}`

### 15. Hoàn thành phiếu điều chuyển (với inventory update)

**POST** `/transfer/mark-delivered/{transferId}` (WEB Action)
Hoặc: **POST** `/api/transfers/mark-delivered/{transferId}`

### 16. Tối ưu lộ trình phiếu điều chuyển

**POST** `/optimize-transfer-routes`

**Response:**

```json
{
  "success": true,
  "message": "Đã tối ưu 3 phiếu điều chuyển 'Đang vận chuyển' thành công!",
  "optimizedCount": 3,
  "route": [0, 1, 2, 3]
}
```

---

## 🐛 DEBUG APIs

### 17. Debug transfers

**GET** `/debug/transfers`

### 18. Reset route order

**GET** `/debug/reset-route-order`

---

## ❌ ERROR RESPONSES

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập đơn hàng."
}
```

**400 Bad Request:**

```json
{
  "success": false,
  "message": "ObjectId không hợp lệ: xyz. Cần là 24 ký tự hex."
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Không tìm thấy đơn hàng"
}
```

**500 Server Error:**

```json
{
  "success": false,
  "message": "Lỗi hệ thống"
}
```

---

## 🧪 TEST API VỚI CURL/POSTMAN

### Test Login:

```bash
curl -X POST http://10.0.2.2:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shipper@gmail.com","password":"123456"}' \
  -c cookies.txt
```

### Test API với cookie:

```bash
# Get pending orders
curl -X GET http://10.0.2.2:3000/shipper/api/pending-orders \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Confirm order
curl -X POST http://10.0.2.2:3000/shipper/api/confirm/65f123abc \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Get directions
curl -X GET http://10.0.2.2:3000/shipper/api/directions/65f123abc \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

## 📋 ENDPOINT SUMMARY TABLE

| Method | Endpoint                        | Description                  | Auth Required |
| ------ | ------------------------------- | ---------------------------- | ------------- |
| GET    | `/api/pending-orders`           | Lấy đơn hàng đang sắp xếp    | ✅            |
| GET    | `/api/active-orders`            | Lấy đơn hàng đang vận chuyển | ✅            |
| GET    | `/api/delivered-orders`         | Lấy đơn hàng đã giao         | ✅            |
| GET    | `/api/order/{id}`               | Chi tiết đơn hàng            | ✅            |
| POST   | `/api/confirm/{id}`             | Nhận đơn hàng                | ✅            |
| POST   | `/api/mark-delivered/{id}`      | Đánh dấu đã giao             | ✅            |
| GET    | `/api/directions/{id}`          | Lấy chỉ đường                | ✅            |
| POST   | `/optimize-routes`              | Tối ưu lộ trình đơn hàng     | ✅            |
| POST   | `/optimize-transfer-routes`     | Tối ưu lộ trình transfer     | ✅            |
| GET    | `/transfers/dang-sap-xep`       | Phiếu điều chuyển pending    | ✅            |
| GET    | `/transfers/dang-van-chuyen`    | Phiếu điều chuyển active     | ✅            |
| GET    | `/transfers/da-giao`            | Phiếu điều chuyển completed  | ✅            |
| GET    | `/transfers/{id}`               | Chi tiết phiếu điều chuyển   | ✅            |
| POST   | `/transfers/confirm/{id}`       | Nhận phiếu điều chuyển       | ✅            |
| POST   | `/transfer/mark-delivered/{id}` | Hoàn thành phiếu điều chuyển | ✅            |

## 📱 SỬ DỤNG TRONG MOBILE APP

**1. Authentication Flow:**

- POST `/auth/login` → Lấy session cookie
- Include cookie trong mọi request sau

**2. Main App Flow:**

- GET `/api/pending-orders` → POST `/api/confirm/{id}` → GET `/api/active-orders` → POST `/optimize-routes` → POST `/api/mark-delivered/{id}`

**3. Transfer Flow:**

- GET `/transfers/dang-sap-xep` → POST `/transfers/confirm/{id}` → GET `/transfers/dang-van-chuyen` → POST `/transfer/mark-delivered/{id}`

**4. Map Integration:**

- Sử dụng `customerLocation` và `warehouseId.location` để hiển thị bản đồ
- Sử dụng `routeData.geometry` để vẽ đường đi tối ưu

## ⚡ QUICK START cho MOBILE DEV

**1. Cài đặt environment:**

```dart
// Flutter
final String baseUrl = "http://10.0.2.2:3000/shipper";
```

**2. Login function:**

```dart
Future<bool> login(String email, String password) async {
  final response = await http.post(
    Uri.parse("http://10.0.2.2:3000/auth/login"),
    headers: {"Content-Type": "application/json"},
    body: json.encode({"email": email, "password": password})
  );
  // Save cookie for subsequent requests
  return response.statusCode == 200;
}
```

**3. API call example:**

```dart
Future<List<Order>> getPendingOrders() async {
  final response = await http.get(
    Uri.parse("$baseUrl/api/pending-orders"),
    headers: {
      "Content-Type": "application/json",
      "Cookie": savedCookie // From login
    }
  );
  return parseOrders(response.body);
}
```
