# MOBILE APP CONNECTION CONFIG

# Thông tin kết nối cho ứng dụng di động

## 📱 Địa chỉ IP khả dụng cho Mobile App:

### 1. Android Emulator (Recommended for development):

```
Base URL: http://10.0.2.2:3000
```

### 2. Mạng LAN (WiFi cùng mạng):

```
Primary Network: http://192.168.1.10:3000
```

### 3. Other Networks (if available):

```
Network 1: http://26.48.137.211:3000
Network 2: http://192.168.56.1:3000
Network 3: http://192.168.187.1:3000
Network 4: http://192.168.80.1:3000
Network 5: http://192.168.11.1:3000
Network 6: http://192.168.174.1:3000
```

## 🔗 API Endpoints cho Mobile:

### Authentication:

- Login: `POST /auth/login`
- Register: `POST /auth/register`
- Logout: `POST /auth/logout`

### User Orders:

- Get orders: `GET /user/donhangme`
- Order detail: `GET /donhang/{id}`
- Cancel order: `POST /donhang/cancel/{id}`

### Chat:

- Chat page: `GET /chat`
- Send message: `POST /chat/send`
- Get messages: `GET /chat/messages`
- Unread count: `GET /chat/unread-count`

### Products:

- Browse products: `GET /`
- Search: `GET /?q={query}`
- Product detail: `GET /sanpham/{slug}`

### Cart & Checkout:

- Add to cart: `POST /cart/add`
- View cart: `GET /cart/giohang`
- Checkout: `POST /cart/checkout`

## 🧪 Test Connection:

### Health Check API:

```
GET /admin/api/health
```

Returns server status and all available IP addresses

### Test trong mobile app:

1. Thử kết nối từng URL theo thứ tự ưu tiên
2. Dùng emulator URL nếu chạy trên Android Studio
3. Dùng LAN IP nếu trên thiết bị thật cùng mạng WiFi
4. Kiểm tra CORS đã được bật

## 📋 Headers cần thiết cho API calls:

```
Content-Type: application/json
Accept: application/json
```

## 🍪 Session Management:

- Server sử dụng session cookies
- Cần enable cookies trong HTTP client
- Session timeout: 24 hours

## 🔐 CORS Configuration:

- Access-Control-Allow-Origin: \*
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Credentials: true

## 💡 Debugging Tips:

1. Kiểm tra firewall Windows không block port 3000
2. Đảm bảo mobile device cùng mạng WiFi
3. Test bằng browser trước khi dùng trong app
4. Xem console logs của server để debug

## 📞 Contact:

- Nếu không kết nối được, thử tắt/bật WiFi
- Kiểm tra địa chỉ IP máy tính có thay đổi không
- Restart server nếu cần: `node src/index.js`
