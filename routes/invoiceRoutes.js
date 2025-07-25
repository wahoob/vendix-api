import express from "express";
import protectRoutes from "../middleware/protectRoutes.js";
import {
  getAllInvoices,
  getInvoice,
} from "../controllers/invoiceController.js";
import restrictTo from "../middleware/restrictTo.js";
import { setUserId } from "../controllers/userController.js";

const router = express.Router();

// Authentication
router.use(protectRoutes);

router.get("/me", setUserId, getAllInvoices);

router.get("/", restrictTo("admin"), getAllInvoices);

router.get("/:id", getInvoice);

export default router;
