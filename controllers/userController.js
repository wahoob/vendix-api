import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import { deleteOne, getAll, getOne, updateOne } from "./handlerFactory.js";
import filterBody from "../utils/filterBody.js";
import Vendor from "../models/vendorModel.js";

export const setUserId = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm || req.body.email) {
    return next(
      new AppError(
        "This route is not for password or email update. Please use /updatePassword to update your password or /updateEmail to update your email.",
        400
      )
    );
  }

  const filteredBody = filterBody(
    req.body,
    "username",
    "phone",
    "fullName",
    "profilePicture",
    "addresses"
  );

  await User.findByIdAndUpdate(req.user.id, filteredBody, {
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "User has been updated successfully!",
  });
});

export const createUser = (req, res, next) => {
  return next(
    new AppError(
      "This route is not for user creation. Please use /signup to create a new account.",
      400
    )
  );
};

// Administration
export const getAllUsers = getAll(User);
export const getUser = getOne(User);
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);

export const requestVendorRole = catchAsync(async (req, res, next) => {
  const filteredBody = filterBody(
    req.body,
    "businessName",
    "businessDescription",
    "businessAddress",
    "businessLogo",
    "socialMediaLinks"
  );

  if (req.user.vendor)
    return next(new AppError("You already have requested vendor role.", 409));
  const vendor = await Vendor.create({ ...filteredBody });
  await User.findByIdAndUpdate(req.user.id, { vendor: vendor.id });

  res.status(201).json({
    status: "success",
    message:
      "Your request to switch to a vendor role has been submitted and is awaiting approval.",
  });
});

export const handleVendorRoleRequest = catchAsync(async (req, res, next) => {
  const { action } = req.body;
  if (!action || !["approve", "reject"].includes(action)) {
    return next(
      new AppError("Invalid action. Must be 'approve' or 'reject'.", 400)
    );
  }

  const user = await User.findById(req.params.userId);
  if (!user || !user.vendor) {
    return next(new AppError("Vendor not found.", 404));
  }

  const vendor = await Vendor.findById(user.vendor);

  if (vendor.requestStatus !== "pending") {
    return next(new AppError("No pending request for this vendor.", 400));
  }

  if (action === "approve") {
    vendor.requestStatus = "approved";
    user.role = "vendor";
  } else if (action === "reject") {
    vendor.requestStatus = "rejected";
  }

  await vendor.save({ validateBeforeSave: false });
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message:
      action === "approve"
        ? "User role has been updated to vendor."
        : "Vendor role request has been rejected.",
  });
});
