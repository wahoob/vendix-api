import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name of category is required."],
    minlength: [4, "Category name must be at least 4 characters."],
    maxlength: [20, "Category name cannot exceed 20 characters."],
    lowercase: true,
    unique: true,
  },
  image: String,
});

categorySchema.pre("save", function (next) {
  this.name = slugify(this.name, { lower: true });
  next();
});

categorySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.name) {
    update.name = slugify(update.name, { lower: true });
    this.setUpdate(update);
  }

  next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
