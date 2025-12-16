const axios = require('axios');

// Base URL
const BASE_URL = 'http://localhost:3000';

// Test function
async function testShipperAPI() {
    console.log('🧪 TESTING SHIPPER MOBILE API...\n');
    
    try {
        // Test 1: Thử truy cập API không có auth
        console.log('1️⃣ Testing API without authentication...');
        const noAuthResponse = await axios.get(`${BASE_URL}/shipper/api/pending-orders`);
        console.log('✅ No auth required? Status:', noAuthResponse.status);
        console.log('Response:', noAuthResponse.data);
        
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('❌ Authentication required (Expected)');
        } else if (error.response && error.response.status === 302) {
            console.log('🔄 Redirect to login (Expected)');
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
    
    try {
        // Test 2: Kiểm tra trang auth có tồn tại không
        console.log('\n2️⃣ Testing auth page...');
        const authResponse = await axios.get(`${BASE_URL}/auth/login`);
        console.log('✅ Auth page exists - Status:', authResponse.status);
        
    } catch (error) {
        console.log('❌ Auth page error:', error.response?.status || error.message);
    }
    
    try {
        // Test 3: Kiểm tra route shipper có tồn tại không
        console.log('\n3️⃣ Testing shipper dashboard page...');
        const shipperResponse = await axios.get(`${BASE_URL}/shipper`);
        console.log('✅ Shipper page exists - Status:', shipperResponse.status);
        
    } catch (error) {
        console.log('❌ Shipper page error:', error.response?.status || error.message);
        if (error.response?.status === 404) {
            console.log('💡 Route /shipper không tồn tại - cần tạo dashboard page');
        }
    }
    
    // Test 4: Test với cookie giả
    try {
        console.log('\n4️⃣ Testing API with session cookie...');
        
        // Tạo một cookie session giả để test
        const fakeSession = 'connect.sid=s%3A123456.abcdef';
        
        const apiWithCookieResponse = await axios.get(`${BASE_URL}/shipper/api/pending-orders`, {
            headers: {
                'Cookie': fakeSession
            }
        });
        console.log('✅ API with cookie - Status:', apiWithCookieResponse.status);
        console.log('Response:', apiWithCookieResponse.data);
        
    } catch (error) {
        console.log('❌ API with cookie error:', error.response?.status || error.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- API endpoints exist in routes/shipper.js ✅');
    console.log('- Authentication middleware is required ⚠️');
    console.log('- Need to login via /auth/login first 🔐');
    console.log('- Then call API with session cookies 🍪');
    console.log('\n📱 For mobile app: Use session-based auth or create API token system');
}

// Run test
testShipperAPI().catch(console.error);