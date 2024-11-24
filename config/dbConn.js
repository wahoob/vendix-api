import mongoose from "mongoose";

const DB = process.env.DATABASE_URI.replace(
  "<USERNAME>",
  process.env.DATABASE_USERNAME
).replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

const connectDB = async () => {
  await mongoose.connect(DB);
};

export default connectDB;
