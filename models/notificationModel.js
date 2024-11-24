import mongoose, { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Message is required."],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: {
        values: ["high", "medium", "low"],
        message: "priority is either: high, medium, low.",
      },
      required: [true, "Priority is required."],
    },
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "Notification must belong to user."],
    },
    product: {
      type: Schema.ObjectId,
      ref: "Product",
    },
    order: {
      type: Schema.ObjectId,
      ref: "Order",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
