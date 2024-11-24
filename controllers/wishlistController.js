import catchAsync from "../utils/catchAsync.js";
import Wishlist from "../models/wishlistModel.js";
import AppError from "../utils/appError.js";

export const addItem = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({
    user: req.user.id,
    products: req.body.product,
  });

  if (wishlist) {
    return next(new AppError("Product already in wishlist", 400));
  }

  await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $push: { products: req.body.product } }
  );

  res.status(200).json({
    status: "success",
    message: "Product added to wishlist successfully!",
  });
});

export const removeItem = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({
    user: req.user.id,
  });

  if (!wishlist.products.includes(req.body.product)) {
    return next(new AppError("Product does not exist in the wishlist.", 400));
  }

  await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $pull: { products: req.body.product } }
  );

  res.status(200).json({
    status: "success",
    message: "Product removed from wishlist successfully!",
  });
});
