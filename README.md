# Hệ Thống Quản Lý Logistics - Hướng Dẫn Cài Đặt

Đây là hệ thống quản lý logistics cho việc phân bổ xe tải, quản lý đơn hàng và tối ưu hóa tuyến đường.

## Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết
- **Node.js**: Version 16.x hoặc cao hơn
- **MongoDB**: Version 4.4 hoặc cao hơn  
- **npm**: Version 8.x hoặc cao hơn
- **Git**: Để clone repository (nếu cần)

### Hệ Điều Hành
- Windows 10/11
- macOS 10.15 hoặc cao hơn
- Ubuntu 18.04 LTS hoặc cao hơn

## Cài Đặt Chi Tiết

### 1. Cài Đặt Node.js
```bash
# Tải và cài đặt Node.js từ https://nodejs.org
# Kiểm tra version sau khi cài đặt
node --version
npm --version
```

### 2. Cài Đặt MongoDB

#### Windows:
```bash
# Tải MongoDB Community Server từ https://www.mongodb.com/try/download/community
# Cài đặt MongoDB Compass (GUI tool) - tùy chọn
# Khởi động MongoDB service
net start MongoDB
```

#### macOS:
```bash
# Sử dụng Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Ubuntu:
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
# Create MongoDB list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
# Update package database
sudo apt-get update
# Install MongoDB
sudo apt-get install -y mongodb-org
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Cài Đặt Dependencies

```bash
# Di chuyển vào thư mục dự án
cd /đường/dẫn/tới/dự/án

# Cài đặt các dependencies
npm install
```

### Danh Sách Dependencies Chính:
```json
{
  "express": "^4.18.0",
  "mongoose": "^7.0.0", 
  "express-handlebars": "^6.0.0",
  "express-session": "^1.17.0",
  "connect-mongo": "^4.6.0",
  "passport": "^0.6.0",
  "passport-local": "^1.0.0",
  "multer": "^1.4.5",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.0.0",
  "nodemailer": "^6.9.0",
  "method-override": "^3.0.0",
  "morgan": "^1.10.0",
  "cookie-parser": "^1.4.6",
  "moment-timezone": "^0.5.43",
  "axios": "^1.6.0"
}
```

## Cấu Hình Hệ Thống

### 1. Tạo File Environment (.env)

Tạo file `.env` trong thư mục gốc của dự án:

```env
# VNPay Configuration (Thanh toán)
VNP_TMNCODE=YOUR_VNPAY_TERMINAL_CODE
VNP_HASHSECRET=YOUR_VNPAY_HASH_SECRET
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURNURL=http://localhost:3000/cart/vnpay_return

# Email Configuration (Gửi email thông báo)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password

# Mapbox Configuration (Bản đồ và tính khoảng cách)
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/logistics_system
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your-super-secret-session-key
```

### 2. Thiết Lập Database MongoDB

```bash
# Kết nối MongoDB
mongosh

# Tạo database
use logistics_system

# Tạo collections cơ bản
db.createCollection("users")
db.createCollection("trucks")
db.createCollection("donhangs")
db.createCollection("warehouses")
db.createCollection("categories")
db.createCollection("sanphams")
db.createCollection("transfers")
```

### 3. Khởi Tạo Dữ Liệu Admin

```javascript
// Chạy trong MongoDB shell hoặc tạo script seed
use logistics_system

// Tạo tài khoản admin mặc định
db.users.insertOne({
  username: "admin",
  password: "$2a$10$...", // Mã hóa bcrypt cho password "admin123"
  email: "admin@logistics.com",
  role: "Admin",
  fullName: "Quản Trị Viên",
  phone: "0123456789",
  isActive: true,
  createdAt: new Date()
})

// Tạo kho mẫu
db.warehouses.insertMany([
  {
    name: "Kho Hà Nội",
    address: "123 Phố Huế, Hai Bà Trưng, Hà Nội",
    latitude: 21.0285,
    longitude: 105.8542,
    capacity: 10000,
    currentLoad: 0,
    isActive: true
  },
  {
    name: "Kho TP.HCM", 
    address: "456 Nguyễn Văn Cừ, Quận 1, TP.HCM",
    latitude: 10.7769,
    longitude: 106.7009,
    capacity: 15000,
    currentLoad: 0,
    isActive: true
  }
])
```

## Cấu Hình API Keys

### 1. VNPay (Thanh toán)
- Đăng ký tại: https://vnpay.vn
- Lấy `TMNCODE` và `HASHSECRET`
- Cấu hình sandbox environment cho testing

### 2. Gmail SMTP (Gửi email)
```bash
# Bật 2-Factor Authentication cho Gmail
# Tạo App Password tại: https://myaccount.google.com/apppasswords
# Sử dụng App Password làm EMAIL_PASS
```

### 3. Mapbox (Bản đồ)
- Đăng ký tại: https://mapbox.com
- Tạo access token
- Copy token vào `MAPBOX_ACCESS_TOKEN`

## Chạy Ứng Dụng

### 1. Development Mode
```bash
# Khởi động MongoDB (nếu chưa chạy)
mongod

# Khởi động ứng dụng
npm start
# hoặc
node src/index.js

# Ứng dụng sẽ chạy tại:
# - Local: http://localhost:3000
# - Network: http://[YOUR_IP]:3000
```

### 2. Production Mode
```bash
# Cài đặt PM2 (Process Manager)
npm install -g pm2

# Khởi động với PM2
pm2 start src/index.js --name "logistics-system"

# Xem logs
pm2 logs logistics-system

# Khởi động cùng hệ thống
pm2 startup
pm2 save
```

## Cấu Hình Firewall

### Windows:
```powershell
# Mở port 3000
New-NetFirewallRule -DisplayName "Logistics System" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### Ubuntu:
```bash
# Mở port 3000
sudo ufw allow 3000
sudo ufw enable
```

## Cấu Trúc Thư Mục

```
project-root/
├── src/
│   ├── app/
│   │   ├── controllers/     # Controllers xử lý business logic
│   │   └── models/         # Mongoose schemas
│   ├── config/
│   │   ├── db/            # Database configuration
│   │   ├── email.js       # Email configuration
│   │   ├── multer.js      # File upload configuration
│   │   └── passport.js    # Authentication configuration
│   ├── helpers/           # Utility functions
│   ├── middlewares/       # Custom middlewares
│   ├── public/           # Static files (CSS, JS, images)
│   ├── resources/
│   │   ├── scss/         # SCSS source files
│   │   └── view/         # Handlebars templates
│   ├── routes/           # Route definitions
│   ├── services/         # Business services
│   ├── util/            # Utility modules
│   └── index.js         # Main application file
├── uploads/             # User uploaded files
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Tài Khoản Mặc Định

### Admin:
- Username: `admin`
- Password: `admin123`
- URL: http://localhost:3000/admin

### Test User:
- Tạo tài khoản qua trang đăng ký: http://localhost:3000/auth/register

## Tính Năng Chính

### 1. Quản Lý Đơn Hàng
- Tạo đơn hàng tự động tính thời gian giao hàng
- Phân bổ xe tải dựa trên trọng tải và khoảng cách
- Theo dõi trạng thái đơn hàng real-time

### 2. Quản Lý Xe Tải
- Phân loại xe theo trọng tải (<950kg, 950kg-2.5t, ≥2.5t)
- Tính toán thời gian giao hàng theo khu vực (đô thị/nông thôn)
- Tối ưu hóa tuyến đường

### 3. Quản Lý Kho
- Theo dõi tồn kho
- Phân bổ hàng hóa theo vị trí địa lý
- Báo cáo thống kê

## Troubleshooting

### Lỗi Thường Gặp:

#### 1. MongoDB Connection Error
```bash
# Kiểm tra MongoDB đang chạy
mongosh --eval "db.adminCommand('ismaster')"

# Khởi động lại MongoDB
sudo systemctl restart mongod  # Ubuntu
net restart MongoDB           # Windows
```

#### 2. Port 3000 Already in Use
```bash
# Tìm process đang sử dụng port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                # macOS/Linux

# Thay đổi port trong src/index.js
const port = 3001; // Hoặc port khác
```

#### 3. Environment Variables Not Loading
```bash
# Kiểm tra file .env exists
ls -la | grep .env

# Kiểm tra format file .env (không có space quanh =)
VAR_NAME=value  # Đúng
VAR_NAME = value # Sai
```

## Support

Nếu gặp vấn đề khi cài đặt, hãy kiểm tra:

1. **Logs**: Xem console output khi khởi động ứng dụng
2. **Dependencies**: Chạy `npm ls` để kiểm tra dependencies
3. **Database**: Kết nối MongoDB thành công
4. **Environment**: File .env được cấu hình đúng
5. **Firewall**: Port 3000 được mở

---

**Lưu ý**: Đây là hệ thống logistics phức tạp với nhiều tính năng tối ưu hóa. Đảm bảo tất cả dependencies và cấu hình được thiết lập đúng trước khi chạy production.