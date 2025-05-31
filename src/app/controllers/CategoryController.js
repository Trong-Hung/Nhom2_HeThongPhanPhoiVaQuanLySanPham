const Category = require('../models/Category');

class CategoryController {
  async create(req, res) {
    res.render('category/create');
  }

  async store(req, res) {
  try {
    await Category.create({
      code: req.body.code,
      name: req.body.name,
      description: req.body.description
    });
    res.redirect('/category/list');
  } catch (err) {
    let errorMsg = "Đã xảy ra lỗi!";
    if (err.code === 11000) {
      errorMsg = "Mã danh mục đã tồn tại, vui lòng chọn mã khác!";
    }
    res.render('category/create', {
      error: errorMsg,
      code: req.body.code,
      name: req.body.name,
      description: req.body.description
    });
  }
}

  async list(req, res) {
    const categories = await Category.find({});
    res.render('category/list', { categories });
  }

  async edit(req, res) {
    const category = await Category.findById(req.params.id);
    res.render('category/edit', { category });
  }

  async update(req, res) {
    await Category.findByIdAndUpdate(req.params.id, {
      code: req.body.code,
      name: req.body.name,
      description: req.body.description
    });
    res.redirect('/category/list');
  }

  async delete(req, res) {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/category/list');
  }
}

module.exports = new CategoryController();