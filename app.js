import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import globalErrorHandler from "./controllers/errorController.js";
import AppError from "./utils/appError.js";
import productRouter from "./routes/productRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import invoiceRouter from "./routes/invoiceRoutes.js";
import userRouter from "./routes/userRoutes.js";
import vendorRouter from "./routes/vendorRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import corsOptions from "./config/corsOptions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const app = express();

app.use(cookieParser());
app.use(cors(corsOptions));

// Server static files
app.use(express.static(join(__dirname, "/public")));

// Body parser, reading data from the body into req.body
app.use(bodyParser.json({ limit: "20kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20kb" }));

// Routes
app.use("/api/products", productRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/orders", orderRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/users", userRouter);
app.use("/api/vendors", vendorRouter);
app.use("/api/wishlists", wishlistRouter);
app.use("/api/carts", cartRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server.`, 404));
});

app.use(globalErrorHandler);
