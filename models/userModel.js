import mongoose, { Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Vendor from "./vendorModel.js";
import Review from "./reviewModel.js";
import Cart from "./cartModel.js";
import Wishlist from "./wishlistModel.js";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required."],
    unique: true,
    minlength: [3, "Username must be at least 3 characters."],
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, "Email is required."],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address."],
  },
  phone: {
    type: String,
    validate: [validator.isMobilePhone, "Please provide a valid phone number."],
  },
  fullName: {
    type: {
      firstName: {
        type: String,
        required: [true, "First name is required."],
      },
      lastName: {
        type: String,
        required: [true, "Last name is required."],
      },
    },
    required: [true, "Full name is required."],
  },
  profilePicture: String,
  role: {
    type: String,
    enum: {
      values: ["admin", "user", "vendor", "delivery"],
      message: "Role is either: customer, vendor, delivery, admin.",
    },
    default: "user",
  },
  status: {
    type: String,
    enum: {
      values: ["active", "inactive", "awaitingVerification"],
      message: "Status is either: active, inactive, awaitingVerification.",
    },
    default: "awaitingVerification",
  },
  addresses: [
    {
      country: {
        type: String,
        required: [true, "Country is required."],
      },
      city: {
        type: String,
        required: [true, "City is required."],
      },
      state: {
        type: String,
        required: [true, "State is required."],
      },
      street: {
        type: String,
        required: [true, "Street is required."],
      },
    },
  ],
  tempEmail: {
    type: String,
    validate: [
      {
        validator: function (value) {
          return !!value;
        },
        message: "Please provide email to update.",
      },
      {
        validator: function (value) {
          return validator.isEmail(value);
        },
        message: "Please provide a valid email address.",
      },
      {
        validator: function (value) {
          return value !== this.email;
        },
        message: "The new email cannot be the same as the current email.",
      },
      {
        validator: async function (value) {
          const existingEmail = await this.constructor.findOne({
            email: value,
          });
          return !existingEmail;
        },
        message: "The email already exists. Please use a different email.",
      },
    ],
    select: false,
  },
  verificationCode: {
    type: String,
    select: false,
  },
  verificationCodeExpires: {
    type: Date,
    select: false,
  },
  password: {
    type: String,
    required: [true, "Password is required."],
    minlength: [8, "Password must be at least 8 characters."],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Password confirm is required."],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Password confirm must be same as password.",
    },
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  wishlist: {
    type: Schema.ObjectId,
    ref: "Wishlist",
  },
  vendor: {
    type: Schema.ObjectId,
    ref: "Vendor",
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre("save", async function (next) {
  if (this.isNew) {
    await Cart.create({ user: this._id });

    await Wishlist.create({ user: this._id });
  }
  next();
});

userSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Vendor.findByIdAndDelete(doc.vendor);

    await Review.deleteMany({ user: doc._id });

    await Cart.findOneAndDelete({ user: doc._id });

    await Wishlist.findOneAndDelete({ user: doc._id });
  }
});

userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // FALSE means NOT changed.
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.createVerificationCode = function () {
  const verificationCode = crypto.randomBytes(32).toString("hex");

  this.verificationCode = crypto
    .createHash("sha256")
    .update(verificationCode)
    .digest("hex");
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000;

  return verificationCode;
};

const User = mongoose.model("User", userSchema);

export default User;
