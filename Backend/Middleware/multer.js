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

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/"))
      return cb(new Error("Only Video files allowed"), false);
    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});
