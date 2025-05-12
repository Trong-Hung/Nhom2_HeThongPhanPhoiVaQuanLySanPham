const { isAdmin, isAuthenticated } = require("../middlewares/role");
const authRouter = require("./auth"); // Đảm bảo router auth được import đúng
const newsRouter = require("./news");
const searchRouter = require("./search");
const sanphamRouter = require("./sanpham");
const meRouter = require("./me");
const homeRouter = require("./home");
const adminRouter = require('./admin');
const cartRouter = require('./cart');

function Route(app) {
    app.use('/cart', cartRouter);
  app.use('/auth', authRouter);

  // Route phân quyền
  app.use('/admin', adminRouter); // ✅ Trang quản trị admin
  app.use('/me', isAdmin, meRouter);
  app.use('/sanpham', isAdmin, sanphamRouter);

  // Route công khai
  app.use('/news', newsRouter);
  app.use('/search', searchRouter);
  app.use('/', homeRouter);
}

module.exports = Route;