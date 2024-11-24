import Invoice from "../models/invoiceModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { getAll, isOwnerGet } from "./handlerFactory.js";

export const getAllInvoices = getAll(Invoice);
export const getInvoice = isOwnerGet(Invoice, "user", {
  path: "order",
});

export const checkUserPurchase = catchAsync(async (req, res, next) => {
  const invoices = await Invoice.find({
    user: req.user.id,
  }).populate("order");

  const productInInvoices = invoices.some((invoice) =>
    invoice.order.products.some(
      (item) => item.product.toString() === req.body.product
    )
  );

  if (!productInInvoices) {
    return next(
      new AppError(
        "You can only leave a review after your purchase has been confirmed.",
        403
      )
    );
  }

  next();
});
