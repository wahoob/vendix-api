import express from "express";
import {
  forgotPassword,
  logout,
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
  addAddress,
  updateAddress,
  removeAddress,
} from "../controllers/userController.js";
import { uploadSingle } from "../middleware/fileUpload.js";
import handleImageUpload from "../middleware/handleImageUpload.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify/:code", verifyEmail);
router.post("/resendVerify", resendVerificationCode);
router.post("/login", signin);
router.post("/forgotPassword", forgotPassword);
router.post("/logout", logout);
router.patch("/resetPassword/:token", resetPassword);
router.get("/refresh", refreshToken);

// Authentication
router.use(protectRoutes);

router.post("/requestVendorRole", restrictTo("user"), requestVendorRole);
router.patch("/updatePassword", updatePassword);
router.patch("/updateEmail", updateEmail);

// router
//   .route("/me")
//   .get(setUserId, getUser)
//   .patch(uploadSingle("image"), handleImageUpload("profile-pictures"), updateMe)
//   .delete(setUserId, deleteUser);
router
  .route("/me")
  .get(setUserId, getUser)
  .patch(
    uploadSingle("image"),
    handleImageUpload("profile-pictures"),
    updateMe
  );

router.patch("/addAddress", addAddress);
router.patch("/updateAddress", updateAddress);
router.patch("/removeAddress", removeAddress);

// Administration
router.use(restrictTo("admin"));

router.patch("/vendorRoleRequests/:userId", handleVendorRoleRequest);
router.route("/").get(getAllUsers).post(createUser);
// router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);
router.route("/:id").get(getUser).patch(updateUser);

export default router;
