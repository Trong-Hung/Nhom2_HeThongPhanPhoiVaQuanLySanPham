const { isAdmin, isAuthenticated } = require("../middlewares/role");
const authRouter = require("./auth");
const sanphamRouter = require("./sanpham");
const meRouter = require("./me");
const homeRouter = require("./home");
const adminRouter = require("./admin");
const cartRouter = require("./cart");
const donhangRouter = require("./donhang");
const shipperRouter = require("./shipper");
const categoryRouter = require("./category");
const bannerRouter = require("./banner");
const userRouter = require("./user");
const debugRouter = require("./debug");
const chatRouter = require("./chat");
const recommendationRouter = require("./recommendation");
const geocodingRouter = require("./geocoding");
const routeOptimizationRouter = require("./routeOptimization");
const truckRouter = require("./truck");


function Route(app) {
  app.use("/cart", cartRouter);
  app.use("/auth", authRouter);
  app.use("/donhang", donhangRouter);
  app.use("/shipper", shipperRouter);
  app.use("/truck", truckRouter);

  //phân quyền
  app.use("/admin", adminRouter);
  app.use("/me", isAdmin, meRouter);
  app.use("/sanpham", sanphamRouter);
  app.use("/category", categoryRouter);
  app.use("/banner", bannerRouter);
  app.use("/user", userRouter);
  app.use("/debug", debugRouter);
  app.use("/chat", chatRouter);
  app.use("/geocoding", geocodingRouter); // Thêm geocoding management
  app.use("/api/routes", routeOptimizationRouter); // Route optimization API
  app.use("/", recommendationRouter);

  // Route công khai
  app.use("/", homeRouter);
}

module.exports = Route;
