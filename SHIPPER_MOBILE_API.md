# 📱 SHIPPER MOBILE APP - API ENDPOINTS

## 🔗 Server Addresses (Chọn 1 trong các IP này)

✅ **Đang chạy trên:**
- **Local:** http://localhost:3000
- **Network (WiFi):** http://192.168.1.10:3000  
- **Emulator:** http://10.0.2.2:3000

## 🔐 Authentication Required

Tất cả API endpoint cần đăng nhập trước. Sử dụng session-based authentication.

### Đăng nhập qua web trước:
```
POST http://localhost:3000/auth/login
Content-Type: application/x-www-form-urlencoded

email=shipper@example.com&password=password123
```

## 📱 MOBILE API ENDPOINTS

### 1. 📋 Đơn hàng đang sắp xếp
```http
GET /shipper/api/pending-orders
```

### 2. 🚛 Đơn hàng đang vận chuyển  
```http
GET /shipper/api/active-orders
```

### 3. ✅ Đơn hàng đã giao
```http
GET /shipper/api/delivered-orders
```

### 4. 👁️ Chi tiết đơn hàng
```http
GET /shipper/api/order/{order_id}
```

### 5. ✋ Nhận đơn hàng
```http
POST /shipper/api/confirm/{order_id}
```

### 6. 📦 Đánh dấu đã giao
```http
POST /shipper/api/mark-delivered/{order_id}
```

### 7. 🗺️ Lấy chỉ đường
```http
GET /shipper/api/directions/{order_id}
```

### 8. 🎯 Tối ưu lộ trình
```http
POST /shipper/api/my-routes/optimize
```

## 🧪 Test Commands

### Test bằng PowerShell:
```powershell
# Test endpoint (cần session cookie)
try { 
  $response = Invoke-WebRequest -Uri "http://localhost:3000/shipper/api/pending-orders" -TimeoutSec 5
  Write-Host "Status: $($response.StatusCode)"
  Write-Host $response.Content
} catch { 
  Write-Host "Error: $($_.Exception.Message)" 
}
```

### Test bằng cURL:
```bash
# Test endpoint  
curl -X GET "http://localhost:3000/shipper/api/pending-orders" \
  -H "Content-Type: application/json"
```

## 📝 Response Format

Tất cả API trả về JSON format:

```json
{
  "success": true,
  "data": [...],
  "message": "Success message"
}
```

### Ví dụ đơn hàng:
```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "customerName": "Tên khách hàng",
      "customerPhone": "0123456789", 
      "address": "Địa chỉ giao hàng",
      "totalPrice": 500000,
      "totalQuantity": 3,
      "status": "Đang vận chuyển",
      "routeOrder": 1,
      "items": [
        {
          "name": "Sản phẩm 1",
          "price": 200000,
          "quantity": 2
        }
      ]
    }
  ]
}
```

## 🚀 Flutter/React Native Usage

### Flutter Example:
```dart
import 'package:dio/dio.dart';

class ShipperApiService {
  static const String baseURL = "http://10.0.2.2:3000/shipper/api";
  final Dio dio = Dio();
  
  Future<List<Order>> getPendingOrders() async {
    try {
      final response = await dio.get('$baseURL/pending-orders');
      if (response.data['success']) {
        return (response.data['data'] as List)
            .map((json) => Order.fromJson(json))
            .toList();
      }
      throw Exception(response.data['message']);
    } catch (e) {
      throw Exception('Failed to load orders: $e');
    }
  }
}
```

### React Native Example:
```javascript
const SHIPPER_API_BASE = 'http://10.0.2.2:3000/shipper/api';

export const getPendingOrders = async () => {
  try {
    const response = await fetch(`${SHIPPER_API_BASE}/pending-orders`, {
      credentials: 'include' // Important for session cookies
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    throw new Error(data.message);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};
```

## ⚠️ Lưu ý quan trọng

1. **Session Authentication:** Cần đăng nhập qua web trước hoặc implement login API
2. **CORS:** Server đã bật CORS  
3. **Network:** Mobile và server phải cùng mạng WiFi
4. **Port 3000:** Đảm bảo không bị firewall chặn
5. **IP Address:** Thay `192.168.1.10` bằng IP thực tế

## 🔧 Network Configuration

Kiểm tra IP của server:
```powershell
ipconfig | findstr "IPv4"
```

Kiểm tra port đang mở:
```powershell
netstat -ano | findstr :3000
```

---
**✅ API đã sẵn sàng cho shipper mobile app!**