import express from "express";
import { authenticate } from "../Middleware/auth.js";
import { upload } from "../Middleware/multer.js";
import {
  getAllVideos,
  getVideoById,
  uploadVideo,
  deleteVideo,
  editVideo,
  togglePublishStatus,
} from "../Controller/videoController.js";

export default (io) => {
  const router = express.Router();

  router.use((req, res, next) => {
    req.io = io;
    next();
  });

  router.route("/").get(getAllVideos);
  router.route("/upload").post(
    authenticate,
    upload.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 }, // optional
    ]),
    uploadVideo(io),
  );
  router.route("/:id").get(getVideoById);
  router.route("/:id").put(authenticate, editVideo);
  router.route("/:id").delete(authenticate, deleteVideo);
  router.route("/toggle/:id").patch(authenticate, togglePublishStatus);
  return router;
};
