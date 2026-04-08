import { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Paper,
  TextField,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { API } from "../config";

export default function UploadSection({ token, onUploaded }) {
  const [file, setFile] = useState(null);
  const [videoName, setVideoName] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  function handleFile(e) {
    const selected = e.target.files[0];
    setVideoName(selected?.name.replace(/\.[^/.]+$/, "") || "");
    setFile(selected);
    setError("");
  }

  function uploadVideo() {
    if (!file) return;
    // if (!videoName.trim()) {
    //   setError("Please enter a video name.");
    //   return;
    // }
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("videoName", videoName);
    formData.append("video", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/videos/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      setFile(null);
      setVideoName("");
      setUploading(false);
      setProgress(0);
      inputRef.current.value = "";
      onUploaded();
    };

    xhr.onerror = () => {
      setError("Upload failed. Is server running?");
      setUploading(false);
    };

    xhr.send(formData);
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 3,
          width: "100%",
          maxWidth: 500,
          textAlign: "center",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={handleFile}
          id="upload-input"
        />

        <label htmlFor="upload-input">
          <Button
            component="span"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            Choose Video
          </Button>
        </label>

        {file && (
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ mb: 1 }}
          >
            {file.name}
          </Typography>
        )}

        {/*{file && (
          <TextField
            fullWidth
            label="Video Name"
            value={videoName}
            onChange={(e) => setVideoName(e.target.value)}
            size="small"
            sx={{ mb: 1.5 }}
            placeholder="Enter a name for your video"
          />
        )}*/}

        {file && (
          <Button
            variant="contained"
            fullWidth
            onClick={uploadVideo}
            disabled={uploading}
            sx={{ borderRadius: 2 }}
          >
            {uploading ? `Uploading ${progress}%` : "Upload Now"}
          </Button>
        )}

        {uploading && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 1.5, borderRadius: 99 }}
          />
        )}

        {error && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: "block" }}
          >
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
