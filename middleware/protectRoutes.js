import User from "../models/userModel.js";
import Vendor from "../models/vendorModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import { promisify } from "util";

const protectRoutes = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.ACCESS_TOKEN_SECRET
  );

  const currentUser = await User.findOne({
    username: decoded.userInfo.username,
  });

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token is no longer exist.", 401)
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  if (currentUser.status !== "active") {
    return next(new AppError("Your account is not active yet!.", 403));
  }

  req.user = currentUser;
  next();
});

export default protectRoutes;
