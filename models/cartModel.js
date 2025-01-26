import mongoose, { Schema } from "mongoose";

const cartSchema = new mongoose.Schema({
  products: [
    {
      product: {
        type: Schema.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
      },
    },
  ],
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Cart must belong to user."],
    unique: true,
  },
  total: {
    type: Number,
    default: 0,
  },
  totalProducts: {
    type: Number,
    default: 0,
  },
  totalQuantity: {
    type: Number,
    default: 0,
  },
});

cartSchema.statics.calcTotals = async function (cartId) {
  const stats = await this.aggregate([
    {
      $match: { _id: cartId },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "products",
        localField: "products.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $addFields: {
        effectivePrice: {
          $cond: {
            if: {
              $and: [
                { $gt: ["$productDetails.discount.amount", 0] },
                { $gte: ["$productDetails.discount.expiryDate", new Date()] },
              ],
            },
            then: {
              $subtract: [
                "$productDetails.price",
                "$productDetails.discount.amount",
              ],
            },
            else: "$productDetails.price",
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        total: {
          $sum: { $multiply: ["$products.quantity", "$effectivePrice"] },
        },
        totalProducts: { $sum: 1 },
        totalQuantity: { $sum: "$products.quantity" },
      },
    },
  ]);

  await this.updateOne(
    { _id: cartId },
    {
      total: stats[0]?.total.toFixed(2) || 0,
      totalProducts: stats[0]?.totalProducts || 0,
      totalQuantity: stats[0]?.totalQuantity || 0,
    }
  );
};

cartSchema.post("findOneAndUpdate", async function (doc) {
  await this.model.calcTotals(doc._id);
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
