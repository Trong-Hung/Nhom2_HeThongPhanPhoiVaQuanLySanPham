const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/role');

router.get('/', isAdmin, (req, res) => {
  res.render('admin/dashboard', {
    title: 'Trang Quản Trị',
    user: req.session.user
  });
});

module.exports = router;
