const express = require('express');
const router = express.Router();
const CartController = require('../app/controllers/CartController');



// Thêm sản phẩm vào giỏ hàng
router.post('/add/:id', CartController.addToCart);

// Tăng số lượng sản phẩm trong giỏ
router.post('/increase/:id', CartController.increaseQuantity);

// Giảm số lượng sản phẩm trong giỏ
router.post('/decrease/:id', CartController.decreaseQuantity);

// Xóa sản phẩm khỏi giỏ hàng
router.post("/remove/:id", CartController.removeFromCart)
router.delete('/remove/:id', CartController.removeFromCart);

// Hiển thị giỏ hàng
router.get('/giohang', CartController.viewCart);

// Hiển thị trang thanh toán
router.get('/payment', CartController.viewCheckout);

// Xử lý thanh toán
router.post('/payment', CartController.processCheckout);




module.exports = router;






