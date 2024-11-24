import "dotenv/config";
import { app } from "./app.js";
import connectDB from "./config/dbConn.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 3000;

connectDB();

mongoose.connection.once("open", () => {
  console.log("DB connected successfully!");

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
  });
});
