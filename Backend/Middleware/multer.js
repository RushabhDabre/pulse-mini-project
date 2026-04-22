import multer from "multer";

// storage config
export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const videoFilter = (req, file, cb) => {
  if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) {
    return cb(new Error("Only video files allowed"), false);
  }
  if (file.fieldname === "thumbnail" && !file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files allowed for thumbnail"), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});
