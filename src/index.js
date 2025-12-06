require("dotenv").config();

const path = require("path");
const express = require("express");
const morgan = require("morgan");
const { create } = require("express-handlebars");
const methodOverride = require("method-override");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");

require("./util/cronJobs");
require("dotenv").config();

const app = express();
const port = 3000;

const route = require("./routes");
const db = require("./config/db");
db.connect();

const passport = require("./config/passport");

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: "yourSecretKey",
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Khởi tạo handlebars và đăng ký partials
const hbs = create({
  extname: ".hbs",
  partialsDir: [
    path.join(__dirname, "resources", "view", "partials"),
    path.join(__dirname, "resources", "view", "user"),
  ],
  defaultLayout: "main",
  helpers: {
    eq: (a, b) => a === b,
    // Helper mới cho Auto-Optimization
    routeOrderText: function (routeOrder) {
      if (!routeOrder || routeOrder === 0) return "Kho xuất phát";
      return `Điểm ${routeOrder}`;
    },
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
    inc: function (value) {
      return parseInt(value) + 1;
    },
    formatDate: function (date, format) {
      if (!date) return "";
      const d = new Date(date);
      // Đơn giản: DD/MM/YYYY HH:mm
      const pad = (n) => (n < 10 ? "0" + n : n);
      if (format === "DD/MM/YYYY HH:mm") {
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
      // Mặc định ISO
      return d.toLocaleString("vi-VN");
    },
    formatDateTime: function (date) {
      if (!date) return "Chưa có";
      const d = new Date(date);
      const pad = (n) => (n < 10 ? "0" + n : n);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
    substring: function (str, start, length) {
      return str ? str.substring(start, start + length) : "";
    },
    gt: function (a, b) {
      return a > b;
    },
    toString: function (value) {
      return value ? value.toString() : "";
    },
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    },
    statusBadgeClass: function (status) {
      switch (status) {
        case "Chờ xác nhận":
        case "Đang sắp xếp":
          return "badge bg-secondary";
        case "Đang vận chuyển":
          return "badge bg-warning text-dark";
        case "Đã giao":
        case "Hoàn thành":
          return "badge bg-success";
        case "Đã hủy":
          return "badge bg-danger";
        default:
          return "badge bg-secondary";
      }
    },
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    },
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});

app.engine(".hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "view"));

// Routes
const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

route(app);

// CORS middleware cho mobile app
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Listen trên tất cả network interfaces
app.listen(port, "0.0.0.0", () => {
  const os = require("os");
  const networkInterfaces = os.networkInterfaces();

  console.log(`🚀 Server đang chạy tại:`);
  console.log(`   - Local:     http://localhost:${port}`);

  // Tìm địa chỉ IP của máy
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const networkInterface = networkInterfaces[interfaceName];
    if (networkInterface) {
      networkInterface.forEach((network) => {
        if (network.family === "IPv4" && !network.internal) {
          console.log(`   - Network:   http://${network.address}:${port}`);
        }
      });
    }
  });

  console.log(`   - Emulator:  http://10.0.2.2:${port}`);
  console.log(`📱 Sử dụng địa chỉ Emulator cho Android Studio`);
});
