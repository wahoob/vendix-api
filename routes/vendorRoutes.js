import express from "express";
import {
  deleteMe,
  deleteVendor,
  getAllVendors,
  getMe,
  getVendor,
  updateMe,
  updateVendor,
} from "../controllers/vendorController.js";
import protectRoutes from "../middleware/protectRoutes.js";
import restrictTo from "../middleware/restrictTo.js";
import productRouter from "./productRoutes.js";
import { deleteOne } from "../controllers/handlerFactory.js";

const router = express.Router();

router.use("/:vendorId/products", productRouter);

router.get("/", getAllVendors);

router.get("/:id", getVendor);

router.use(protectRoutes);

// Administration and vendor-specific
router.use(restrictTo("vendor", "admin"));

router.route("/me").get(getMe).patch(updateMe).delete(deleteMe, deleteOne);

// Administration
router.use(restrictTo("admin"));

router.route("/:id").patch(updateVendor).delete(deleteVendor);

export default router;
