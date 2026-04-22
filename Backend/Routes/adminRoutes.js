import express from "express";
import { authenticate, isAdmin } from "../Middleware/auth.js";
import {
  deleteUser,
  getAllUsers,
  updateRole,
} from "../Controller/adminController.js";

const router = express.Router();

router.route("/users").get(authenticate, isAdmin, getAllUsers);
router.route("/users/:id/role").put(authenticate, isAdmin, updateRole);
router.route("/users/:id").delete(authenticate, isAdmin, deleteUser);

export default router;
