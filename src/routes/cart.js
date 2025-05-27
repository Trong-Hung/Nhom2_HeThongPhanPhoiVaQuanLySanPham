const express = require('express');
const router = express.Router();
const CartController = require('../app/controllers/CartController');




router.post('/add/:id', CartController.addToCart);

router.post('/increase/:id', CartController.increaseQuantity);

router.post('/decrease/:id', CartController.decreaseQuantity);

router.post("/remove/:id", CartController.removeFromCart)
router.delete('/remove/:id', CartController.removeFromCart);

router.get('/giohang', CartController.viewCart);

router.get('/payment', CartController.viewCheckout);

router.post('/payment', CartController.processCheckout);




module.exports = router;






