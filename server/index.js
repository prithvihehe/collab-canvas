import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      // Add your Vercel domain here after deployment
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
  },
});

// In-memory storage for rooms
// Structure: { roomId: { lines: [], users: Set } }
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      lines: [],
      users: new Set(),
    });
  }
  return rooms.get(roomId);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  let currentRoom = null;

  // Join a room
  socket.on("join-room", (roomId) => {
    currentRoom = roomId;
    socket.join(roomId);

    const room = getRoom(roomId);
    room.users.add(socket.id);

    // Send existing canvas state to the new user
    socket.emit("canvas-state", room.lines);

    // Broadcast user count to all users in the room
    io.to(roomId).emit("user-count", room.users.size);

    console.log(`User ${socket.id} joined room ${roomId}. Users: ${room.users.size}`);
  });

  // Handle drawing - when a new line starts
  socket.on("draw-start", ({ roomId, line }) => {
    const room = getRoom(roomId);
    room.lines.push(line);

    // Broadcast to others in the room
    socket.to(roomId).emit("draw-start", line);
  });

  // Handle drawing - when a line is being drawn (points added)
  socket.on("draw-move", ({ roomId, lineIndex, points }) => {
    const room = getRoom(roomId);
    if (room.lines[lineIndex]) {
      room.lines[lineIndex].points = points;
    }

    // Broadcast to others in the room
    socket.to(roomId).emit("draw-move", { lineIndex, points });
  });

  // Handle clear canvas
  socket.on("clear-canvas", (roomId) => {
    const room = getRoom(roomId);
    room.lines = [];

    // Broadcast to all users in the room including sender
    io.to(roomId).emit("canvas-cleared");
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.users.delete(socket.id);
        io.to(currentRoom).emit("user-count", room.users.size);

        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(currentRoom);
        }

        console.log(`User ${socket.id} left room ${currentRoom}. Users: ${room.users.size}`);
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
