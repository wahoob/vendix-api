import express from "express";
import protectRoutes from "../middleware/protectRoutes.js";
import restrictTo from "../middleware/restrictTo.js";
import {
  canUserLeaveReview,
  createReview,
  getAllReviews,
  getReview,
  isOwnerDeleteReview,
  isOwnerUpdateReview,
  prepareUpdateBody,
  setProductUserId,
} from "../controllers/reviewController.js";
import { validateProduct } from "../controllers/productController.js";
import { checkUserPurchase } from "../controllers/invoiceController.js";

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getAllReviews)
  .post(
    protectRoutes,
    setProductUserId,
    restrictTo("user", "vendor"),
    validateProduct,
    checkUserPurchase,
    createReview
  );

router.get(
  "/can-review/:id",
  protectRoutes,
  restrictTo("user", "vendor"),
  canUserLeaveReview
);

router
  .route("/:id")
  .get(getReview)
  .patch(protectRoutes, prepareUpdateBody, isOwnerUpdateReview)
  .delete(protectRoutes, isOwnerDeleteReview);

export default router;
