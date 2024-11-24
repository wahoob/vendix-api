import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import sendTokenResponse, { signToken } from "../utils/sendTokenResponse.js";
import filterBody from "../utils/filterBody.js";
import crypto from "crypto";
import Email from "../utils/email.js";
import jwt from "jsonwebtoken";
import { promisify } from "util";

export const signup = catchAsync(async (req, res, next) => {
  const filteredBody = filterBody(
    req.body,
    "username",
    "email",
    "phone",
    "fullName",
    "profilePicture",
    "addresses",
    "password",
    "passwordConfirm"
  );
  const user = await User.create(filteredBody);

  const verificationCode = user.createVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    const verificationURL = `${req.protocol}://${req.get(
      "host"
    )}/users/verify/${verificationCode}`;

    await new Email(user, verificationURL).sendVerify();

    res.status(201).json({
      status: "success",
      message: "User signed up! Verification email sent.",
    });
  } catch (err) {
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "User signed up successfully, but failed to send verification email. Please resend the verification email.",
        500
      )
    );
  }
});

export const resendVerificationCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError("User with this email address is not found.", 404)
    );
  }

  if (user.status !== "awaitingVerification")
    return next(new AppError("Email is already verified."));

  const verificationCode = user.createVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    const verificationURL = `${req.protocol}://${req.get(
      "host"
    )}/users/verify/${verificationCode}`;

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

  const welcomeURL = `${req.protocol}://${req.get("host")}/profile`;
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

  let query = {};
  username ? (query.username = username) : (query.email = email);
  const user = await User.findOne(query).select("+password");

  if (!user || !(await user.correctPassword(password))) {
    return next(
      new AppError(
        `Invalid ${username ? "username" : "email"} or password.`,
        401
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
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.password))) {
    return next(new AppError("Password is incorrect.", 401));
  }

  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(
      new AppError("This email is already in use. Please use another one.", 400)
    );
  }

  user.tempEmail = req.body.email;
  const validationError = user.validateSync(["tempEmail"]);
  if (validationError) {
    return next(new AppError(validationError.errors.tempEmail.message, 400));
  }

  const verificationCode = user.createVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    const verificationURL = `${req.protocol}://${req.get(
      "host"
    )}/users/verify/${verificationCode}`;
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
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/users/resetPassword/${resetToken}`;

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
