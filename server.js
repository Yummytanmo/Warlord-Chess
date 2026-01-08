/**
 * Custom Next.js server with Socket.IO support
 *
 * This file creates a custom HTTP server that:
 * 1. Handles Next.js requests
 * 2. Runs Socket.IO for real-time multiplayer functionality
 *
 * Usage:
 *   Development: node server.js
 *   Production: NODE_ENV=production node server.js
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Create Socket.IO server
  const io = new Server(httpServer, {
    path: '/api/socket/io',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Setup Socket.IO event handlers directly
  // We'll implement the handlers here to avoid TypeScript import issues
  const rooms = new Map();
  const socketToRoom = new Map();
  const socketToSession = new Map();

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle room creation
    socket.on('room:create', (payload, callback) => {
      try {
        const { sessionId, displayName } = payload;
        const roomId = generateUUID();
        const now = Date.now();

        const room = {
          id: roomId,
          status: 'waiting',
          players: [{
            sessionId,
            socketId: socket.id,
            color: 'red',
            displayName: displayName || 'Player 1',
            joinedAt: now,
            isConnected: true
          }],
          gameState: null,
          createdAt: now,
          lastActivityAt: now
        };

        rooms.set(roomId, room);
        socketToRoom.set(socket.id, roomId);
        socketToSession.set(socket.id, sessionId);
        socket.join(roomId);

        const shareUrl = `http://localhost:${port}/room/${roomId}`;

        callback({
          success: true,
          room,
          yourColor: 'red',
          shareUrl
        });

        console.log(`✅ Room created: ${roomId} by ${sessionId}`);
      } catch (error) {
        console.error('Error creating room:', error);
        callback({
          success: false,
          error: 'Failed to create room'
        });
      }
    });

    // Handle room join
    socket.on('room:join', (payload, callback) => {
      try {
        const { roomId, sessionId, displayName } = payload;
        const room = rooms.get(roomId);

        if (!room) {
          callback({
            success: false,
            error: 'room_not_found',
            message: 'Room not found'
          });
          return;
        }

        if (room.status === 'ended') {
          callback({
            success: false,
            error: 'room_ended',
            message: 'Room has ended'
          });
          return;
        }

        // Check if player already in room
        const existingPlayer = room.players.find(p => p.sessionId === sessionId);
        if (existingPlayer) {
          existingPlayer.isConnected = true;
          existingPlayer.socketId = socket.id;
          socketToRoom.set(socket.id, roomId);
          socketToSession.set(socket.id, sessionId);
          socket.join(roomId);

          callback({
            success: true,
            room,
            yourColor: existingPlayer.color
          });
          return;
        }

        if (room.players.length >= 2) {
          callback({
            success: false,
            error: 'room_full',
            message: 'Room is full'
          });
          return;
        }

        // Add new player
        const player = {
          sessionId,
          socketId: socket.id,
          color: 'black',
          displayName: displayName || 'Player 2',
          joinedAt: Date.now(),
          isConnected: true
        };

        room.players.push(player);
        room.status = 'active';
        room.lastActivityAt = Date.now();

        socketToRoom.set(socket.id, roomId);
        socketToSession.set(socket.id, sessionId);
        socket.join(roomId);

        callback({
          success: true,
          room,
          yourColor: 'black'
        });

        // Broadcast player status to other players in room
        socket.to(roomId).emit('player:status', {
          playerId: sessionId,
          status: 'connected',
          displayName: player.displayName,
          timestamp: Date.now()
        });

        // Broadcast room update to other players (mainly the host)
        // This updates the room state so they know the game can start
        socket.to(roomId).emit('room:update', {
          room
        });

        console.log(`✅ Player ${sessionId} joined room: ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        callback({
          success: false,
          message: 'Failed to join room'
        });
      }
    });

    // Handle game initialization
    socket.on('game:init', (payload) => {
      try {
        const { roomId, gameState } = payload;
        const room = rooms.get(roomId);

        if (!room) {
          console.error('Room not found for game:init:', roomId);
          return;
        }

        // Set the game state
        room.gameState = gameState;
        room.lastActivityAt = Date.now();

        // Broadcast game state to entire room
        io.to(roomId).emit('game:state', {
          gameState,
          timestamp: Date.now()
        });

        console.log(`✅ Game initialized in room: ${roomId}`);
      } catch (error) {
        console.error('Error initializing game:', error);
      }
    });

    // Handle game moves
    socket.on('game:move', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        const sessionId = socketToSession.get(socket.id);

        if (!roomId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        if (!sessionId) {
          callback({ success: false, error: 'Session not found' });
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Verify player is in the room
        const player = room.players.find(p => p.sessionId === sessionId);
        if (!player) {
          callback({ success: false, error: 'Player not in room' });
          return;
        }

        // Update room activity
        room.lastActivityAt = Date.now();

        // Acknowledge move to sender
        callback({ success: true });

        // Broadcast move to entire room (including sender for sync)
        io.to(roomId).emit('game:state', {
          gameState: payload.gameState || {},
          lastMove: payload.move,
          timestamp: Date.now()
        });

        console.log(`✅ Move processed in room: ${roomId}`);
      } catch (error) {
        console.error('Error processing move:', error);
        callback({ success: false, error: 'Failed to process move' });
      }
    });

    // Handle skill usage
    socket.on('game:skill', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        if (!roomId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Update activity
        room.lastActivityAt = Date.now();

        // Acknowledge skill usage
        callback({ success: true });

        // Broadcast updated game state to room
        io.to(roomId).emit('game:state', {
          gameState: payload.gameState || {},
          timestamp: Date.now()
        });

        console.log(`✅ Skill used in room: ${roomId}`);
      } catch (error) {
        console.error('Error using skill:', error);
        callback({ success: false, error: 'Failed to use skill' });
      }
    });

    // Handle hero selection
    socket.on('hero:select', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        const sessionId = socketToSession.get(socket.id);

        if (!roomId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        if (!sessionId) {
          callback({ success: false, error: 'Session not found' });
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Verify player is in the room
        const player = room.players.find(p => p.sessionId === sessionId);
        if (!player) {
          callback({ success: false, error: 'Player not in room' });
          return;
        }

        // Update room activity
        room.lastActivityAt = Date.now();

        // Acknowledge selection to sender
        callback({ success: true });

        // Broadcast updated game state to entire room
        io.to(roomId).emit('game:state', {
          gameState: payload.gameState || {},
          timestamp: Date.now()
        });

        console.log(`✅ Hero selected in room: ${roomId} by ${sessionId}`);
      } catch (error) {
        console.error('Error selecting hero:', error);
        callback({ success: false, error: 'Failed to select hero' });
      }
    });

    // Handle game end
    socket.on('game:end', (payload) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        // Update room status
        room.status = 'ended';
        room.lastActivityAt = Date.now();

        // Broadcast game end to entire room
        io.to(roomId).emit('game:end', {
          result: payload.result,
          winner: payload.winner,
          timestamp: Date.now()
        });

        console.log(`🏁 Game ended in room: ${roomId}`);
      } catch (error) {
        console.error('Error ending game:', error);
      }
    });

    // Handle draw request
    socket.on('game:draw:request', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        const sessionId = socketToSession.get(socket.id);
        if (!roomId || !sessionId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        callback({ success: true });

        // Broadcast draw request to other player
        socket.to(roomId).emit('game:draw:request', {
          requestingPlayerId: sessionId
        });

        console.log(`🤝 Draw requested in room: ${roomId}`);
      } catch (error) {
        console.error('Error requesting draw:', error);
        callback({ success: false, error: 'Failed to request draw' });
      }
    });

    // Handle draw response
    socket.on('game:draw:response', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        if (!roomId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        callback({ success: true });

        // Broadcast response to requester
        socket.to(roomId).emit('game:draw:response', {
          accepted: payload.accept
        });

        // If accepted, end the game
        if (payload.accept) {
          room.status = 'ended';
          io.to(roomId).emit('game:end', {
            result: 'draw',
            timestamp: Date.now()
          });
        }

        console.log(`🤝 Draw ${payload.accept ? 'accepted' : 'rejected'} in room: ${roomId}`);
      } catch (error) {
        console.error('Error responding to draw:', error);
        callback({ success: false, error: 'Failed to respond to draw' });
      }
    });

    // Handle undo request
    socket.on('game:undo:request', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        const sessionId = socketToSession.get(socket.id);
        if (!roomId || !sessionId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        callback({ success: true });

        // Broadcast undo request to other player
        socket.to(roomId).emit('game:undo:request', {
          requestingPlayerId: sessionId
        });

        console.log(`↩️ Undo requested in room: ${roomId}`);
      } catch (error) {
        console.error('Error requesting undo:', error);
        callback({ success: false, error: 'Failed to request undo' });
      }
    });

    // Handle undo response
    socket.on('game:undo:response', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        if (!roomId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        callback({ success: true });

        // Broadcast response to requester
        socket.to(roomId).emit('game:undo:response', {
          accepted: payload.accept
        });

        console.log(`↩️ Undo ${payload.accept ? 'accepted' : 'rejected'} in room: ${roomId}`);
      } catch (error) {
        console.error('Error responding to undo:', error);
        callback({ success: false, error: 'Failed to respond to undo' });
      }
    });

    // Handle surrender
    socket.on('game:surrender', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        const sessionId = socketToSession.get(socket.id);
        if (!roomId || !sessionId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Find surrendering player's color
        const player = room.players.find(p => p.sessionId === sessionId);
        const winner = player?.color === 'red' ? 'black' : 'red';

        room.status = 'ended';

        callback({ success: true });

        // Broadcast game end with surrender result
        io.to(roomId).emit('game:end', {
          result: 'surrender',
          winner,
          timestamp: Date.now()
        });

        console.log(`🏳️ Surrender in room: ${roomId}, winner: ${winner}`);
      } catch (error) {
        console.error('Error surrendering:', error);
        callback({ success: false, error: 'Failed to surrender' });
      }
    });

    // Handle restart request
    socket.on('game:restart:request', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        const sessionId = socketToSession.get(socket.id);
        if (!roomId || !sessionId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        callback({ success: true });

        // Broadcast request to other player
        socket.to(roomId).emit('game:restart:request', {
          requestingPlayerId: sessionId
        });

        console.log(`🔄 Restart requested in room: ${roomId}`);
      } catch (error) {
        console.error('Error requesting restart:', error);
        callback({ success: false, error: 'Failed to request restart' });
      }
    });

    // Handle restart response
    socket.on('game:restart:response', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        if (!roomId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        callback({ success: true });

        // Broadcast response to requester
        socket.to(roomId).emit('game:restart:response', {
          accepted: payload.accept
        });

        console.log(`🔄 Restart ${payload.accept ? 'accepted' : 'rejected'} in room: ${roomId}`);
      } catch (error) {
        console.error('Error responding to restart:', error);
        callback({ success: false, error: 'Failed to respond to restart' });
      }
    });

    // Handle reselect request
    socket.on('game:reselect:request', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        const sessionId = socketToSession.get(socket.id);
        if (!roomId || !sessionId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        callback({ success: true });

        // Broadcast request to other player
        socket.to(roomId).emit('game:reselect:request', {
          requestingPlayerId: sessionId
        });

        console.log(`👥 Reselect requested in room: ${roomId}`);
      } catch (error) {
        console.error('Error requesting reselect:', error);
        callback({ success: false, error: 'Failed to request reselect' });
      }
    });

    // Handle reselect response
    socket.on('game:reselect:response', (payload, callback) => {
      try {
        const roomId = socketToRoom.get(socket.id);
        if (!roomId) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        callback({ success: true });

        // Broadcast response to requester
        socket.to(roomId).emit('game:reselect:response', {
          accepted: payload.accept
        });

        console.log(`👥 Reselect ${payload.accept ? 'accepted' : 'rejected'} in room: ${roomId}`);
      } catch (error) {
        console.error('Error responding to reselect:', error);
        callback({ success: false, error: 'Failed to respond to reselect' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);

      const roomId = socketToRoom.get(socket.id);
      const sessionId = socketToSession.get(socket.id);

      if (roomId && sessionId) {
        const room = rooms.get(roomId);
        if (room) {
          const player = room.players.find(p => p.sessionId === sessionId);
          if (player) {
            player.isConnected = false;

            socket.to(roomId).emit('player:status', {
              playerId: sessionId,
              status: 'disconnected',
              displayName: player.displayName,
              timestamp: Date.now()
            });
          }
        }
      }

      socketToRoom.delete(socket.id);
      socketToSession.delete(socket.id);
    });
  });

  // Start server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server ready at /api/socket/io`);
  });
});
