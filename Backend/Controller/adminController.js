import { User } from "../Models/User.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select(" -password -refreshToken");
  res.json(new ApiResponse(200, users, "Users list Fetched Successfully."));
});

const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    throw new ApiError(400, "Invalid Role");
  }

  // prevent admin from changing their own role
  if (req.params.id == req.user.id) {
    throw new ApiError(400, "Cannot change your own role.");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role: role } },
    { new: true },
  ).select(" -password -refreshToken");

  if (!user) throw new ApiError(404, "User not found.");

  res.json(new ApiResponse(200, user, "Role updated successfully."));
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(400, "Cannot delete your own account.");
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) throw new ApiError(404, "User not found.");

  res.json(new ApiResponse(200, user, "user deleted successfully."));
});

export { getAllUsers, updateRole, deleteUser };
