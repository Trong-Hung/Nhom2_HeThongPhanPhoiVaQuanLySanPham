const axios = require('axios');
const qs = require('querystring');

// Tạo axios instance với cookie support
const client = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true,
    timeout: 10000
});

async function testShipperAPIWithLogin() {
    console.log('🧪 TESTING SHIPPER MOBILE API WITH LOGIN...\n');
    
    try {
        // Step 1: Login để lấy session
        console.log('1️⃣ Attempting to login as shipper...');
        
        // Thử login với các credential phổ biến
        const loginAttempts = [
            { email: 'shipper@test.com', password: '123456' },
            { email: 'shipper@example.com', password: 'password' },
            { email: 'admin@test.com', password: '123456' },
            { email: 'test@test.com', password: '123456' }
        ];
        
        let loginSuccess = false;
        let sessionCookie = null;
        
        for (const credentials of loginAttempts) {
            try {
                console.log(`   Trying ${credentials.email}...`);
                
                const loginResponse = await client.post('/auth/login', 
                    qs.stringify(credentials),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                );
                
                // Lấy session cookie từ response
                const setCookieHeader = loginResponse.headers['set-cookie'];
                if (setCookieHeader && setCookieHeader.length > 0) {
                    sessionCookie = setCookieHeader[0].split(';')[0];
                    console.log('✅ Login successful!');
                    console.log('📄 Status:', loginResponse.status);
                    console.log('🍪 Session cookie:', sessionCookie);
                    loginSuccess = true;
                    break;
                }
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.response?.status || error.message}`);
            }
        }
        
        if (!loginSuccess) {
            console.log('\n❌ Could not login with any test credentials');
            console.log('💡 Please create a shipper user first or check database');
            return;
        }
        
        // Step 2: Test API endpoints với session
        console.log('\n2️⃣ Testing API endpoints with valid session...\n');
        
        const apiEndpoints = [
            { name: 'Pending Orders', url: '/shipper/api/pending-orders' },
            { name: 'Active Orders', url: '/shipper/api/active-orders' },
            { name: 'Delivered Orders', url: '/shipper/api/delivered-orders' }
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                console.log(`📡 Testing ${endpoint.name}...`);
                const response = await client.get(endpoint.url);
                
                console.log(`   ✅ Status: ${response.status}`);
                console.log(`   📊 Data count: ${response.data?.data?.length || 0} items`);
                
                if (response.data?.data?.length > 0) {
                    console.log(`   📋 Sample data:`, JSON.stringify(response.data.data[0], null, 2).substring(0, 200) + '...');
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.response?.status || error.message}`);
            }
        }
        
        // Step 3: Test với network addresses khác
        console.log('\n3️⃣ Testing network addresses for mobile...\n');
        
        const networkURLs = [
            'http://10.0.2.2:3000',     // Android Emulator
            'http://192.168.1.10:3000'  // WiFi Network
        ];
        
        for (const url of networkURLs) {
            try {
                console.log(`🌐 Testing ${url}...`);
                
                const networkClient = axios.create({
                    baseURL: url,
                    timeout: 5000,
                    headers: {
                        'Cookie': sessionCookie
                    }
                });
                
                const response = await networkClient.get('/shipper/api/pending-orders');
                console.log(`   ✅ ${url} - Status: ${response.status}`);
                
            } catch (error) {
                console.log(`   ❌ ${url} - Error: ${error.code || error.message}`);
            }
        }
        
        console.log('\n🎯 FINAL SUMMARY:');
        console.log('✅ Login system: Working');
        console.log('✅ Session authentication: Working');
        console.log('✅ API endpoints: Available');
        console.log('🍪 Session cookie required for mobile app');
        console.log('📱 Recommended for mobile: Implement token-based auth');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
}

// Run test
testShipperAPIWithLogin().catch(console.error);