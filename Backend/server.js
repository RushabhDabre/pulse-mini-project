require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL  // vercel URL added later
].filter(Boolean);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  // cors: { origin: "*" }
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// app.use(cors());
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

const videoRoutes = require("./Routes/videoRoutes");
const authRoutes = require("./Routes/authRoutes");
const adminRoutes = require("./Routes/adminRoutes");

app.use("/api/videos", videoRoutes(io));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    httpServer.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));
