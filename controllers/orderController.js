import Order from "../models/orderModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import filterBody from "../utils/filterBody.js";
import {
  deleteOne,
  getAll,
  updateOne,
  isOwnerDelete,
  isOwnerGet,
} from "./handlerFactory.js";

export const prepareBody = (req, res, next) => {
  req.body = filterBody(req.body, "orderStatus");
  next();
};

export const protectOrderStatus = (...forbiddenFields) =>
  catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (forbiddenFields.includes(order?.orderStatus)) {
      return next(
        new AppError(
          `You cannot update or delete an order that is already ${forbiddenFields}.`,
          403
        )
      );
    }
    next();
  });

export const getAllOrders = getAll(Order);
export const isOwnerGetOrder = isOwnerGet(
  Order,
  "user",
  ["products.product", "user"],
  "admin",
  "delivery"
);
export const updateOrder = updateOne(Order);
export const deleteOrder = deleteOne(Order);
export const isOwnerDeleteOrder = isOwnerDelete(Order, "user");

export const getMyOrders = catchAsync(async (req, res, next) => {
  let query;
  if (req.user.role === "user") {
    query = Order.find({ user: req.user.id });
  } else if (req.user.role === "vendor") {
    query = Order.aggregate([
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
        $match: {
          "productDetails.vendor": req.user.vendor,
        },
      },
      {
        $group: {
          _id: "$_id",
          orderStatus: { $first: "$orderStatus" },
          paymentStatus: { $first: "$paymentStatus" },
          shippingAddress: { $first: "$shippingAddress" },
          user: { $first: "$user" },
          products: { $push: "$products" },
        },
      },
    ]);
  }

  const orders = await query;

  res.status(200).json({
    status: "success",
    result: orders.length,
    data: {
      orders,
    },
  });
});
