import catchAsync from "../utils/catchAsync.js";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Order from "../models/orderModel.js";
import filterBody from "../utils/filterBody.js";
import {
  createOne,
  getAll,
  getOne,
  isOwnerDelete,
  isOwnerUpdate,
} from "./handlerFactory.js";
import AppError from "../utils/appError.js";

export const prepareBody = (req, res, next) => {
  req.body = filterBody(
    req.body,
    "name",
    "description",
    "price",
    "isArchived",
    "stockQuantity",
    "images",
    "brand",
    "discount",
    "category",
    "shippingInformation",
    "warrantyInformation",
    "tags"
  );
  next();
};

export const setVendorId = catchAsync(async (req, res, next) => {
  req.body.vendor = req.user.vendor;

  next();
});

export const getAllProducts = getAll(Product);
export const getProduct = getOne(Product, { path: "reviews" });
export const createProduct = createOne(Product);
export const isOwnerUpdateProduct = isOwnerUpdate(Product, "vendor", "admin");
export const isOwnerDeleteProduct = isOwnerDelete(Product, "vendor", "admin");

export const validateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.body.product);
  if (!product) {
    return next(new AppError("Product not found.", 404));
  }
  next();
});

export const getPriceRange = catchAsync(async (req, res, next) => {
  const range = await Product.aggregate([
    {
      $group: {
        _id: null,
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      minPrice: range[0].minPrice,
      maxPrice: range[0].maxPrice,
    },
  });
});

export const getBrands = catchAsync(async (req, res, next) => {
  const brands = await Product.distinct("brand");

  res.status(200).json({
    status: "success",
    data: {
      brands,
    },
  });
});

export const getDeals = catchAsync(async (req, res, next) => {
  const deals = await Product.find({ discount: { $exists: true } }).limit(3);

  res.status(200).json({
    status: "success",
    data: {
      deals,
    },
  });
});

export const getProductBySlug = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
  });
  if (!product) {
    return next(new AppError("No product found with that slug.", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

export const getProductsOverview = catchAsync(async (req, res, next) => {
  const products = await Product.countDocuments();
  const categories = await Category.countDocuments();
  const orders = await Order.countDocuments();
  const revenue = await Order.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
  ]);

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - 30);
  const monthlyEarning = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lt: now } } },
    { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
  ]);

  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        total: 1,
      },
    },
  ]);

  const monthlyProducts = await Product.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        total: 1,
      },
    },
  ]);

  const revenueByOrderStatus = await Order.aggregate([
    {
      $group: {
        _id: {
          orderStatus: "$orderStatus",
          paymentStatus: "$paymentStatus",
        },
        total: { $sum: "$total" },
      },
    },
    { $sort: { "_id.orderStatus": 1 } },
    {
      $project: {
        _id: 0,
        orderStatus: "$_id.orderStatus",
        paymentStatus: "$_id.paymentStatus",
        total: 1,
      },
    },
  ]);

  const topSellingCategories = await Product.aggregate([
    { $group: { _id: "$category", productsCount: { $sum: 1 } } },
    { $sort: { productsCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $project: { _id: 0, productsCount: 1, category: "$category.name" } },
    { $unwind: "$category" },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      products,
      categories,
      orders,
      revenue: revenue[0]?.totalRevenue || 0,
      monthlyEarning: monthlyEarning[0]?.totalRevenue || 0,
      monthlySales,
      monthlyProducts,
      revenueByOrderStatus,
      topSellingCategories,
    },
  });
});
