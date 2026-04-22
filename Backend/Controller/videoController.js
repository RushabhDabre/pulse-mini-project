import { v2 as cloudinary } from "cloudinary";
import { Video } from "../Models/Video.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../Utils/cloudinary.js";
import { analyzeSensitivity } from "../Utils/analyzeSensitivity.js";

// GET all videos — public
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const filter = {};

  // search by title
  if (query) filter.originalname = { $regex: query, $options: "i" };

  // filter by user
  if (userId) filter.uploadedBy = userId;

  // only show completed videos to public
  // filter.status = "completed";

  const sortOrder = sortType === "asc" ? 1 : -1;

  const videos = await Video.find(filter)
    .populate("uploadedBy", "name email")
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Video.countDocuments(filter);

  res.json(
    new ApiResponse(
      200,
      {
        videos,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
      "Videos fetched successfully.",
    ),
  );
});

// GET single video by ID
const getVideoById = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).populate(
    "uploadedBy",
    "name email",
  );
  if (!video) throw new ApiError(404, "Video not found.");

  res.json(new ApiResponse(200, video, "Video fetched successfully."));
});

// UPLOAD / PUBLISH video
const uploadVideo = (io) =>
  asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title || !title.trim() || !description) {
      throw new ApiError(400, "Title and description are required.");
    }

    // get video file
    const videoFile = req.files?.video?.[0];
    if (!videoFile) throw new ApiError(400, "No video file provided.");

    // get thumbnail file (optional)
    const thumbnailFile = req.files?.thumbnail?.[0];

    // upload video to cloudinary
    const videoCloudinary = await uploadOnCloudinary(videoFile.path, "video");
    if (!videoCloudinary) throw new ApiError(500, "Failed to upload video.");

    // upload thumbnail to cloudinary if provided
    let thumbnailCloudinary = null;
    if (thumbnailFile) {
      thumbnailCloudinary = await uploadOnCloudinary(
        thumbnailFile.path,
        "image",
      );
    }

    const video = new Video({
      videoUrl: videoCloudinary.secure_url, // cloudinary URL
      publicId: videoCloudinary.public_id, // needed for deletion
      thumbnailUrl: thumbnailCloudinary?.secure_url || "",
      thumbnailPublicId: thumbnailCloudinary?.public_id || "",
      title: title.trim(),
      description: description || "",
      originalname: title.trim(),
      mimetype: req.files?.video?.[0].mimetype,
      size: videoCloudinary.bytes,
      duration: videoCloudinary.duration,
      uploadedBy: req.user.userId,
      isPublished: true,
    });

    await video.save();

    // emit socket progress
    io.emit("videoStatus", {
      videoId: video._id.toString(),
      status: "processing",
      sensitivity: "pending",
      progress: 0,
    });

    // respond immediately — analysis runs in background
    res.json(
      new ApiResponse(200, video, "Video uploaded. Processing started."),
    );

    // run real analysis in background
    (async () => {
      try {
        // emit progress updates while analyzing
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          io.emit("videoStatus", {
            videoId: video._id.toString(),
            status: "processing",
            sensitivity: "pending",
            progress: Math.min(progress, 80), // cap at 80 until analysis done
          });
          if (progress >= 80) clearInterval(interval);
        }, 1000);

        // analyze thumbnail — user uploaded or auto generated
        const analysis = await analyzeSensitivity(
          videoCloudinary.secure_url,
          thumbnailCloudinary?.secure_url || null, // pass user thumbnail if exists
        );

        clearInterval(interval);

        // if no user thumbnail, save the auto generated one
        video.thumbnailUrl = video.thumbnailUrl || analysis.thumbnailUrl || "";
        video.status = "completed";
        video.sensitivity = analysis.sensitivity;
        video.reason = analysis.reason;
        await video.save();

        io.emit("videoStatus", {
          videoId: video._id.toString(),
          status: "completed",
          sensitivity: analysis.sensitivity,
          reason: analysis.reason,
          thumbnailUrl: video.thumbnailUrl,
          progress: 100,
        });
      } catch (err) {
        console.error("Background analysis error:", err.message);
        console.error("Full error:", err);
        video.status = "completed";
        video.sensitivity = "safe";
        video.reason = "Analysis failed — marked safe by default";
        await video.save();
        io.emit("videoStatus", {
          videoId: video._id.toString(),
          status: "completed",
          sensitivity: "safe",
          progress: 100,
        });
      }
    })();
  });

// DELETE video
const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) throw new ApiError(404, "Video not found.");

  const isOwner =
    video.uploadedBy && video.uploadedBy.toString() === req.user.userId;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) throw new ApiError(403, "Not allowed.");

  if (video.publicId) {
    await deleteFromCloudinary(video.publicId, "video");
  }

  if (video.thumbnailPublicId) {
    await deleteFromCloudinary(video.thumbnailPublicId, "image");
  }

  await Video.findByIdAndDelete(req.params.id);

  res.json(new ApiResponse(200, null, "Video deleted successfully."));
});

// EDIT video — title, description
const editVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const video = await Video.findById(req.params.id);
  if (!video) throw new ApiError(404, "Video not found.");

  const isOwner =
    video.uploadedBy && video.uploadedBy.toString() === req.user.userId;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) throw new ApiError(403, "Not allowed.");

  if (title) video.originalname = title;
  if (title) video.title = title;
  if (description) video.description = description;

  await video.save();

  res.json(new ApiResponse(200, video, "Video updated successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) throw new ApiError(404, "Video not found.");

  const isOwner =
    video.uploadedBy && video.uploadedBy.toString() === req.user.userId;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) throw new ApiError(403, "Not allowed.");

  video.isPublished = !video.isPublished;
  await video.save();

  res.json(
    new ApiResponse(
      200,
      video,
      `Video ${video.isPublished ? "published" : "unpublished"} successfully.`,
    ),
  );
});

export {
  getAllVideos,
  getVideoById,
  uploadVideo,
  deleteVideo,
  editVideo,
  togglePublishStatus,
};
