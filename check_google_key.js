/**
 * 🧪 GOOGLE MAPS KEY VALIDATION
 * Test comprehensive để xác định key có hoạt động không
 */

const axios = require("axios");

console.log("🧪 GOOGLE MAPS KEY VALIDATION");
console.log("Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk");
console.log("=".repeat(50));

(async () => {
  const key = "AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk";

  // Test 1: Basic geocoding
  console.log("\n🔍 Test 1: Basic Geocoding");
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Saigon&key=${key}`;
    const response = await axios.get(url);

    console.log(`Status: ${response.data.status}`);
    if (response.data.status === "REQUEST_DENIED") {
      console.log(`❌ GEOCODING API: Not enabled or no billing`);
    } else if (response.data.status === "OK") {
      console.log(`✅ GEOCODING API: Working!`);
    } else {
      console.log(`⚠️ GEOCODING API: ${response.data.status}`);
    }
  } catch (err) {
    console.log(`💥 Error: ${err.message}`);
  }

  // Test 2: Static Maps (doesn't need geocoding API)
  console.log("\n🗺️ Test 2: Static Maps");
  try {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=10.762622,106.660172&zoom=15&size=100x100&key=${key}`;
    const response = await axios.head(url);

    if (response.status === 200) {
      console.log(`✅ STATIC MAPS: Working! (Key is valid)`);
    } else {
      console.log(`❌ STATIC MAPS: Status ${response.status}`);
    }
  } catch (err) {
    console.log(`❌ STATIC MAPS: ${err.response?.status || err.message}`);
  }

  // Test 3: Key format validation
  console.log("\n🔑 Test 3: Key Format");
  console.log(`Length: ${key.length} chars`);
  console.log(`Prefix: ${key.startsWith("AIza") ? "✅ Valid" : "❌ Invalid"}`);
  console.log(
    `Format: ${key.match(/^AIza[A-Za-z0-9_-]{35}$/) ? "✅ Correct" : "❌ Incorrect"}`
  );

  console.log("\n📋 DIAGNOSIS:");
  console.log("If Static Maps works but Geocoding fails:");
  console.log("  → Key is valid but Geocoding API not enabled");
  console.log("If both fail:");
  console.log("  → Key invalid or project billing issue");
  console.log("If both work:");
  console.log("  → ✅ Ready to use!");
})().catch(console.error);
