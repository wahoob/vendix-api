import express from "express";
import {
  createProduct,
  getAllProducts,
  getBrands,
  getDeals,
  getPriceRange,
  getProduct,
  getProductBySlug,
  isOwnerDeleteProduct,
  prepareBody,
  setVendorId,
} from "../controllers/productController.js";
import restrictTo from "../middleware/restrictTo.js";
import protectRoutes from "../middleware/protectRoutes.js";
import reviewRouter from "./reviewRoutes.js";
import { isOwnerUpdate } from "../controllers/handlerFactory.js";
import { validateCategory } from "../controllers/categoryController.js";

const router = express.Router({ mergeParams: true });

router.use("/:productId/reviews", reviewRouter);

router.get("/price-range", getPriceRange);
router.get("/brands", getBrands);
router.get("/deals", getDeals);
router.get("/slug/:slug", getProductBySlug);

router
  .route("/")
  .get(getAllProducts)
  .post(
    protectRoutes,
    restrictTo("vendor"),
    prepareBody,
    validateCategory,
    setVendorId,
    createProduct
  );

router
  .route("/:id")
  .get(getProduct)
  .patch(protectRoutes, validateCategory, isOwnerUpdate)
  .delete(protectRoutes, isOwnerDeleteProduct);

export default router;
