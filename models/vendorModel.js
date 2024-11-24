import mongoose, { Schema } from "mongoose";
import Product from "./productModel.js";
import User from "./userModel.js";

const vendorSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, "Business name is required."],
    unique: true,
    lowercase: true,
    minlength: [8, "Business name must be at least 8 characters."],
  },
  businessDescription: {
    type: String,
    required: [true, "Business description is required."],
    minlength: [30, "Business description must be at least 30 characters."],
  },
  businessAddress: {
    type: {
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
  },
  rating: {
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
    },
  },
  businessLogo: String,
  socialMediaLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
  },
  requestStatus: {
    type: String,
    enum: {
      values: ["pending", "approved", "rejected"],
      message: "Vendor request status is either: pending, approved, rejected.",
    },
    default: "pending",
  },
});

vendorSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await User.findOneAndUpdate(
      { vendor: doc.id },
      { role: "user", vendor: undefined }
    );

    await Product.deleteMany({ vendor: doc.id });
  }
});

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
