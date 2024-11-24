import User from "../models/userModel.js";
import Vendor from "../models/vendorModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import filterBody from "../utils/filterBody.js";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "./handlerFactory.js";

export const getMe = catchAsync(async (req, res, next) => {
  const vendor = await Vendor.findById(req.user.vendor);

  res.status(200).json({
    status: "success",
    data: {
      vendor,
    },
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  const filteredBody = filterBody(
    req.body,
    "businessName",
    "businessDescription",
    "businessAddress",
    "businessLogo",
    "socialMediaLinks"
  );

  await Vendor.findByIdAndUpdate(req.user.vendor, filteredBody, {
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "Vendor has been updated successfully!",
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.vendor;

  next();
});

export const getAllVendors = getAll(Vendor);
export const getVendor = getOne(Vendor);
export const updateVendor = updateOne(Vendor);
export const deleteVendor = deleteOne(Vendor);
