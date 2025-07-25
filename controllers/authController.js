import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import sendTokenResponse, { signToken } from "../utils/sendTokenResponse.js";
import filterBody from "../utils/filterBody.js";
import crypto from "crypto";
import Email from "../utils/email.js";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import mongoose from "mongoose";
import Cart from "../models/cartModel.js";
import Wishlist from "../models/wishlistModel.js";

export const signup = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const filteredBody = filterBody(
      req.body,
      "username",
      "email",
      "phone",
      "fullName",
      "image",
      "addresses",
      "password",
      "passwordConfirm"
    );

    const user = await User.create([filteredBody], { session });
    await Cart.create([{ user: user[0]._id }], { session });
    await Wishlist.create([{ user: user[0]._id }], { session });

    const verificationCode = user[0].createVerificationCode();
    await user[0].save({ validateBeforeSave: false, session });

    const verificationURL = `${process.env.FRONTEND_URL}/auth/verify/${verificationCode}`;
    await new Email(user[0], verificationURL).sendVerify();

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      status: "success",
      message: "User signed up! Verification email sent.",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.log(err);

    return next(new AppError("Sorry, Try again later.", 500));
  }
});

export const resendVerificationCode = catchAsync(async (req, res, next) => {
  const { username, email } = req.body;
  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    return next(
      new AppError(
        `User with this ${
          username ? "username" : "email address"
        } is not found.`,
        404
      )
    );
  }

  if (user.status !== "awaitingVerification")
    return next(new AppError("Email is already verified."));

  const verificationCode = user.createVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    const verificationURL = `${process.env.FRONTEND_URL}/auth/verify/${verificationCode}`;

    await new Email(user, verificationURL).sendVerify();

    res.status(201).json({
      status: "success",
      message: "Verification code sent to email.",
    });
  } catch (err) {
    console.log(err);

    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("Failed to send verification email. Try again later.", 500)
    );
  }
});

export const verifyEmail = catchAsync(async (req, res, next) => {
  const hashedCode = crypto
    .createHash("sha256")
    .update(req.params.code)
    .digest("hex");

  const user = await User.findOne({
    verificationCode: hashedCode,
    verificationCodeExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Verification code is invalid.", 400));
  }

  user.status = "active";
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  if (user.tempEmail) {
    user.email = user.tempEmail;
    user.tempEmail = undefined;
  }
  await user.save({ validateBeforeSave: false });

  const welcomeURL = `${process.env.FRONTEND_URL}/dashboard/profile-settings`;
  await new Email(user, welcomeURL).sendWelcome();

  sendTokenResponse(user, 200, res);
});

export const signin = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!(username || email) || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  if (username && email) {
    return next(
      new AppError("Please provide only one of username or email.", 400)
    );
  }

  const user = await User.findOne({ $or: [{ username }, { email }] }).select(
    "+password"
  );

  if (!user || !(await user.correctPassword(password))) {
    return next(
      new AppError(
        `Invalid ${username ? "username" : "email"} or password.`,
        401
      )
    );
  }

  if (user.status === "awaitingVerification") {
    return next(
      new AppError(
        "Your email is not verified. Please check your email for the verification link.",
        403
      )
    );
  }

  sendTokenResponse(user, 200, res);
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { jwt: refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(
      new AppError(
        "Session expired or invalid. Please log in to continue.",
        401
      )
    );
  }

  const decoded = await promisify(jwt.verify)(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decoded.id);

  const accessToken = signToken(
    {
      userInfo: {
        username: user.username,
        role: user.role,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    process.env.ACCESS_TOKEN_EXPIRES_IN
  );

  res.status(200).json({
    status: "success",
    accessToken,
  });
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.currentPassword))) {
    return next(new AppError("Password is incorrect.", 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  await new Email(user).sendNotifyPasswordChange();

  sendTokenResponse(user, 200, res);
});

export const updateEmail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  user.tempEmail = req.body.email;
  const validationError = user.validateSync(["tempEmail"]);
  if (validationError) {
    return next(new AppError(validationError.errors.tempEmail.message, 400));
  }

  const verificationCode = user.createVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    const verificationURL = `${process.env.FRONTEND_URL}/auth/verify/${verificationCode}`;
    await new Email(user, verificationURL).sendVerify();

    res.status(200).json({
      status: "success",
      message: "Verification code sent to email.",
    });
  } catch (err) {
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.tempEmail = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("Failed to send verification email. Try again later.", 500)
    );
  }
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address.", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${process.env.FRONTEND_URL}/auth/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Link sent to email.",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There is an error sending the email. Try again later.", 500)
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired.", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

export const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt)
    return res.status(200).json({ message: "Already logged out" });
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "None",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(204).send();
};
