const path = require("path");
const express = require("express");
const morgan = require("morgan");
const { create } = require("express-handlebars");
const methodOverride = require("method-override");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
require("./util/cronJobs");


const app = express();
const port = 3000;

const route = require("./routes"); // Import route
const db = require("./config/db"); // Import db

// Connect to DB
db.connect(); // Kết nối đến DB


const passport = require("./config/passport");


// Middlewares

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Đường dẫn tĩnh cho các file CSS, JS, ảnh
app.use(express.urlencoded({ extended: true }));  // Xử lý dữ liệu từ form
app.use(express.json()); // Xử lý dữ liệu JSON
app.use("/uploads", express.static("uploads"));  // Xử lý đường dẫn tải lên file
app.use(methodOverride('_method')); // Cho phép sử dụng phương thức PUT, DELETE từ form






// Khai báo session
// Cấu hình session
app.use(session({
  secret: 'yourSecretKey',
  resave: true,  // Giữ session giữa các request
  saveUninitialized: false, 
  cookie: { secure: false, maxAge: 86400000 } // 24 giờ (1 ngày)
}));




// Cấu hình Passport
app.use(passport.initialize());
app.use(passport.session());

const hbs = create({
  extname: ".hbs",
  partialsDir: path.join(__dirname, "resources", "view", "partials"),
  defaultLayout: "main",
  helpers: {
    eq: (a, b) => a === b,
    formatCurrency: function (value) {
      if (typeof value !== "number") return "0 VNĐ";
      return value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      });
    },
    multiply: function (a, b) {
      const total = a * b;
      return total.toLocaleString("vi-VN") + " VND";
    },
    select: function (value, selectedValue) {
      return value === selectedValue ? "selected" : "";
    },
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true, // Cho phép truy cập các thuộc tính không phải "own property"
    allowProtoMethodsByDefault: true,   // Cho phép truy cập các phương thức không phải "own method"
  },
});

app.engine(".hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "view"));


// Routes
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);  // Sử dụng auth router

// ✅ Gắn session user vào biến res.locals để dùng trong view
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});


route(app); // Khởi tạo các route khác

// Khởi chạy server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
