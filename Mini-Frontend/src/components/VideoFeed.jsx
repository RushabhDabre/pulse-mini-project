import { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { API } from "../config";

export default function VideoFeed({
  videos,
  tab,
  onTabChange,
  user,
  token,
  onRefresh,
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [playVideo, setPlayVideo] = useState(null);

  function canEdit(video) {
    if (!user) return false;
    if (user.role === "admin") return true;
    return video.uploadedBy?._id === user.id || video.uploadedBy === user.id;
  }

  async function handleDelete(videoId) {
    if (!window.confirm("Delete this video?")) return;
    await fetch(`${API}/videos/${videoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  }

  function openEdit(video) {
    setEditVideo(video);
    setEditName(video.originalname);
    setEditDesc(video.description || "");
    setEditOpen(true);
  }

  async function handleEdit() {
    await fetch(`${API}/videos/${editVideo._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: editName, description: editDesc }),
    });
    setEditOpen(false);
    onRefresh();
  }

  function sensitivityColor(s) {
    if (s === "safe") return "success";
    if (s === "flagged") return "error";
    return "warning";
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => onTabChange(v)}>
          <Tab label="All Feed" value="all" />
          {user && <Tab label="My Feed" value="my" />}
        </Tabs>
      </Box>

      {videos.length === 0 && (
        <Typography color="text.secondary" textAlign="center" mt={6}>
          No videos found
        </Typography>
      )}

      <Grid container spacing={2}>
        {videos.map((v) => (
          <Grid item xs={12} sm={6} md={4} key={v._id}>
            <Card
              sx={{
                borderRadius: 1,
                bgcolor: "background.paper",
                border: "1px solid #2a2a2a",
                position: "relative",
                width: 217,
              }}
            >
              {/* Edit / Delete buttons on My Feed */}
              {canEdit(v) && (tab === "my" || user?.role === "admin") && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    display: "flex",
                    gap: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => openEdit(v)}
                    sx={{
                      bgcolor: "rgba(0,0,0,0.6)",
                      "&:hover": { bgcolor: "primary.main" },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(v._id)}
                    sx={{
                      bgcolor: "rgba(0,0,0,0.6)",
                      "&:hover": { bgcolor: "error.main" },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {/* Video Thumbnail / Player */}
              <Box
                sx={{
                  position: "relative",
                  bgcolor: "#111",
                  height: 180,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {v.thumbnailUrl ? (
                  <Box
                    component="img"
                    src={v.thumbnailUrl}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: v.status === "processing" ? 0.4 : 0.8,
                    }}
                  />
                ) : (
                  // fallback — dark background with video icon
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#1a1a2e",
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 48, color: "#333" }} />
                  </Box>
                )}

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {v.status === "processing" ? (
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="caption"
                        color="white"
                        display="block"
                      >
                        Processing...
                      </Typography>
                      <LinearProgress
                        sx={{ mt: 1, width: 80, borderRadius: 99 }}
                        variant={v.progress ? "determinate" : "indeterminate"}
                        value={v.progress || 0}
                      />
                    </Box>
                  ) : v.sensitivity === "flagged" && user?.role !== "admin" ? (
                    <Box sx={{ textAlign: "center", px: 1 }}>
                      <Typography
                        variant="caption"
                        color="error"
                        display="block"
                      >
                        ⚠ Flagged Content
                      </Typography>
                    </Box>
                  ) : (
                    <IconButton
                      onClick={() => setPlayVideo(v)}
                      sx={{
                        bgcolor: "rgba(108,99,255,0.8)",
                        "&:hover": { bgcolor: "primary.main" },
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 36 }} />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <CardContent sx={{ pb: "12px !important" }}>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  noWrap
                  title={v.originalname}
                >
                  {v.originalname}
                </Typography>
                {v.description && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {v.description}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {v.uploadedBy?.name || "Guest"}
                  </Typography>
                  <Chip
                    label={v.sensitivity || v.status}
                    size="small"
                    color={sensitivityColor(v.sensitivity)}
                    sx={{ fontSize: 10 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Video Player Dialog */}
      <Dialog
        open={!!playVideo}
        onClose={() => setPlayVideo(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: "#000" } }}
      >
        <DialogTitle sx={{ color: "white" }}>
          {playVideo?.originalname}
        </DialogTitle>
        <DialogContent>
          {playVideo && (
            <video
              controls
              preload="metadata"
              autoPlay
              style={{ width: "100%", borderRadius: 8 }}
              src={playVideo.videoUrl}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Edit Video</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            label="Video title"
            size="small"
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            label="Description"
            size="small"
            multiline
            rows={5}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
