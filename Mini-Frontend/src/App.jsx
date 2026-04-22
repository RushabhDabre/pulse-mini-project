import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { API, SOCKET_URL } from "./config";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import UploadSection from "./components/UploadSection";
import VideoFeed from "./components/VideoFeed";
import AdminPanel from "./components/AdminPanel";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"], // ✅ explicitly set
  reconnection: true,
  reconnectionAttempts: 5,
});

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    loadVideos();

    socket.on("videoStatus", (data) => {
      setVideos((prev) =>
        prev.map((v) => {
          const match = v._id.toString() === data.videoId.toString();
          return match
            ? {
                ...v,
                status: data.status,
                sensitivity: data.sensitivity,
                progress: data.progress,
                reason: data.reason || v.reason,
                thumbnailUrl: data.thumbnailUrl || v.thumbnailUrl,
              }
            : v;
        }),
      );
    });

    return () => socket.off("videoStatus");
  }, []);

  async function loadVideos() {
    try {
      const res = await fetch(`${API}/videos`, {
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      setVideos(data.data.videos.reverse());
    } catch (e) {
      console.error("Could not load videos", e);
    }
  }

  function handleLogin(userData, tokenData) {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenData);
    setAuthOpen(false);
  }

  function handleLogout() {
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setTab("all");
  }

  const filteredVideos = videos?.filter((v) =>
    v.originalname.toLowerCase().includes(search.toLowerCase()),
  );

  const myVideos = filteredVideos.filter(
    (v) => v.uploadedBy?._id === user?.id || v.uploadedBy === user?.id,
  );

  const displayedVideos = tab === "all" ? filteredVideos : myVideos;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar
        user={user}
        search={search}
        onSearch={setSearch}
        onLoginClick={() => setAuthOpen(true)}
        onAdminPanel={() => setAdminOpen(true)}
        onLogout={handleLogout}
      />

      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, pt: 2 }}>
        {user && <UploadSection token={token} onUploaded={loadVideos} />}

        <VideoFeed
          videos={displayedVideos}
          tab={tab}
          onTabChange={setTab}
          user={user}
          token={token}
          onRefresh={loadVideos}
        />
      </Box>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        API={API}
      />

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        token={token}
      />
    </Box>
  );
}
