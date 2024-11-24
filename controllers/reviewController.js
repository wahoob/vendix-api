import Invoice from "../models/invoiceModel.js";
import Review from "../models/reviewModel.js";
import catchAsync from "../utils/catchAsync.js";
import filterBody from "../utils/filterBody.js";
import {
  createOne,
  getAll,
  getOne,
  isOwnerDelete,
  isOwnerUpdate,
} from "./handlerFactory.js";

export const setProductUserId = (req, res, next) => {
  req.body.user = req.user.id;
  if (!req.body.product) req.body.product = req.params.productId;
  next();
};

export const prepareUpdateBody = (req, res, next) => {
  req.body = filterBody(req.body, "rating", "comment");
  next();
};

export const getAllReviews = getAll(Review);
export const getReview = getOne(Review);
export const createReview = createOne(Review);
export const isOwnerUpdateReview = isOwnerUpdate(Review, "user");
export const isOwnerDeleteReview = isOwnerDelete(Review, "user", "admin");

export const canUserLeaveReview = catchAsync(async (req, res, next) => {
  const invoices = await Invoice.find({
    user: req.user.id,
  }).populate("order");

  const productInInvoices = invoices.some((invoice) =>
    invoice.order.products.some(
      (item) => item.product.toString() === req.params.id
    )
  );

  const review = await Review.findOne({
    user: req.user.id,
    product: req.params.id,
  });

  if (!productInInvoices || review) {
    return res.status(200).json({ canReview: false });
  }

  res.status(200).json({ canReview: true });
});
