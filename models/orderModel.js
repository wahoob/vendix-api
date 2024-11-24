import mongoose, { Schema } from "mongoose";
import Invoice from "./invoiceModel.js";

const orderSchema = new mongoose.Schema(
  {
    orderStatus: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["paid", "payOnDelivery"],
        message: "Payment status is either: paid, payOnDelivery",
      },
      required: [true, "Payment status is required."],
    },
    shippingAddress: {
      type: {
        country: {
          type: String,
          required: [true, "Country is required."],
        },
        city: {
          type: String,
          required: [true, "City is required."],
        },
        state: {
          type: String,
          required: [true, "State is required."],
        },
        street: {
          type: String,
          required: [true, "Street is required."],
        },
      },
      required: [true, "Shipping address is required."],
    },
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "Order must belong to user."],
    },
    products: {
      type: [
        {
          product: {
            type: Schema.ObjectId,
            ref: "Product",
            required: [true, "Product is required."],
          },
          quantity: {
            type: Number,
            required: [true, "Product quantity is required."],
            min: [1, "Quantity must be at least 1"],
          },
          price: {
            type: Number,
            required: [true, "Price at time of order is required."],
          },
        },
      ],
      required: [true, "At least one product is required."],
    },
    total: {
      type: Number,
      required: true,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

orderSchema.post("findOneAndUpdate", async function (doc) {
  const orderStatus = this.getUpdate().$set?.orderStatus;

  if (orderStatus === "delivered") {
    await Invoice.create({
      order: doc._id,
      user: doc.user,
    });
  }
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
