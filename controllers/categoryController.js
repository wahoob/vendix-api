import Category from "../models/categoryModel.js";
import catchAsync from "../utils/catchAsync.js";
import { createOne, getAll, updateOne } from "./handlerFactory.js";

export const setQuery = (req, res, next) => {
  req.query.limit = req.query.limit || Number.MAX_SAFE_INTEGER;
  next();
};

export const getAllCategories = getAll(Category);
export const createCategory = createOne(Category);
export const updateCategory = updateOne(Category);

export const validateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.body.category);
  if (!category) {
    req.body.category = "67039f9a329380ba32d1652a";
  }

  next();
});
