const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    chatRoomId: {
      type: String,
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
chatSchema.index({ chatRoomId: 1, createdAt: -1 });
chatSchema.index({ receiver: 1, isRead: 1 });
chatSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
