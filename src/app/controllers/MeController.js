const Sanpham = require("../models/Sanpham");
const { mutipleMongooseToObject } = require("../../util/mongoose");
class MeController {
  storedCourse(req, res, next) {
    Sanpham.find({})
      .then((course) =>
        res.render("me/stored-course", {
          sanpham: mutipleMongooseToObject(course),
        })
      )
      .catch(next);
  }
}

module.exports = new MeController();