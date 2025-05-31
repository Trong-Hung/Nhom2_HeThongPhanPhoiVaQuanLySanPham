const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const bannerController = require('../app/controllers/BannerController');
const { isAdmin } = require('../middlewares/role');

router.get('/list', isAdmin, bannerController.list);
router.get('/create', isAdmin, bannerController.create);
router.post('/store', isAdmin, upload.single('image'), bannerController.store);
router.post('/:id/delete', isAdmin, bannerController.delete);
router.get('/:id/edit', isAdmin, bannerController.edit);
router.post('/:id/update', isAdmin, upload.single('image'), bannerController.update);

module.exports = router;