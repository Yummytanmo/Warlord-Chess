/**
 * Socket.IO Server Event Handlers
 *
 * Sets up all Socket.IO event handlers for multiplayer functionality:
 * - Connection/disconnection
 * - Room management (create, join, rejoin, leave)
 * - Game events (moves, skills)
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { roomManager } from './roomManager';
import type {
  CreateRoomPayload,
  CreateRoomResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  RejoinRoomPayload,
  RejoinRoomResponse,
  GameMovePayload,
  MoveResultMessage,
  UseSkillPayload
} from '@/types/multiplayer';

/**
 * Map of socket IDs to room IDs for quick lookup
 */
const socketToRoom = new Map<string, string>();

/**
 * Map of socket IDs to session IDs
 */
const socketToSession = new Map<string, string>();

/**
 * Setup all Socket.IO event handlers
 *
 * @param io - Socket.IO server instance
 */
export function setupSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle room creation
    socket.on(
      'room:create',
      (payload: CreateRoomPayload, callback: (response: CreateRoomResponse) => void) => {
        try {
          const { sessionId, displayName } = payload;

          // Create room
          const room = roomManager.createRoom(sessionId, displayName);

          // Store socket mappings
          socketToRoom.set(socket.id, room.id);
          socketToSession.set(socket.id, sessionId);

          // Join socket.io room
          socket.join(room.id);

          // Update player's socket ID
          const player = room.players.find((p) => p.sessionId === sessionId);
          if (player) {
            player.socketId = socket.id;
          }

          // Generate share URL
          const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}`;

          // Send response
          callback({
            success: true,
            room,
            yourColor: player!.color,
            shareUrl
          });

          console.log(`✅ Room created: ${room.id} by ${sessionId}`);
        } catch (error) {
          console.error('Error creating room:', error);
          callback({
            success: false,
            error: 'Failed to create room'
          });
        }
      }
    );

    // Handle room join
    socket.on(
      'room:join',
      (payload: JoinRoomPayload, callback: (response: JoinRoomResponse) => void) => {
        try {
          const { roomId, sessionId, displayName } = payload;

          // Join room with socket ID
          const result = roomManager.joinRoom(roomId, sessionId, socket.id, displayName);

          if (!result.success || !result.room) {
            callback({
              success: false,
              error: result.error as any,
              message: `Failed to join room: ${result.error}`
            });
            return;
          }

          const room = result.room;

          // Store socket mappings
          socketToRoom.set(socket.id, room.id);
          socketToSession.set(socket.id, sessionId);

          // Join socket.io room
          socket.join(room.id);

          // Player's socket ID is already set by joinRoom
          const player = room.players.find((p) => p.sessionId === sessionId);

          // Send response to joiner
          callback({
            success: true,
            room,
            yourColor: player!.color
          });

          // Broadcast player status to room
          socket.to(room.id).emit('player:status', {
            playerId: sessionId,
            status: 'connected',
            displayName: player!.displayName,
            timestamp: Date.now()
          });

          // If room is now active (2 players), broadcast game:state
          if (room.status === 'active') {
            io.to(room.id).emit('game:state', {
              gameState: room.gameState,
              timestamp: Date.now()
            });
          }

          console.log(`✅ Player ${sessionId} joined room: ${room.id}`);
        } catch (error) {
          console.error('Error joining room:', error);
          callback({
            success: false,
            message: 'Failed to join room'
          });
        }
      }
    );

    // Handle room rejoin (reconnection)
    socket.on(
      'room:rejoin',
      (payload: RejoinRoomPayload, callback: (response: RejoinRoomResponse) => void) => {
        try {
          const { roomId, sessionId } = payload;

          // Rejoin room with new socket ID
          const result = roomManager.rejoinRoom(roomId, sessionId, socket.id);

          if (!result.success || !result.room) {
            callback({
              success: false,
              error: result.error as any,
              message: `Failed to rejoin room: ${result.error}`
            });
            return;
          }

          const room = result.room;

          // Store socket mappings
          socketToRoom.set(socket.id, room.id);
          socketToSession.set(socket.id, sessionId);

          // Join socket.io room
          socket.join(room.id);

          // Player's socket ID is already set by rejoinRoom
          const player = room.players.find((p) => p.sessionId === sessionId);

          // Send response
          callback({
            success: true,
            room,
            yourColor: player!.color,
            gameState: room.gameState
          });

          // Broadcast reconnection to room
          socket.to(room.id).emit('player:status', {
            playerId: sessionId,
            status: 'reconnected',
            displayName: player!.displayName,
            timestamp: Date.now()
          });

          console.log(`✅ Player ${sessionId} rejoined room: ${room.id}`);
        } catch (error) {
          console.error('Error rejoining room:', error);
          callback({
            success: false,
            message: 'Failed to rejoin room'
          });
        }
      }
    );

    // Handle hero selection
    socket.on(
      'hero:select',
      (payload: { gameState: import('@/types/game').GameState }, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
          const roomId = socketToRoom.get(socket.id);
          if (!roomId) {
            callback({ success: false, error: 'Not in a room' });
            return;
          }

          const room = roomManager.getRoom(roomId);
          if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
          }

          // Update game state
          room.gameState = payload.gameState;
          room.lastActivityAt = Date.now();

          // Acknowledge first
          callback({ success: true });

          // Broadcast to EVERYONE in room (including sender) to ensure all clients have the updated state
          // This is important when the game phase changes from HERO_SELECTION to PLAYING
          io.to(roomId).emit('game:state', {
            gameState: room.gameState,
            timestamp: Date.now()
          });

          console.log(`✅ Hero selected in room: ${roomId}, Game Phase: ${room.gameState.gamePhase}`);
        } catch (error) {
          console.error('Error handling hero selection:', error);
          callback({ success: false, error: 'Failed to process hero selection' });
        }
      }
    );

    // Handle game moves
    socket.on(
      'game:move',
      (payload: GameMovePayload, callback: (response: MoveResultMessage) => void) => {
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

          const room = roomManager.getRoom(roomId);
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

          // Verify it's the player's turn
          if (room.gameState.currentPlayer !== player.color) {
            callback({
              success: false,
              error: 'Not your turn',
              correctState: room.gameState
            });
            return;
          }

          // Validate and execute move using GameManager
          const result = roomManager.executeMove(room.id, payload.move);

          if (!result.success) {
            callback({
              success: false,
              error: result.error?.message || 'Invalid move',
              correctState: room.gameState
            });
            return;
          }

          // Update activity timestamp
          roomManager.updateActivity(roomId);

          // Acknowledge move to sender
          callback({ success: true });

          // Broadcast new game state to entire room (INCLUDING sender initially to keep sync perfect, 
          // though client might have optimistic update. For consistency, client handles diff)
          // Actually, typical pattern is broadcast to room, sender gets acknowledgement.
          // BUT if we broadcast to room, sender gets it too if they are in room.
          // socket.to(roomId) sends to everyone EXCEPT sender.
          // io.to(roomId) sends to EVERYONE including sender.
          // Current implementation uses io.to(roomId).
          
          // Let's verify who sent the move.
          console.log(`📡 Broadcasting move in room ${roomId}. Sender: ${socket.id} (Color: ${player.color})`);

          // Broadcast new game state to everyone in room (including sender to ensure sync)
          io.to(roomId).emit('game:state', {
            gameState: room.gameState,
            lastMove: payload.move,
            timestamp: Date.now()
          });

          console.log(`✅ Move processed in room: ${roomId}`);
        } catch (error) {
          console.error('Error processing move:', error);
          callback({ success: false, error: 'Failed to process move' });
        }
      }
    );

    // Handle skill usage
    socket.on(
      'game:skill',
      (payload: UseSkillPayload, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
          const { skillId } = payload; // Extract skillId to avoid unused variable warning
          const roomId = socketToRoom.get(socket.id);
          if (!roomId) {
            callback({ success: false, error: 'Not in a room' });
            return;
          }

          const room = roomManager.getRoom(roomId);
          if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
          }

          // TODO: Validate and execute skill using skillEngine
          // For now, accept the skill usage
          // (This will be implemented in Phase 5 - US3)
          console.log(`Skill ${skillId} used in room: ${roomId}`);

          // Update activity timestamp
          roomManager.updateActivity(roomId);

          // Acknowledge skill usage
          callback({ success: true });

          // Broadcast updated game state to room
          io.to(roomId).emit('game:state', {
            gameState: room.gameState,
            timestamp: Date.now()
          });

          console.log(`✅ Skill used in room: ${roomId}`);
        } catch (error) {
          console.error('Error using skill:', error);
          callback({ success: false, error: 'Failed to use skill' });
        }
      }
    );

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);

      const roomId = socketToRoom.get(socket.id);
      const sessionId = socketToSession.get(socket.id);

      if (roomId && sessionId) {
        // Handle disconnect in room manager
        roomManager.handleDisconnect(roomId, sessionId);

        const room = roomManager.getRoom(roomId);
        if (room) {
          const player = room.players.find((p) => p.sessionId === sessionId);

          // Broadcast disconnect to room
          socket.to(roomId).emit('player:status', {
            playerId: sessionId,
            status: 'disconnected',
            displayName: player?.displayName || 'Player',
            timestamp: Date.now()
          });
        }
      }

      // Cleanup mappings
      socketToRoom.delete(socket.id);
      socketToSession.delete(socket.id);
    });
  });

  console.log('✅ Socket.IO event handlers initialized');
}
