import mongoose, { Schema } from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    products: [
      {
        type: Schema.ObjectId,
        ref: "Product",
      },
    ],
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "Wishlist must belong to user."],
      unique: true,
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
