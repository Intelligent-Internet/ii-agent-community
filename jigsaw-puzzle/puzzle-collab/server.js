// Standalone Socket.IO server for the puzzle game
const { createServer } = require('http');
const { Server } = require('socket.io');

// Simple in-memory storage for rooms
const rooms = new Map();

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

console.log('Starting Socket.IO server...');

// Socket event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle joining a room
  socket.on('join_room', ({ roomId, playerId, playerName }) => {
    console.log(`Player ${playerName} (${playerId}) joining room ${roomId}`);
    
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.data.playerName = playerName;
    
    // Get or create room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: new Map(),
        connectedPlayers: new Set()
      });
    }
    
    const room = rooms.get(roomId);
    room.players.set(playerId, { id: playerId, name: playerName, connected: true });
    room.connectedPlayers.add(playerId);
    
    // Notify client of successful connection
    socket.emit('connected', { playerId, roomId });
    
    // Notify other players in the room
    socket.to(roomId).emit('player_joined', { 
      player: { id: playerId, name: playerName, connected: true }
    });
    
    // Send current room state to the new player
    const players = Array.from(room.players.values());
    socket.emit('room_state', { players });
    
    console.log(`Room ${roomId} now has ${room.connectedPlayers.size} players`);
  });

  // Handle piece movement
  socket.on('piece_move', (data) => {
    const { roomId } = socket.data;
    if (!roomId) return;

    console.log(`Piece move in room ${roomId}:`, data);
    
    // Broadcast to other players in the room
    socket.to(roomId).emit('piece_moved', {
      pieceId: data.pieceId,
      x: data.x,
      y: data.y,
      playerId: data.playerId,
    });
  });

  // Handle piece pickup
  socket.on('piece_pickup', (data) => {
    const { roomId } = socket.data;
    if (!roomId) return;

    console.log(`Piece pickup in room ${roomId}:`, data);
    
    socket.to(roomId).emit('piece_locked', {
      pieceId: data.pieceId,
      lockedBy: data.playerId,
    });
  });

  // Handle piece drop
  socket.on('piece_drop', (data) => {
    const { roomId } = socket.data;
    if (!roomId) return;

    console.log(`Piece drop in room ${roomId}:`, data);
    
    socket.to(roomId).emit('piece_unlocked', {
      pieceId: data.pieceId,
    });
  });

  // Handle cursor movement
  socket.on('cursor_move', (data) => {
    const { roomId, playerName } = socket.data;
    if (!roomId) return;

    // Broadcast cursor position to other players
    socket.to(roomId).emit('cursor_update', {
      x: data.x,
      y: data.y,
      playerId: data.playerId,
      playerName: playerName,
    });
  });

  // Handle test connection
  socket.on('test_connection', () => {
    console.log('Test connection received from:', socket.id);
    socket.emit('test_response', { success: true, socketId: socket.id });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const { roomId, playerId, playerName } = socket.data;
    if (roomId && playerId) {
      const room = rooms.get(roomId);
      if (room) {
        room.connectedPlayers.delete(playerId);
        if (room.players.has(playerId)) {
          room.players.get(playerId).connected = false;
        }
        
        // Notify other players
        socket.to(roomId).emit('player_left', { playerId });
        
        console.log(`Player ${playerName} (${playerId}) left room ${roomId}`);
        console.log(`Room ${roomId} now has ${room.connectedPlayers.size} players`);
      }
    }
  });
});

// Start the server
const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});