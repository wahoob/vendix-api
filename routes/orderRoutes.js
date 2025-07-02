import express from "express";
import protectRoutes from "../middleware/protectRoutes.js";
import {
  getAllOrders,
  getMyOrders,
  isOwnerDeleteOrder,
  isOwnerGetOrder,
  prepareBody,
  protectOrderStatus,
  updateOrder,
} from "../controllers/orderController.js";
import restrictTo from "../middleware/restrictTo.js";

const router = express.Router();

// Authentication
router.use(protectRoutes);

router.get("/myOrders", getMyOrders);

router.patch(
  "/status/:id",
  restrictTo("delivery", "admin"),
  protectOrderStatus("delivered", "cancelled"),
  prepareBody,
  updateOrder
);

router.get("/", restrictTo("admin", "delivery"), getAllOrders);

// router
//   .route("/:id")
//   .get(isOwnerGetOrder)
//   .delete(
//     protectOrderStatus("shipped", "delivered", "cancelled"),
//     isOwnerDeleteOrder
//   );

router.route("/:id").get(isOwnerGetOrder);

export default router;
