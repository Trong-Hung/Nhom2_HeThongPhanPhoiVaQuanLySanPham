const mongoose = require("mongoose");
const Warehouse = require("./src/app/models/Warehouse");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/blog", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testWarehouseAPI() {
  try {
    console.log("🔍 Testing Warehouse API...");

    // Get all warehouses
    const warehouses = await Warehouse.find().populate("products.productId");
    console.log(`📦 Found ${warehouses.length} warehouses:`);

    warehouses.forEach((warehouse, index) => {
      console.log(`\n${index + 1}. ${warehouse.name}`);
      console.log(`   Address: ${warehouse.address}`);
      console.log(
        `   Products: ${warehouse.products ? warehouse.products.length : 0}`
      );

      if (warehouse.products && warehouse.products.length > 0) {
        warehouse.products.slice(0, 3).forEach((item) => {
          if (item.productId) {
            console.log(`   - ${item.productId.name} (Qty: ${item.quantity})`);
          }
        });
        if (warehouse.products.length > 3) {
          console.log(
            `   ... and ${warehouse.products.length - 3} more products`
          );
        }
      }
    });

    // Test specific warehouse if exists
    if (warehouses.length > 0) {
      const testWarehouse = warehouses[0];
      console.log(
        `\n🧪 Testing warehouse ${testWarehouse.name} (${testWarehouse._id}):`
      );

      const warehouseWithProducts = await Warehouse.findById(
        testWarehouse._id
      ).populate("products.productId");

      console.log("API Response would be:");
      console.log({
        success: true,
        warehouse: {
          _id: warehouseWithProducts._id,
          name: warehouseWithProducts.name,
          address: warehouseWithProducts.address,
          products: warehouseWithProducts.products.map((item) => ({
            productId: item.productId
              ? {
                  _id: item.productId._id,
                  name: item.productId.name,
                  sku: item.productId.sku,
                }
              : null,
            quantity: item.quantity,
          })),
        },
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error);
    mongoose.connection.close();
  }
}

testWarehouseAPI();
