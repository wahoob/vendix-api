import catchAsync from "../utils/catchAsync.js";
import Product from "../models/productModel.js";
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
