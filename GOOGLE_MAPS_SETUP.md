# Google Maps API Setup Guide

## 🔑 **Cách kích hoạt Google Maps Geocoding API**

### **Bước 1: Truy cập Google Cloud Console**

1. Đi tới: https://console.cloud.google.com/
2. Đăng nhập với tài khoản Google
3. Tạo project mới hoặc chọn project hiện có

### **Bước 2: Enable Geocoding API**

1. Vào **"APIs & Services" > "Library"**
2. Tìm kiếm **"Geocoding API"**
3. Click **"Enable"** để kích hoạt

### **Bước 3: Setup Billing (Bắt buộc)**

1. Vào **"Billing"** trong menu
2. Link một **Credit Card** hoặc **PayPal**
3. Google Maps có **$200 free credit** mỗi tháng
4. Geocoding API: **$5 per 1,000 requests** sau khi hết free quota

### **Bước 4: Tạo API Key**

1. Vào **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS" > "API key"**
3. Copy API key được tạo

### **Bước 5: Restrict API Key (Khuyến nghị)**

1. Click vào API key vừa tạo
2. **Application restrictions:**
   - Chọn **"HTTP referrers"** cho web
   - Hoặc **"IP addresses"** cho server
3. **API restrictions:**
   - Chọn **"Restrict key"**
   - Enable: **"Geocoding API"**

---

## 🔧 **Cấu hình trong ứng dụng**

### **Option 1: Environment Variable (Khuyến nghị)**

```bash
# Tạo file .env
GOOGLE_MAPS_API_KEY=AIzaSyBDUa4Q8Z0Qt21mrdkngpEqLgmVLxPykRk
```

### **Option 2: Hard-coded (Chỉ để test)**

API key đã được hard-coded trong code, nhưng nếu chưa hoạt động:

1. **Kiểm tra API key có đúng không**
2. **Kiểm tra Geocoding API đã enable chưa**
3. **Kiểm tra Billing đã setup chưa**

---

## 📊 **Pricing & Quotas**

### **Free Tier:**

- **$200 credit** mỗi tháng
- Tương đương **~40,000 geocoding requests** miễn phí

### **Paid Tier:**

- **$5 per 1,000 requests** sau khi hết free quota
- **Rate limit:** 50 requests/second default

### **Best Practices:**

1. **Cache results** để tránh duplicate requests
2. **Batch geocoding** khi có thể
3. **Fallback** với Nominatim khi Google fails
4. **Monitor usage** trong Google Console

---

## ⚠️ **Troubleshooting**

### **"REQUEST_DENIED":**

- ✅ Enable Geocoding API
- ✅ Setup Billing account
- ✅ Check API key restrictions

### **"OVER_QUERY_LIMIT":**

- ✅ Check billing setup
- ✅ Increase quotas if needed
- ✅ Implement rate limiting

### **"INVALID_REQUEST":**

- ✅ Check address format
- ✅ Ensure address is not empty

---

## 🎯 **Expected Benefits với Google Maps API**

### **Độ chính xác cao hơn:**

- **ROOFTOP**: Chính xác đến địa chỉ cụ thể
- **RANGE_INTERPOLATED**: Nội suy trong dải số nhà
- **GEOMETRIC_CENTER**: Trung tâm khu vực

### **Hỗ trợ tốt cho Việt Nam:**

- Hiểu địa chỉ tiếng Việt
- Database cập nhật thường xuyên
- Xử lý tốt địa chỉ không đầy đủ

### **Metadata phong phú:**

- Location types (ROOFTOP, APPROXIMATE, etc.)
- Address components (street, district, city)
- Viewport bounds cho map display

Khi Google Maps API hoạt động, độ chính xác sẽ tăng đáng kể so với Nominatim!
