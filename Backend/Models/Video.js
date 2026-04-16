import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudinary url
      required: true,
    },
    thumbnail: {
      type: String, //cloudinary url
      required: true,
    },
    title: { type: String, required: true },
    originalname: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    duration: { type: Number },
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const Video = mongoose.model("Video", videoSchema);
