const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const connectToDB = require("./config/db");
const { Server } = require("socket.io");
const http = require("http");
const Canvas = require("./models/canvasModel");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

const userRoutes = require("./routes/userRoutes");
const canvasRoutes = require("./routes/canvasRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (for keep-alive pings)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/canvas", canvasRoutes);

connectToDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
  },
});

let canvasData = {};         // In-memory cache of canvas elements
let saveTimers = {};         // Debounce timers for MongoDB writes

const SAVE_DELAY_MS = 3000;  // Save to DB 3 seconds after last drawing update

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinCanvas", async ({ canvasId }) => {
    console.log("Joining canvas:", canvasId);
    try {
      const authHeader = socket.handshake.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("No token provided.");
        setTimeout(() => {
          socket.emit("unauthorized", { message: "Access Denied: No Token" });
        }, 100);
        return;
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = decoded.userId;
      console.log("User ID:", userId);

      const canvas = await Canvas.findById(canvasId);
      if (
        !canvas ||
        (String(canvas.owner) !== String(userId) &&
          !canvas.shared.includes(userId))
      ) {
        console.log("Unauthorized access.");
        setTimeout(() => {
          socket.emit("unauthorized", {
            message: "You are not authorized to join this canvas.",
          });
        }, 100);
        return;
      }

      socket.join(canvasId);
      console.log(`User ${socket.id} joined canvas ${canvasId}`);

      if (canvasData[canvasId]) {
        //console.log(canvasData);
        socket.emit("loadCanvas", canvasData[canvasId]);
      } else {
        socket.emit("loadCanvas", canvas.elements);
      }
    } catch (error) {
      console.error(error);
      socket.emit("error", {
        message: "An error occurred while joining the canvas.",
      });
    }
  });

  socket.on("drawingUpdate", ({ canvasId, elements }) => {
    // Update in-memory cache (fast, for real-time sync)
    canvasData[canvasId] = elements;

    // Broadcast to other users immediately
    socket.to(canvasId).emit("receiveDrawingUpdate", elements);

    // Debounce the MongoDB write — only save 3 seconds after the last update
    // This prevents hundreds of DB writes per second during active drawing
    if (saveTimers[canvasId]) {
      clearTimeout(saveTimers[canvasId]);
    }
    saveTimers[canvasId] = setTimeout(async () => {
      try {
        await Canvas.findByIdAndUpdate(
          canvasId,
          { elements: canvasData[canvasId] },
          { new: true, useFindAndModify: false }
        );
        console.log(`Canvas ${canvasId} saved to DB`);
      } catch (error) {
        console.error("Error saving canvas to DB:", error);
      }
      delete saveTimers[canvasId];
    }, SAVE_DELAY_MS);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Clean up canvasData for rooms with no remaining users
    // This prevents the in-memory cache from growing forever
    for (const canvasId of Object.keys(canvasData)) {
      const room = io.sockets.adapter.rooms.get(canvasId);
      if (!room || room.size === 0) {
        // No one is in this canvas room anymore — flush to DB and free memory
        if (saveTimers[canvasId]) {
          clearTimeout(saveTimers[canvasId]);
          delete saveTimers[canvasId];
        }
        // Final save before cleanup
        Canvas.findByIdAndUpdate(
          canvasId,
          { elements: canvasData[canvasId] },
          { new: true, useFindAndModify: false }
        ).then(() => {
          console.log(`Canvas ${canvasId} saved and removed from memory`);
        }).catch((err) => {
          console.error("Error saving canvas on cleanup:", err);
        });
        delete canvasData[canvasId];
      }
    }
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
