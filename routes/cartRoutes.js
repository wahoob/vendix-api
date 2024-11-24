import express from "express";
import {
  addItem,
  checkout,
  clearCart,
  getCart,
  removeItem,
  updateItemQuantity,
} from "../controllers/cartController.js";
import protectRoutes from "../middleware/protectRoutes.js";
import restrictTo from "../middleware/restrictTo.js";

const router = express.Router();

// Authentication
router.use(protectRoutes);

// Authorization
router.use(restrictTo("user"));

router.get("/", getCart);

router.patch("/add", addItem);
router.patch("/remove", removeItem);
router.patch("/updateQuantity", updateItemQuantity);
router.delete("/clear", clearCart);
router.post("/checkout", checkout);

export default router;
