import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
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
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Video", videoSchema);
