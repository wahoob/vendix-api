import express from "express";
import {
  forgotPassword,
  refreshToken,
  resendVerificationCode,
  resetPassword,
  signin,
  signup,
  updateEmail,
  updatePassword,
  verifyEmail,
} from "../controllers/authController.js";
import protectRoutes from "../middleware/protectRoutes.js";
import restrictTo from "../middleware/restrictTo.js";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  handleVendorRoleRequest,
  updateMe,
  updateUser,
  setUserId,
  requestVendorRole,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify/:code", verifyEmail);
router.post("/resendVerify", resendVerificationCode);
router.post("/login", signin);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);
router.get("/refresh", refreshToken);

// Authentication
router.use(protectRoutes);

router.post("/requestVendorRole", restrictTo("user"), requestVendorRole);
router.patch("/updatePassword", updatePassword);
router.patch("/updateEmail", updateEmail);

router
  .route("/me")
  .get(setUserId, getUser)
  .patch(updateMe)
  .delete(setUserId, deleteUser);

// Administration
router.use(restrictTo("admin"));

router.patch("/vendorRoleRequests/:userId", handleVendorRoleRequest);
router.route("/").get(getAllUsers).post(createUser);
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
