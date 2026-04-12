import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser"

//routes import
import videoRoutes from "./Routes/videoRoutes.js";
import authRoutes from "./Routes/authRoutes.js";
import adminRoutes from "./Routes/adminRoutes.js";

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // vercel URL added later
].filter(Boolean);

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middlewares
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());

//routes declaration
app.use("/api/videos", videoRoutes(io));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

export { app, httpServer };
