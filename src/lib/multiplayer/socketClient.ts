/**
 * Socket.IO Client Wrapper
 *
 * Provides a type-safe wrapper around Socket.IO client with:
 * - Automatic reconnection
 * - Event type safety
 * - Connection state management
 */

import { io, Socket } from 'socket.io-client';
import type {
  CreateRoomPayload,
  CreateRoomResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  RejoinRoomPayload,
  RejoinRoomResponse,
  GameMovePayload,
  MoveResultMessage,
  UseSkillPayload,
  Room,
  PlayerColor
} from '@/types/multiplayer';
import type { GameState, Move } from '@/types/game';

/**
 * Socket.IO client instance (singleton)
 */
let socket: Socket | null = null;

/**
 * Socket.IO server URL and path
 */
const SOCKET_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:3000';
const SOCKET_PATH = '/api/socket/io';

/**
 * Initialize Socket.IO client connection
 *
 * @returns Socket.IO client instance
 */
export function initializeSocket(): Socket {
  // If socket already exists, return it even if not connected
  // This prevents creating a new socket that would invalidate the server's socketToRoom mapping
  // Socket.IO will handle reconnection automatically
  if (socket) {
    // If socket exists but is disconnected, try to reconnect
    if (!socket.connected && !socket.disconnected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    path: SOCKET_PATH,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket', 'polling']
  });

  // Connection event listeners
  socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO server:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from Socket.IO server:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed after all attempts');
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Reconnected after ${attemptNumber} attempts`);
  });

  return socket;
}

/**
 * Get the current Socket.IO client instance
 *
 * @returns Socket.IO client instance or null if not initialized
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect Socket.IO client
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is currently connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

// ============================================================================
// Typed event emitters
// ============================================================================

/**
 * Create a new room
 */
export function createRoom(
  payload: CreateRoomPayload,
  callback: (response: CreateRoomResponse) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }

  sock.emit('room:create', payload, callback);
}

/**
 * Join an existing room
 */
export function joinRoom(
  payload: JoinRoomPayload,
  callback: (response: JoinRoomResponse) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, message: 'Socket not initialized' });
    return;
  }

  sock.emit('room:join', payload, callback);
}

/**
 * Rejoin a room after disconnection
 */
export function rejoinRoom(
  payload: RejoinRoomPayload,
  callback: (response: RejoinRoomResponse) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, message: 'Socket not initialized' });
    return;
  }

  sock.emit('room:rejoin', payload, callback);
}

/**
 * Make a move
 */
export function makeMove(
  payload: GameMovePayload,
  callback: (response: MoveResultMessage) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }

  sock.emit('game:move', payload, callback);
}

/**
 * Use a hero skill
 */
export function useSkill(
  payload: UseSkillPayload,
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }

  sock.emit('game:skill', payload, callback);
}

/**
 * Select a hero (multiplayer)
 */
export function selectHero(
  payload: { gameState: GameState },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }

  sock.emit('hero:select', payload, callback);
}

/**
 * Leave current room
 */
export function leaveRoom(roomId: string): void {
  const sock = getSocket();
  if (!sock) return;

  sock.emit('room:leave', { roomId });
}

/**
 * Request a draw
 */
export function requestDraw(
  payload: { roomId: string },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:draw:request', payload, callback);
}

/**
 * Respond to a draw request
 */
export function respondDraw(
  payload: { roomId: string; accept: boolean },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:draw:response', payload, callback);
}

/**
 * Request an undo
 */
export function requestUndo(
  payload: { roomId: string },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:undo:request', payload, callback);
}

/**
 * Respond to an undo request
 */
export function respondUndo(
  payload: { roomId: string; accept: boolean },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:undo:response', payload, callback);
}

/**
 * Surrender the game
 */
export function surrender(
  payload: { roomId: string },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:surrender', payload, callback);
}

/**
 * Request a game restart
 */
export function requestRestart(
  payload: { roomId: string },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:restart:request', payload, callback);
}

/**
 * Respond to a restart request
 */
export function respondRestart(
  payload: { roomId: string; accept: boolean },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:restart:response', payload, callback);
}

/**
 * Request to reselect hero
 */
export function requestReselect(
  payload: { roomId: string },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:reselect:request', payload, callback);
}

/**
 * Respond to a reselect request
 */
export function respondReselect(
  payload: { roomId: string; accept: boolean },
  callback: (response: { success: boolean; error?: string }) => void
): void {
  const sock = getSocket();
  if (!sock) {
    callback({ success: false, error: 'Socket not initialized' });
    return;
  }
  sock.emit('game:reselect:response', payload, callback);
}

// ============================================================================
// Typed event listeners
// ============================================================================

/**
 * Listen for draw requests
 */
export function onDrawRequested(
  callback: (data: { requestingPlayerId: string }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };
  sock.on('game:draw:request', callback);
  return () => sock.off('game:draw:request', callback);
}

/**
 * Listen for draw responses
 */
export function onDrawResponded(
  callback: (data: { accepted: boolean }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };
  sock.on('game:draw:response', callback);
  return () => sock.off('game:draw:response', callback);
}

/**
 * Listen for undo requests
 */
export function onUndoRequested(
  callback: (data: { requestingPlayerId: string }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };
  sock.on('game:undo:request', callback);
  return () => sock.off('game:undo:request', callback);
}

/**
 * Listen for undo responses
 */
export function onUndoResponded(
  callback: (data: { accepted: boolean }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };
  sock.on('game:undo:response', callback);
  return () => sock.off('game:undo:response', callback);
}

/**
 * Listen for restart requests
 */
export function onRestartRequested(
  callback: (data: { requestingPlayerId: string }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };
  sock.on('game:restart:request', callback);
  return () => sock.off('game:restart:request', callback);
}

/**
 * Listen for restart responses
 */
export function onRestartResponded(
  callback: (data: { accepted: boolean }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };
  sock.on('game:restart:response', callback);
  return () => sock.off('game:restart:response', callback);
}

/**
 * Listen for reselect requests
 */
export function onReselectRequested(
  callback: (data: { requestingPlayerId: string }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };
  sock.on('game:reselect:request', callback);
  return () => sock.off('game:reselect:request', callback);
}

/**
 * Listen for reselect responses
 */
export function onReselectResponded(
  callback: (data: { accepted: boolean }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };
  sock.on('game:reselect:response', callback);
  return () => sock.off('game:reselect:response', callback);
}

/**
 * Listen for room created event
 */
export function onRoomCreated(
  callback: (data: { room: Room; yourColor: PlayerColor; shareUrl: string }) => void
): void {
  const sock = getSocket();
  if (!sock) return;

  sock.on('room:created', callback);
}

/**
 * Listen for room joined event
 */
export function onRoomJoined(
  callback: (data: { room: Room; yourColor: PlayerColor }) => void
): void {
  const sock = getSocket();
  if (!sock) return;

  sock.on('room:joined', callback);
}

/**
 * Listen for game state updates
 * @returns Cleanup function to remove listener
 */
export function onGameStateUpdate(
  callback: (data: { gameState: GameState; lastMove?: Move }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };

  sock.on('game:state', callback);
  return () => sock.off('game:state', callback);
}

/**
 * Listen for player status updates
 * @returns Cleanup function to remove listener
 */
export function onPlayerStatus(
  callback: (data: {
    playerId: string;
    status: 'connected' | 'disconnected' | 'reconnected';
    displayName: string;
  }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };

  sock.on('player:status', callback);
  return () => sock.off('player:status', callback);
}

/**
 * Listen for game end event
 * @returns Cleanup function to remove listener
 */
export function onGameEnd(
  callback: (data: {
    result: 'checkmate' | 'stalemate' | 'forfeit' | 'timeout' | 'draw' | 'surrender';
    winner?: PlayerColor;
  }) => void
): () => void {
  const sock = getSocket();
  if (!sock) return () => { };

  sock.on('game:end', callback);
  return () => sock.off('game:end', callback);
}

/**
 * Listen for errors
 */
export function onError(callback: (error: { code: string; message: string }) => void): void {
  const sock = getSocket();
  if (!sock) return;

  sock.on('error', callback);
}

// ============================================================================
// Remove event listeners
// ============================================================================

/**
 * Remove all event listeners
 */
export function removeAllListeners(): void {
  const sock = getSocket();
  if (!sock) return;

  sock.removeAllListeners();
}

/**
 * Remove specific event listener
 */
export function removeListener(event: string, callback?: (...args: any[]) => void): void {
  const sock = getSocket();
  if (!sock) return;

  if (callback) {
    sock.off(event, callback);
  } else {
    sock.removeAllListeners(event);
  }
}
