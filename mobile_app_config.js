// Mobile App Configuration
// Sử dụng file này trong Flutter app để kết nối tới backend

const CONFIG = {
  // Cho Android Emulator
  EMULATOR_BASE_URL: 'http://10.0.2.2:3000',
  
  // Cho Physical Device hoặc iOS Simulator  
  DEVICE_BASE_URL: 'http://192.168.1.10:3000',
  
  // API Endpoints
  API_ENDPOINTS: {
    // Authentication
    LOGIN: '/shipper/api/login',
    LOGOUT: '/shipper/api/logout',
    PROFILE: '/shipper/api/profile',
    
    // Orders
    PENDING_ORDERS: '/shipper/api/orders/pending',
    SHIPPING_ORDERS: '/shipper/api/orders/shipping', 
    DELIVERED_ORDERS: '/shipper/api/orders/delivered',
    UPDATE_ORDER_STATUS: '/shipper/api/orders/update-status',
    
    // Statistics
    STATS: '/shipper/api/stats'
  }
};

// Hàm để detect platform và return correct base URL
function getBaseUrl() {
  // Trong Flutter, anh có thể check Platform.isAndroid
  // Và dùng kIsWeb để check web platform
  
  if (Platform.isAndroid) {
    // Nếu là emulator thì dùng 10.0.2.2
    // Nếu là physical device thì dùng IP thật của máy
    return CONFIG.EMULATOR_BASE_URL; // hoặc CONFIG.DEVICE_BASE_URL
  } else if (Platform.isIOS) {
    return CONFIG.DEVICE_BASE_URL;
  }
  
  return CONFIG.DEVICE_BASE_URL;
}

// Export cho Flutter app
export default CONFIG;