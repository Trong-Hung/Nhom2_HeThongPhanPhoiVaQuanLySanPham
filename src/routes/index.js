const { isAdmin, isAuthenticated } = require("../middlewares/role");
const authRouter = require("./auth");
const newsRouter = require("./news");
const searchRouter = require("./search");
const sanphamRouter = require("./sanpham");
const meRouter = require("./me");
const homeRouter = require("./home");
const adminRouter = require('./admin');
const cartRouter = require('./cart');
const donhangRouter = require("./donhang");
const shipperRouter = require("./shipper"); 




function Route(app) {
    app.use('/cart', cartRouter);
  app.use('/auth', authRouter);
  app.use("/donhang", donhangRouter);
  app.use("/shipper", shipperRouter);

  //phân quyền
  app.use('/admin', adminRouter); 
  app.use('/me', isAdmin, meRouter);
  app.use('/sanpham', isAdmin, sanphamRouter);
  

  // Route công khai
  app.use('/news', newsRouter);
  app.use('/search', searchRouter);
  app.use('/', homeRouter);
}

module.exports = Route;