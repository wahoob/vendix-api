import mongoose, { Schema } from "mongoose";
import Product from "./productModel.js";

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
    },
    comment: {
      type: String,
      required: [true, "Comment is required."],
      minlength: [4, "Comment must be at least 4 characters."],
    },
    product: {
      type: Schema.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to product."],
    },
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to user."],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAvgRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    "rating.ratingsQuantity": stats[0].nRating,
    "rating.ratingsAverage": stats[0].avgRating,
  });
};

reviewSchema.post("save", async function () {
  await this.constructor.calcAvgRatings(this.product);
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await this.constructor.calcAvgRatings(doc.product);
  }
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
