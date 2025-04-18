import mongoose, { Schema } from "mongoose";
import autoIncrement from "mongoose-sequence";

const AutoIncrement = autoIncrement(mongoose);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: Number,
    },
    order: {
      type: Schema.ObjectId,
      ref: "Order",
      required: [true, "Invoice must belong to order."],
      unique: true,
    },
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "Invoice must belong to user."],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

invoiceSchema.plugin(AutoIncrement, {
  inc_field: "invoiceNumber",
  start_seq: 1000,
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
