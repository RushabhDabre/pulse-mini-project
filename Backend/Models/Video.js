import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {
    videoUrl: {
      type: String, //cloudinary url
      required: true,
    },
    publicId: {
      type: String, //cloudinary url
    },
    thumbnailUrl: { type: String, default: "" }, // thumbnail URL
    thumbnailPublicId: { type: String, default: "" }, // for deletion
    title: { type: String, required: true },
    description: { type: String, default: "" },
    originalname: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    duration: { type: Number },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    sensitivity: {
      type: String,
      enum: ["pending", "safe", "flagged"],
      default: "pending",
    },
    isPublished: { type: Boolean, default: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

export const Video = mongoose.model("Video", videoSchema);
