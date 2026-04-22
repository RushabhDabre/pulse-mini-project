import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
} from "../Controller/userController.js";
import { authenticate } from "../Middleware/auth.js";

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/logout").post(authenticate, logoutUser);
router.route("/change-password").post(authenticate, changeCurrentPassword);
router.route("/current-user").get(authenticate, getCurrentUser);
router.route("/update-account").patch(authenticate, updateAccountDetails);

export default router;
