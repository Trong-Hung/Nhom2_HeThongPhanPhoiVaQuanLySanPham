# 🏭 WAREHOUSE-SHIPPER ASSIGNMENT SYSTEM

## 📊 Tổng quan hệ thống

Hệ thống **gán kho cho shipper** được thiết kế để tối ưu hóa logistics theo nguyên tắc:

- **1 Shipper = 1 Kho cố định**
- **Shipper chỉ giao đơn hàng từ kho được gán**

## 🎯 Mục tiêu và lợi ích

### ✅ Lợi ích chính:

1. **Giảm khoảng cách di chuyển**: Shipper chỉ lấy hàng từ 1 kho cố định
2. **Tăng hiệu quả giao hàng**: Biết rõ địa bàn hoạt động
3. **Dễ quản lý**: Admin dễ dàng phân bổ nhân sự theo khu vực
4. **Giảm chi phí**: Tối ưu hóa lộ trình và nhiên liệu
5. **Kiểm soát tốt hơn**: Mỗi kho có team shipper riêng

### 📈 Tính hợp lý:

- **Phù hợp với thực tế**: Shipper thường hoạt động trong khu vực nhất định
- **Scalable**: Dễ dàng mở rộng khi có thêm kho và shipper
- **Performance**: Giảm complexity của queries và tối ưu database

---

## 🗂️ Cấu trúc Database

### 1. **User Model** (Shipper)

```javascript
{
  name: "Nguyễn Văn A",
  email: "shipper@example.com",
  role: "shipper",
  region: "Miền Nam",           // Vùng miền (backup info)
  warehouseId: ObjectId("..."), // 🔑 Kho được gán (CORE FIELD)
}
```

### 2. **Warehouse Model** (Kho)

```javascript
{
  name: "Kho Thủ Đức",
  address: "123 Phạm Văn Đồng, Thủ Đức, TP.HCM",
  region: "Miền Nam",
  location: {
    latitude: 10.8505,
    longitude: 106.7717
  }
}
```

### 3. **DonHang Model** (Đơn hàng)

```javascript
{
  assignedShipper: ObjectId("..."), // Shipper được gán
  warehouseId: ObjectId("..."),     // 🔑 Kho xuất hàng
  status: "Đang sắp xếp",
  customerLocation: {
    latitude: 10.7769,
    longitude: 106.7009
  }
}
```

---

## 🔄 Workflow hệ thống

### **Phase 1: Setup (Admin)**

1. **Tạo kho**: Admin tạo các kho với thông tin đầy đủ
2. **Tạo shipper**: Admin tạo tài khoản shipper và **gán kho cố định**
3. **Phân bổ đơn hàng**: Admin gán đơn hàng cho shipper dựa trên kho

### **Phase 2: Operations (Shipper)**

1. **Đăng nhập**: Shipper đăng nhập và thấy dashboard
2. **Xem đơn hàng**: Chỉ thấy đơn hàng từ **kho được gán**
3. **Tối ưu lộ trình**: Tự động tối ưu từ kho đến các địa chỉ khách hàng
4. **Giao hàng**: Thực hiện giao hàng theo lộ trình tối ưu

### **Phase 3: Monitoring (Admin)**

1. **Theo dõi hiệu suất**: Xem thống kê theo kho và shipper
2. **Điều chỉnh**: Thay đổi phân bổ nếu cần
3. **Mở rộng**: Thêm kho và shipper mới

---

## 🛠️ Các file đã được cập nhật

### 1. **ShipperController.js** ✅

**Thay đổi chính:**

```javascript
// Trước: Lọc theo region
const orders = await DonHang.find({
  assignedShipper: shipperId,
  region: shipperRegion,
  status: "Đang sắp xếp",
});

// Sau: Lọc theo warehouseId
const orders = await DonHang.find({
  assignedShipper: shipperId,
  warehouseId: req.session.user.warehouseId, // 🔑 KEY CHANGE
  status: "Đang sắp xếp",
});
```

**Các hàm được cập nhật:**

- `showPendingOrders()`: Đơn hàng đang sắp xếp
- `showActiveOrders()`: Đơn hàng đang vận chuyển
- `showDeliveredOrders()`: Đơn hàng đã giao
- `optimizeMyRoutes()`: Tối ưu lộ trình
- Tất cả API endpoints: `apiGetPendingOrders`, `apiGetActiveOrders`, etc.

### 2. **User.js** ✅

**Đã có sẵn:**

```javascript
warehouseId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Warehouse",
  required: function () {
    return this.role === "shipper";
  },
}
```

### 3. **UserController.js** ✅

**Đã có sẵn:**

- Logic gán `warehouseId` khi tạo shipper
- Validation bắt buộc `warehouseId` cho shipper
- Populate warehouse info khi hiển thị

### 4. **taotaikhoan.hbs** ✅

**Đã có sẵn:**

- Dropdown chọn kho khi role = "shipper"
- JavaScript toggle hiển thị field
- Integration với controller

### 5. **shipper.js (routes)** ✅

**Thêm mới:**

- Route dashboard: `/shipper/dashboard`

---

## 📱 Dashboard Shipper

### Thông tin hiển thị:

```
🏭 KHO CỦA BẠN: Kho Thủ Đức
📍 Địa chỉ: 123 Phạm Văn Đồng, Thủ Đức, TP.HCM
📊 Thống kê đơn hàng:
   - Đang sắp xếp: 5 đơn
   - Đang vận chuyển: 2 đơn
   - Đã giao: 15 đơn
```

---

## 🚀 Cách sử dụng hệ thống

### **Cho Admin:**

1. Tạo kho: `/admin/warehouses/create`
2. Tạo shipper: `/admin/taotaikhoan` → Chọn role "Shipper" → Chọn kho
3. Gán đơn hàng cho shipper (đơn hàng sẽ có `warehouseId`)

### **Cho Shipper:**

1. Đăng nhập: `/auth/login`
2. Dashboard: `/shipper/dashboard` → Xem thông tin kho
3. Xem đơn hàng: `/shipper/dang_sap_xep` → Chỉ thấy đơn từ kho mình
4. Tối ưu lộ trình: API `/shipper/api/my-routes/optimize`
5. Giao hàng: Theo lộ trình tối ưu

---

## 🔧 API Endpoints

### **Web Routes:**

- `GET /shipper/dashboard` - Dashboard với thông tin kho
- `GET /shipper/dang_sap_xep` - Đơn hàng đang sắp xếp (theo kho)
- `GET /shipper/dang_van_chuyen` - Đơn hàng đang giao (theo kho)

### **Mobile API:**

- `GET /shipper/api/pending-orders` - JSON đơn hàng đang sắp xếp
- `GET /shipper/api/active-orders` - JSON đơn hàng đang giao
- `POST /shipper/api/my-routes/optimize` - Tối ưu lộ trình theo kho

---

## 📊 Ví dụ thực tế

### **Scenario:**

- **Kho A** (Thủ Đức): Shipper 1, Shipper 2
- **Kho B** (Quận 1): Shipper 3, Shipper 4
- **Kho C** (Bình Thạnh): Shipper 5

### **Kết quả:**

- Shipper 1 chỉ thấy đơn hàng từ Kho A (Thủ Đức)
- Shipper 3 chỉ thấy đơn hàng từ Kho B (Quận 1)
- Lộ trình được tối ưu từ kho cố định → giảm khoảng cách

---

## 🎯 Kết luận

Hệ thống **Warehouse-Shipper Assignment** đã được triển khai thành công với:

✅ **Architecture hợp lý**: 1 Shipper = 1 Kho
✅ **Performance tối ưu**: Queries được lọc chính xác
✅ **User Experience tốt**: Shipper biết rõ mình giao đơn nào  
✅ **Admin Control**: Dễ dàng quản lý và phân bổ
✅ **Scalability**: Dễ dàng mở rộng khi có thêm kho/shipper

Hệ thống sẵn sàng để đưa vào production! 🚀
