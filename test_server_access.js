const axios = require('axios');

async function testServerAccess() {
    const urls = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.10:3000',
        'http://10.0.2.2:3000'
    ];

    for (const url of urls) {
        try {
            console.log(`\n🔍 Testing: ${url}`);
            const response = await axios.get(url, { timeout: 5000 });
            console.log(`✅ SUCCESS: ${url} - Status: ${response.status}`);
        } catch (error) {
            console.log(`❌ FAILED: ${url} - Error: ${error.message}`);
        }
    }
}

testServerAccess();