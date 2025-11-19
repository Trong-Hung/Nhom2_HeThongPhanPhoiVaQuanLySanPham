const express = require("express");
const router = express.Router();
const ChatController = require("../app/controllers/ChatController");

// Middleware kiểm tra đăng nhập
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  next();
};

// Routes
router.get("/", requireLogin, ChatController.showChatPage);
router.get("/admin/:userId", requireLogin, ChatController.adminChatWithUser);
router.post("/send", requireLogin, ChatController.sendMessage);
router.get("/messages", requireLogin, ChatController.getMessages);
router.get("/unread-count", requireLogin, ChatController.getUnreadCount);

module.exports = router;
