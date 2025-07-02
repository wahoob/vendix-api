import express from "express";
import protectRoutes from "../middleware/protectRoutes.js";
import {
  addItem,
  getWishlist,
  removeItem,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.use(protectRoutes);

router.get("/", getWishlist);
router.patch("/add", addItem);
router.patch("/remove", removeItem);

export default router;
