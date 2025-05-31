const Banner = require('../models/banner');

class BannerController {
  async list(req, res) {
    const banners = await Banner.find({});
    res.render('banner/list', { banners });
  }
  async create(req, res) {
    res.render('banner/create');
  }
  async store(req, res) {
    await Banner.create({ image: req.file.filename, link: req.body.link, title: req.body.title });
    res.redirect('/banner/list');
  }
  async delete(req, res) {
    await Banner.findByIdAndDelete(req.params.id);
    res.redirect('/banner/list');
  }
  async edit(req, res) {
    const banner = await Banner.findById(req.params.id);
    res.render('banner/edit', { banner });
  }

  async update(req, res) {
    const banner = await Banner.findById(req.params.id);
    let updateData = {
      title: req.body.title,
      link: req.body.link
    };
    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (banner.image) {
        const oldPath = path.join(__dirname, '../../public/uploads', banner.image);
        fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
      }
      updateData.image = req.file.filename;
    }
    await Banner.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/banner/list');
  }
}

module.exports = new BannerController();