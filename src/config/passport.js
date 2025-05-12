const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../app/models/User"); // Import model User

// Cấu hình chiến lược Local
passport.use(
  new LocalStrategy(
    { usernameField: "email" }, // Sử dụng email thay vì username
    (email, password, done) => {
      User.findOne({ email })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: "Email không tồn tại" });
          }

          // Kiểm tra mật khẩu
          if (password !== user.password) {
            return done(null, false, { message: "Sai mật khẩu" });
          }

          return done(null, user);
        })
        .catch((err) => done(err));
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
});

module.exports = passport;