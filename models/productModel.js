import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import Review from "./reviewModel.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      unique: true,
      lowercase: true,
      minlength: [5, "Name must be at least 5 characters."],
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      minlength: [30, "Description must be at least 30 characters."],
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
    },
    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required."],
    },
    tags: [String],
    isArchived: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String],
      required: [true, "At least one image is required."],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "At least one image is required.",
      },
    },
    brand: String,
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
    discount: {
      type: {
        amount: {
          type: Number,
          required: [true, "Discount amount is required."],
        },
        expiryDate: {
          type: Date,
          required: [true, "Expiry date for the discount is required."],
        },
      },
    },
    shippingInformation: {
      type: String,
      required: [true, "Shipping information is required."],
    },
    warrantyInformation: {
      type: String,
      required: [true, "Warranty information is required."],
    },
    slug: String,
    salesCount: {
      type: Number,
      default: 0,
    },
    vendor: {
      type: Schema.ObjectId,
      ref: "Vendor",
      required: [true, "Product must belong to vendor."],
    },
    category: {
      type: Schema.ObjectId,
      ref: "Category",
      required: [true, "Category is required."],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ slug: 1 });

productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

productSchema.pre(/^find/, function () {
  this.populate({ path: "category" });
  this.populate({ path: "vendor", select: "businessName" });
});

productSchema.pre("validate", function () {
  if (this.discount && this.discount.amount >= this.price) {
    this.invalidate(
      "discount.amount",
      "Discount amount must be less than the price."
    );
  }
});

productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update && update.name) {
    update.slug = slugify(update.name, { lower: true });
  }
  next();
});

productSchema.pre("deleteMany", async function (next) {
  const productsToDelete = await this.model.find(this.getQuery(), "_id");
  this.productIds = productsToDelete.map((product) => product.id);
  next();
});

productSchema.post("deleteMany", async function (res) {
  if (res && res.deletedCount > 0) {
    await Review.deleteMany({ product: { $in: this.productIds } });

    this.productIds = undefined;
  }
});

productSchema.post("findOneAndDelete", async function (doc) {
  await Review.deleteMany({ product: doc.id });
});

const Product = mongoose.model("Product", productSchema);

export default Product;
