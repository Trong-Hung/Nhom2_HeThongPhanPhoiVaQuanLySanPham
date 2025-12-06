# 📱 HƯỚNG DẪN TỔNG HỢP MOBILE APP SHIPPER

## 🎯 TỔNG QUAN DỰ ÁN

- **Backend**: Node.js + Express.js + MongoDB
- **Authentication**: Session-based với connect.sid cookie
- **API Format**: RESTful JSON APIs
- **Mobile Platform**: Flutter (Android/iOS)

## 🌐 CÁC ĐỊA CHỈ SERVER

### 1. Development Environment:

```
Local:          http://localhost:3000
Android Studio: http://10.0.2.2:3000  ← SỬ DỤNG CHO MOBILE
WiFi Network:   http://192.168.1.21:3000
VMware:         http://192.168.187.1:3000
WSL:            http://172.31.160.1:3000
```

### 2. Base URL cho Shipper APIs:

```
http://10.0.2.2:3000/shipper  ← MOBILE APP BASE URL
```

## 🔐 AUTHENTICATION FLOW

### Step 1: Login API

**Endpoint:** `POST /auth/login`
**Request:**

```json
{
  "email": "shipper@gmail.com",
  "password": "123456"
}
```

**Response:** Session cookie `connect.sid`

### Step 2: Use Cookie for All APIs

**Headers:**

```
Cookie: connect.sid=s%3A...
Content-Type: application/json
```

## 📋 DANH SÁCH ĐẦY ĐỦ CÁC API ENDPOINTS

### 🚚 QUẢN LÝ ĐƠN HÀNG (18 APIs)

| Method | Endpoint                   | Mô tả                        | Status   |
| ------ | -------------------------- | ---------------------------- | -------- |
| GET    | `/api/pending-orders`      | Lấy đơn hàng đang sắp xếp    | ✅ Ready |
| GET    | `/api/active-orders`       | Lấy đơn hàng đang vận chuyển | ✅ Ready |
| GET    | `/api/delivered-orders`    | Lấy đơn hàng đã giao         | ✅ Ready |
| GET    | `/api/order/{id}`          | Chi tiết đơn hàng            | ✅ Ready |
| POST   | `/api/confirm/{id}`        | Nhận đơn hàng                | ✅ Ready |
| POST   | `/api/mark-delivered/{id}` | Đánh dấu đã giao             | ✅ Ready |
| GET    | `/api/directions/{id}`     | Lấy chỉ đường                | ✅ Ready |

### 🛣️ TỐI ƯU LỘ TRÌNH

| Method | Endpoint                  | Mô tả                    | Status   |
| ------ | ------------------------- | ------------------------ | -------- |
| POST   | `/optimize-routes`        | Tối ưu lộ trình đơn hàng | ✅ Ready |
| POST   | `/api/my-routes/optimize` | Tối ưu lộ trình cũ       | ✅ Ready |

### 📦 QUẢN LÝ PHIẾU ĐIỀU CHUYỂN

| Method | Endpoint                        | Mô tả                    | Status   |
| ------ | ------------------------------- | ------------------------ | -------- |
| GET    | `/transfers/dang-sap-xep`       | Transfer đang sắp xếp    | ✅ Ready |
| GET    | `/transfers/dang-van-chuyen`    | Transfer đang vận chuyển | ✅ Ready |
| GET    | `/transfers/da-giao`            | Transfer đã giao         | ✅ Ready |
| GET    | `/transfers/{id}`               | Chi tiết transfer        | ✅ Ready |
| POST   | `/transfers/confirm/{id}`       | Nhận transfer            | ✅ Ready |
| POST   | `/transfer/mark-delivered/{id}` | Hoàn thành transfer      | ✅ Ready |
| POST   | `/optimize-transfer-routes`     | Tối ưu lộ trình transfer | ✅ Ready |

### 🐛 DEBUG TOOLS

| Method | Endpoint                   | Mô tả             | Status   |
| ------ | -------------------------- | ----------------- | -------- |
| GET    | `/debug/transfers`         | Debug transfers   | ✅ Ready |
| GET    | `/debug/reset-route-order` | Reset route order | ✅ Ready |

## 📱 FLUTTER IMPLEMENTATION GUIDE

### 1. Dependencies (pubspec.yaml):

```yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.2
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0
```

### 2. API Service Class:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ShipperApiService {
  static const String baseUrl = 'http://10.0.2.2:3000';
  static const String shipperBaseUrl = '$baseUrl/shipper';

  String? _sessionCookie;

  // Login and get session cookie
  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        // Extract session cookie
        final cookies = response.headers['set-cookie'];
        if (cookies != null) {
          _sessionCookie = cookies;
          // Save cookie locally
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('session_cookie', _sessionCookie!);
          return true;
        }
      }
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  // Load saved cookie
  Future<void> loadCookie() async {
    final prefs = await SharedPreferences.getInstance();
    _sessionCookie = prefs.getString('session_cookie');
  }

  // Get headers with cookie
  Map<String, String> get headers => {
    'Content-Type': 'application/json',
    if (_sessionCookie != null) 'Cookie': _sessionCookie!,
  };

  // API Methods
  Future<List<dynamic>> getPendingOrders() async {
    final response = await http.get(
      Uri.parse('$shipperBaseUrl/api/pending-orders'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'] ?? [];
    }
    throw Exception('Failed to load pending orders');
  }

  Future<List<dynamic>> getActiveOrders() async {
    final response = await http.get(
      Uri.parse('$shipperBaseUrl/api/active-orders'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'] ?? [];
    }
    throw Exception('Failed to load active orders');
  }

  Future<Map<String, dynamic>> getOrderDetail(String orderId) async {
    final response = await http.get(
      Uri.parse('$shipperBaseUrl/api/order/$orderId'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'];
    }
    throw Exception('Failed to load order detail');
  }

  Future<bool> confirmOrder(String orderId) async {
    final response = await http.post(
      Uri.parse('$shipperBaseUrl/api/confirm/$orderId'),
      headers: headers,
    );

    return response.statusCode == 200;
  }

  Future<bool> markOrderDelivered(String orderId) async {
    final response = await http.post(
      Uri.parse('$shipperBaseUrl/api/mark-delivered/$orderId'),
      headers: headers,
    );

    return response.statusCode == 200;
  }

  Future<Map<String, dynamic>> getDirections(String orderId) async {
    final response = await http.get(
      Uri.parse('$shipperBaseUrl/api/directions/$orderId'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'];
    }
    throw Exception('Failed to load directions');
  }

  Future<Map<String, dynamic>> optimizeRoutes() async {
    final response = await http.post(
      Uri.parse('$shipperBaseUrl/optimize-routes'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to optimize routes');
  }
}
```

### 3. Main App Structure:

```dart
void main() {
  runApp(ShipperApp());
}

class ShipperApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Shipper App',
      home: LoginScreen(),
      routes: {
        '/login': (context) => LoginScreen(),
        '/dashboard': (context) => DashboardScreen(),
        '/pending-orders': (context) => PendingOrdersScreen(),
        '/active-orders': (context) => ActiveOrdersScreen(),
        '/order-detail': (context) => OrderDetailScreen(),
      },
    );
  }
}
```

## 🗺️ MAP INTEGRATION

### Google Maps Setup:

1. **Add dependency:** `google_maps_flutter: ^2.5.0`
2. **Get API Key** từ Google Cloud Console
3. **Configure native:** android/app/src/main/AndroidManifest.xml

```dart
GoogleMap(
  initialCameraPosition: CameraPosition(
    target: LatLng(warehouse.latitude, warehouse.longitude),
    zoom: 15,
  ),
  markers: {
    // Warehouse marker
    Marker(
      markerId: MarkerId('warehouse'),
      position: LatLng(warehouse.latitude, warehouse.longitude),
      infoWindow: InfoWindow(title: 'Kho hàng'),
    ),
    // Customer marker
    Marker(
      markerId: MarkerId('customer'),
      position: LatLng(customer.latitude, customer.longitude),
      infoWindow: InfoWindow(title: 'Khách hàng'),
    ),
  },
  polylines: {
    // Route polyline
    Polyline(
      polylineId: PolylineId('route'),
      points: routePoints, // From API directions
      color: Colors.blue,
      width: 4,
    ),
  },
)
```

## 🚀 DEPLOYMENT CHECKLIST

### 1. Server Setup:

- ✅ APIs ready và tested
- ✅ Authentication working
- ✅ Database connected
- ✅ Network accessible từ mobile

### 2. Mobile App Setup:

- ✅ Base URL configured: `http://10.0.2.2:3000`
- ✅ Session management
- ✅ API integration
- ✅ Map integration

### 3. Testing:

- ✅ Login flow
- ✅ Order management
- ✅ Route optimization
- ✅ Map navigation
- ✅ Transfer management

## 🐛 TROUBLESHOOTING

**Problem**: API returns 403 Forbidden
**Solution**: Kiểm tra session cookie và đăng nhập lại

**Problem**: Cannot connect to 10.0.2.2
**Solution**: Sử dụng real device với WiFi IP (192.168.1.21)

**Problem**: Map không hiển thị
**Solution**: Kiểm tra Google Maps API key và permissions

## 📞 SUPPORT

- **API Documentation**: `MOBILE_API_SHIPPER_172.md`
- **Test Script**: `test_shipper_api_endpoints.js`
- **Server Status**: Chạy `node src/index.js`
