import express from "express";
import {
  createCategory,
  getAllCategories,
  setQuery,
  updateCategory,
} from "../controllers/categoryController.js";
import protectRoutes from "../middleware/protectRoutes.js";
import restrictTo from "../middleware/restrictTo.js";

const router = express.Router();

router
  .route("/")
  .get(setQuery, getAllCategories)
  .post(protectRoutes, restrictTo("admin"), createCategory);

router.patch("/:id", protectRoutes, restrictTo("admin"), updateCategory);

export default router;
