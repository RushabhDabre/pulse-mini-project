const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Video = require("../Models/Video");
const { authenticate, isAdmin } = require("../Middleware/auth");

module.exports = (io) => {
  const router = express.Router();

  // storage config
  const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("video/"))
        return cb(new Error("Only video files allowed"), false);
      cb(null, true);
    },
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  });

  // GET all videos — public (guests can watch)
  router.get("/", async (req, res) => {
    try {
      const videos = await Video.find().populate("uploadedBy", "name email");
      res.json(videos);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // upload API
  router.post(
    "/upload",
    authenticate,
    upload.single("video"),
    async (req, res) => {
      try {
        const video = new Video({
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          uploadedBy: req.user.userId,
        });

        await video.save();

        io.emit("videoStatus", {
          videoId: video._id,
          status: "processing",
          sensitivity: "pending",
          progress: 0,
        });

        // Simulate processing with progress updates
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          io.emit("videoStatus", {
            videoId: video._id,
            status: "processing",
            sensitivity: "pending",
            progress,
          });

          if (progress >= 100) {
            clearInterval(interval);
          }
        }, 1000);

        setTimeout(async () => {
          video.status = "completed";
          video.sensitivity = Math.random() > 0.3 ? "safe" : "flagged";
          await video.save();

          io.emit("videoStatus", {
            videoId: video._id,
            status: "completed",
            sensitivity: video.sensitivity,
            progress: 100,
          });
        }, 6000);

        res.json(video);
      } catch (err) {
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  // ─── STREAM ──────────────────────────────────────────────
  router.get("/stream/:id", async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);
      if (!video) return res.status(404).json({ message: "Video not found" });

      const videoPath = path.resolve("uploads", video.filename);
      if (!fs.existsSync(videoPath))
        return res.status(404).json({ message: "File not found on server" });

      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": video.mimetype || "video/mp4",
        });

        fs.createReadStream(videoPath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": video.mimetype || "video/mp4",
        });

        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (err) {
      res.status(500).json({ message: "Streaming error", error: err.message });
    }
  });

  // DELETE own video — logged in users only
  router.delete("/:id", authenticate, async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
    
      // handle null uploadedBy
      const isOwner = video.uploadedBy && video.uploadedBy.toString() === req.user.userId;
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Not allowed" });
      }

      // admin can delete any, user can delete only own
      if (
        video.uploadedBy.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not allowed" });
      }

      await Video.findByIdAndDelete(req.params.id);
      res.json({ message: "Video deleted" });
    } catch (err) {
      console.error("DELETE ERROR:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  });

  // EDIT own video name — logged in users only
  router.put("/:id", authenticate, async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // admin can edit any, user can edit only own
      if (
        video.uploadedBy.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not allowed" });
      }

      video.originalname = req.body.originalname || video.originalname;
      await video.save();

      res.json(video);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });
  return router;
};
