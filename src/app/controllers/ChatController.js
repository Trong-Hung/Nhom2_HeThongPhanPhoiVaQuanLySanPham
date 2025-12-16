const Chat = require("../models/Chat");
const User = require("../models/User");
const mongoose = require("mongoose");

class ChatController {
  // Hiển thị trang chat - đơn giản hóa logic
  async showChatPage(req, res) {
    try {
      if (!req.session.user) {
        return res.redirect("/auth/login");
      }

      const currentUser = req.session.user;

      if (currentUser.role === "admin") {
        // Admin xem tất cả chat rooms - inline implementation
        try {
          const chatRooms = await Chat.aggregate([
            {
              $match: {
                $or: [
                  { sender: new mongoose.Types.ObjectId(currentUser._id) },
                  { receiver: new mongoose.Types.ObjectId(currentUser._id) },
                ],
              },
            },
            {
              $group: {
                _id: "$chatRoomId",
                lastMessage: { $last: "$message" },
                lastMessageTime: { $last: "$createdAt" },
                lastSender: { $last: "$sender" },
                unreadCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $eq: [
                              "$receiver",
                              new mongoose.Types.ObjectId(currentUser._id),
                            ],
                          },
                          { $eq: ["$isRead", false] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { lastMessageTime: -1 } },
          ]);

          // Populate thông tin user
          const chatRoomsWithUsers = [];
          for (const room of chatRooms) {
            try {
              const userIds = room._id.split("_");
              const otherUserId = userIds.find(
                (id) => id !== currentUser._id.toString()
              );
              if (otherUserId && mongoose.Types.ObjectId.isValid(otherUserId)) {
                const otherUser =
                  await User.findById(otherUserId).select("name email role");
                if (otherUser) {
                  chatRoomsWithUsers.push({
                    ...room,
                    otherUser,
                  });
                }
              }
            } catch (error) {
              console.error("Lỗi khi populate user cho room:", room._id, error);
              continue;
            }
          }

          return res.render("chat/admin_chat", {
            chatRooms: chatRoomsWithUsers,
            currentUser,
          });
        } catch (error) {
          console.error("Lỗi khi hiển thị admin chat:", error);
          return res.status(500).send("Lỗi hệ thống");
        }
      } else {
        // User/Shipper chat với admin - inline logic
        const admin = await User.findOne({ role: "admin" });
        if (!admin) {
          return res.status(404).send("Không tìm thấy admin để chat");
        }

        // Tạo chatRoomId đồng nhất: luôn sắp xếp ID theo thứ tự
        const userIds = [
          currentUser._id.toString(),
          admin._id.toString(),
        ].sort();
        const chatRoomId = `${userIds[0]}_${userIds[1]}`;

        // Lấy tin nhắn
        const messages = await Chat.find({ chatRoomId })
          .populate("sender", "name role")
          .populate("receiver", "name role")
          .sort({ createdAt: 1 })
          .limit(50);

        // Đánh dấu đã đọc
        await Chat.updateMany(
          {
            chatRoomId,
            receiver: currentUser._id,
            isRead: false,
          },
          { isRead: true }
        );

        return res.render("chat/chat_room", {
          messages,
          chatPartner: admin,
          chatRoomId,
          currentUser,
        });
      }
    } catch (error) {
      console.error("Lỗi khi hiển thị chat:", error);
      res.status(500).send("Lỗi hệ thống");
    }
  }

  // Admin xem danh sách chat rooms
  async showAdminChatList(req, res) {
    try {
      const currentUser = req.session.user;

      // Lấy tất cả chat rooms có liên quan đến admin
      const chatRooms = await Chat.aggregate([
        {
          $match: {
            $or: [
              { sender: new mongoose.Types.ObjectId(currentUser._id) },
              { receiver: new mongoose.Types.ObjectId(currentUser._id) },
            ],
          },
        },
        {
          $group: {
            _id: "$chatRoomId",
            lastMessage: { $last: "$message" },
            lastMessageTime: { $last: "$createdAt" },
            lastSender: { $last: "$sender" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$receiver",
                          new mongoose.Types.ObjectId(currentUser._id),
                        ],
                      },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { lastMessageTime: -1 } },
      ]);

      // Populate thông tin user
      const chatRoomsWithUsers = [];
      for (const room of chatRooms) {
        try {
          const userIds = room._id.split("_");
          const otherUserId = userIds.find(
            (id) => id !== currentUser._id.toString()
          );
          if (otherUserId && mongoose.Types.ObjectId.isValid(otherUserId)) {
            const otherUser =
              await User.findById(otherUserId).select("name email role");
            if (otherUser) {
              chatRoomsWithUsers.push({
                ...room,
                otherUser,
              });
            }
          }
        } catch (error) {
          console.error("Lỗi khi populate user cho room:", room._id, error);
          continue;
        }
      }

      return res.render("chat/admin_chat", {
        chatRooms: chatRoomsWithUsers,
        currentUser,
      });
    } catch (error) {
      console.error("Lỗi khi hiển thị admin chat:", error);
      res.status(500).send("Lỗi hệ thống");
    }
  }

  // Gửi tin nhắn
  async sendMessage(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa đăng nhập",
        });
      }

      const { message, receiverId, chatRoomId } = req.body;
      const currentUser = req.session.user;

      // Validate dữ liệu đầu vào
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Tin nhắn không được để trống",
        });
      }

      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người nhận",
        });
      }

      // Kiểm tra người nhận tồn tại
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: "Người nhận không tồn tại",
        });
      }

      // Tạo chatRoomId nếu chưa có
      let finalChatRoomId = chatRoomId;
      if (!finalChatRoomId) {
        const userIds = [
          currentUser._id.toString(),
          receiverId.toString(),
        ].sort();
        finalChatRoomId = `${userIds[0]}_${userIds[1]}`;
      }

      // Tạo tin nhắn mới
      const newMessage = new Chat({
        sender: currentUser._id,
        receiver: receiverId,
        message: message.trim(),
        chatRoomId: finalChatRoomId,
        messageType: "text",
      });

      await newMessage.save();

      // Populate để trả về thông tin đầy đủ
      await newMessage.populate("sender", "name role");
      await newMessage.populate("receiver", "name role");

      console.log(
        `💬 Tin nhắn mới: ${currentUser.name} → ${receiver.name}: ${message.trim()}`
      );

      res.json({
        success: true,
        data: newMessage,
        message: "Gửi tin nhắn thành công",
      });
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  // Lấy tin nhắn mới (polling)
  async getMessages(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa đăng nhập",
        });
      }

      const { chatRoomId, lastMessageId } = req.query;
      const currentUser = req.session.user;

      let query = { chatRoomId };

      // Nếu có lastMessageId, chỉ lấy tin nhắn mới hơn
      if (lastMessageId) {
        query._id = { $gt: new mongoose.Types.ObjectId(lastMessageId) };
      }

      const messages = await Chat.find(query)
        .populate("sender", "name role")
        .populate("receiver", "name role")
        .sort({ createdAt: 1 })
        .limit(20);

      // Đánh dấu đã đọc tin nhắn mới
      await Chat.updateMany(
        {
          chatRoomId,
          receiver: currentUser._id,
          isRead: false,
          _id: { $in: messages.map((m) => m._id) },
        },
        { isRead: true }
      );

      res.json({
        success: true,
        data: messages,
        message: "Lấy tin nhắn thành công",
      });
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống: " + error.message,
      });
    }
  }

  // Đếm tin nhắn chưa đọc
  async getUnreadCount(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa đăng nhập",
        });
      }

      const currentUser = req.session.user;

      const unreadCount = await Chat.countDocuments({
        receiver: currentUser._id,
        isRead: false,
      });

      res.json({
        success: true,
        data: { unreadCount },
        message: "Lấy số tin nhắn chưa đọc thành công",
      });
    } catch (error) {
      console.error("Lỗi khi đếm tin nhắn chưa đọc:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống: " + error.message,
      });
    }
  }

  // Admin chat với user cụ thể
  async adminChatWithUser(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Chỉ admin mới có quyền truy cập");
      }

      const { userId } = req.params;
      const currentUser = req.session.user;

      // Kiểm tra user có tồn tại không
      const chatPartner = await User.findById(userId).select("name email role");
      if (!chatPartner) {
        return res.status(404).send("Không tìm thấy người dùng");
      }

      // Tạo chatRoomId với quy tắc nhất quán: userId nhỏ hơn trước
      const userIds = [userId.toString(), currentUser._id.toString()].sort();
      const chatRoomId = `${userIds[0]}_${userIds[1]}`;

      // Lấy lịch sử chat
      const messages = await Chat.find({ chatRoomId })
        .populate("sender", "name role")
        .populate("receiver", "name role")
        .sort({ createdAt: 1 })
        .limit(50);

      // Đánh dấu đã đọc tin nhắn
      await Chat.updateMany(
        {
          chatRoomId,
          receiver: currentUser._id,
          isRead: false,
        },
        { isRead: true }
      );

      res.render("chat/chat_room", {
        messages,
        chatPartner,
        chatRoomId,
        currentUser,
      });
    } catch (error) {
      console.error("Lỗi khi xem chat admin:", error);
      res.status(500).send("Lỗi hệ thống");
    }
  }

  // Lấy tin nhắn mới (polling)
  async getMessages(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa đăng nhập",
        });
      }

      const { chatRoomId, lastMessageId } = req.query;
      const currentUser = req.session.user;

      if (!chatRoomId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu chatRoomId",
        });
      }

      let query = { chatRoomId };

      // Nếu có lastMessageId, chỉ lấy tin nhắn mới hơn
      if (lastMessageId) {
        query._id = { $gt: new mongoose.Types.ObjectId(lastMessageId) };
      }

      const messages = await Chat.find(query)
        .populate("sender", "name role")
        .populate("receiver", "name role")
        .sort({ createdAt: 1 })
        .limit(20);

      // Đánh dấu đã đọc tin nhắn mới
      if (messages.length > 0) {
        await Chat.updateMany(
          {
            chatRoomId,
            receiver: currentUser._id,
            isRead: false,
            _id: { $in: messages.map((m) => m._id) },
          },
          { isRead: true }
        );
      }

      res.json({
        success: true,
        data: messages,
        message: "Lấy tin nhắn thành công",
      });
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  // Đếm tin nhắn chưa đọc
  async getUnreadCount(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa đăng nhập",
        });
      }

      const currentUser = req.session.user;

      const unreadCount = await Chat.countDocuments({
        receiver: currentUser._id,
        isRead: false,
      });

      res.json({
        success: true,
        data: { unreadCount },
        message: "Lấy số tin nhắn chưa đọc thành công",
      });
    } catch (error) {
      console.error("Lỗi khi đếm tin nhắn chưa đọc:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }
}

module.exports = new ChatController();
