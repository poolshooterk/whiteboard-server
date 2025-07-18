const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

app.get('/', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const drawingData = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (drawingData.has(roomId)) {
      socket.emit('canvas-state', drawingData.get(roomId));
    }
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('drawing', (data) => {
    const { roomId, drawData } = data;
    
    if (!drawingData.has(roomId)) {
      drawingData.set(roomId, []);
    }
    
    drawingData.get(roomId).push(drawData);
    
    socket.to(roomId).emit('drawing', drawData);
  });

  socket.on('clear-canvas', (roomId) => {
    drawingData.set(roomId, []);
    socket.to(roomId).emit('clear-canvas');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});