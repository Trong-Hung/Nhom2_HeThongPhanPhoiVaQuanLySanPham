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



const route = require("./routes");
const db = require("./config/db");

db.connect(); 


const passport = require("./config/passport");


app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use("/uploads", express.static("uploads")); 
app.use(methodOverride('_method')); 






app.use(session({
  secret: 'yourSecretKey',
  resave: true,  
  saveUninitialized: false, 
  cookie: { secure: false, maxAge: 86400000 }
}));


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
    allowProtoPropertiesByDefault: true, 
    allowProtoMethodsByDefault: true,   
  },
});

app.engine(".hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "view"));


// Routes
const authRouter = require('./routes/auth');
app.use('/auth', authRouter); 

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});


route(app); 

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
