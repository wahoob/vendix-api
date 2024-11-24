import express from "express";
import protectRoutes from "../middleware/protectRoutes.js";
import { addItem, removeItem } from "../controllers/wishlistController.js";
import restrictTo from "../middleware/restrictTo.js";

const router = express.Router();

router.use(protectRoutes);
router.use(restrictTo("user", "vendor"));

router.patch("/add", addItem);
router.patch("/remove", removeItem);

export default router;
