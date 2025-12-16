const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/f8_education_dev', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User schema (giả sử từ project structure)
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        default: 'user'
    },
    isShipper: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

async function createShipperUser() {
    try {
        console.log('🔗 Connecting to database...');
        
        // Kiểm tra user hiện có
        console.log('\n📋 Checking existing users...');
        const existingUsers = await User.find({}).limit(5);
        console.log(`Found ${existingUsers.length} existing users:`);
        existingUsers.forEach(user => {
            console.log(`- ${user.email} (role: ${user.role}, isShipper: ${user.isShipper})`);
        });
        
        // Kiểm tra xem đã có shipper chưa
        const existingShipper = await User.findOne({ 
            $or: [
                { role: 'shipper' },
                { isShipper: true }
            ]
        });
        
        if (existingShipper) {
            console.log('\n✅ Found existing shipper user:');
            console.log(`Email: ${existingShipper.email}`);
            console.log(`Role: ${existingShipper.role}`);
            console.log(`IsShipper: ${existingShipper.isShipper}`);
            console.log('\n💡 Try login with this email and password: 123456');
            return;
        }
        
        // Tạo shipper user mới
        console.log('\n🆕 Creating new shipper user...');
        
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        const shipperUser = new User({
            name: 'Test Shipper',
            email: 'shipper@test.com',
            password: hashedPassword,
            role: 'shipper',
            isShipper: true
        });
        
        await shipperUser.save();
        
        console.log('✅ Shipper user created successfully!');
        console.log('📧 Email: shipper@test.com');
        console.log('🔑 Password: 123456');
        console.log('👤 Role: shipper');
        console.log('🚛 IsShipper: true');
        
        // Tạo thêm admin user với quyền shipper
        const adminShipperUser = new User({
            name: 'Admin Shipper',
            email: 'admin@shipper.com',
            password: hashedPassword,
            role: 'admin',
            isShipper: true
        });
        
        await adminShipperUser.save();
        console.log('\n✅ Admin Shipper user created!');
        console.log('📧 Email: admin@shipper.com');
        console.log('🔑 Password: 123456');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        
        if (error.code === 11000) {
            console.log('💡 User already exists with that email');
        }
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the function
createShipperUser();