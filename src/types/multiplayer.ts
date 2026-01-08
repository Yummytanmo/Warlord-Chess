/**
 * Multiplayer types for online chess functionality
 *
 * This file defines types for:
 * - Room management (Room, RoomStatus, PlayerSession)
 * - Network messages (NetworkMessage discriminated union)
 * - Socket.IO event payloads and responses
 */

import { GameState, Move, PlayerColor } from './game';

// Re-export types from game.ts for convenience
export type { GameState, Move, PlayerColor } from './game';

// ============================================================================
// Room Management Types
// ============================================================================

/**
 * Room lifecycle states
 */
export enum RoomStatus {
  WAITING = 'waiting',    // Created, waiting for second player
  ACTIVE = 'active',      // Both players joined, game in progress
  ENDED = 'ended'         // Game completed or abandoned
}

/**
 * Player connection and identity within a room
 */
export interface PlayerSession {
  /** Unique session identifier (persists across reconnections) */
  sessionId: string;

  /** Current Socket.IO connection ID (changes on reconnect) */
  socketId: string;

  /** Assigned chess color (determined when joining room) */
  color: PlayerColor;

  /** Optional display name (defaults to "Player 1"/"Player 2") */
  displayName: string;

  /** Unix timestamp when player joined room */
  joinedAt: number;

  /** Whether player is currently connected */
  isConnected: boolean;
}

/**
 * Optional room configuration (future extensibility)
 */
export interface RoomSettings {
  /** Time limit per player in seconds (0 = no limit) */
  timeLimit?: number;

  /** Allow spectators (future feature) */
  allowSpectators?: boolean;

  /** Require specific hero selections */
  restrictedHeroes?: string[];
}

/**
 * Main room entity stored on server
 */
export interface Room {
  /** Unique room identifier (UUIDv4) */
  id: string;

  /** Room lifecycle status */
  status: RoomStatus;

  /** Players in this room (max 2) */
  players: PlayerSession[];

  /** Current game state (reuses existing GameState type) */
  gameState: GameState;

  /** Unix timestamp when room was created */
  createdAt: number;

  /** Unix timestamp of last activity (move, skill use, chat) */
  lastActivityAt: number;

  /** Map of disconnected player IDs to disconnect timestamp */
  disconnectedPlayers: Map<string, number>;

  /** Optional display settings (future: time limits, rated, etc.) */
  settings?: RoomSettings;
}

// ============================================================================
// Network Message Types (Socket.IO Events)
// ============================================================================

/**
 * Base message interface
 */
interface BaseMessage {
  /** Message type discriminator */
  type: string;

  /** Unix timestamp when message was sent */
  timestamp: number;
}

/**
 * Client → Server: Create new room
 */
export interface CreateRoomMessage extends BaseMessage {
  type: 'room:create';
  sessionId: string;
  displayName?: string;
}

/**
 * Client → Server: Join existing room
 */
export interface JoinRoomMessage extends BaseMessage {
  type: 'room:join';
  roomId: string;
  sessionId: string;
  displayName?: string;
}

/**
 * Client → Server: Attempt to rejoin after disconnect
 */
export interface RejoinRoomMessage extends BaseMessage {
  type: 'room:rejoin';
  roomId: string;
  sessionId: string;
}

/**
 * Client → Server: Make a move
 */
export interface GameMoveMessage extends BaseMessage {
  type: 'game:move';
  move: Move;
  gameStateHash: string; // SHA-256 hash for optimistic concurrency control
}

/**
 * Client → Server: Use hero skill
 */
export interface UseSkillMessage extends BaseMessage {
  type: 'game:skill';
  skillId: string;
  targetPieceId?: string; // For targeted skills
}

/**
 * Server → Client: Room created successfully
 */
export interface RoomCreatedMessage extends BaseMessage {
  type: 'room:created';
  room: Room;
  yourColor: PlayerColor;
  shareUrl: string; // Full URL to share with opponent
}

/**
 * Server → Client: Successfully joined room
 */
export interface RoomJoinedMessage extends BaseMessage {
  type: 'room:joined';
  room: Room;
  yourColor: PlayerColor;
}

/**
 * Server → Client: Failed to join room
 */
export interface RoomJoinErrorMessage extends BaseMessage {
  type: 'room:join_error';
  reason: 'room_full' | 'room_not_found' | 'room_ended';
  message: string;
}

/**
 * Server → Client: Game state update (broadcast to room)
 */
export interface GameStateUpdateMessage extends BaseMessage {
  type: 'game:state';
  gameState: GameState; // Canonical server state
  lastMove?: Move;
}

/**
 * Server → Client: Move validation result (ack response)
 */
export interface MoveResultMessage {
  success: boolean;
  error?: string;
  correctState?: GameState; // Sent if client state diverged
}

/**
 * Server → Client: Opponent connected/disconnected
 */
export interface PlayerStatusMessage extends BaseMessage {
  type: 'player:status';
  playerId: string;
  status: 'connected' | 'disconnected' | 'reconnected';
  displayName: string;
}

/**
 * Server → Client: Game ended
 */
export interface GameEndMessage extends BaseMessage {
  type: 'game:end';
  result: 'checkmate' | 'stalemate' | 'forfeit' | 'timeout';
  winner?: PlayerColor;
}

/**
 * Union type for all network messages (enables exhaustive type checking)
 */
export type NetworkMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | RejoinRoomMessage
  | GameMoveMessage
  | UseSkillMessage
  | RoomCreatedMessage
  | RoomJoinedMessage
  | RoomJoinErrorMessage
  | GameStateUpdateMessage
  | PlayerStatusMessage
  | GameEndMessage;

// ============================================================================
// Socket.IO Event Payload Types
// ============================================================================

/**
 * Payload for room:create event
 */
export interface CreateRoomPayload {
  sessionId: string;
  displayName?: string;
}

/**
 * Response for room:create event
 */
export interface CreateRoomResponse {
  success: boolean;
  room?: Room;
  yourColor?: PlayerColor;
  shareUrl?: string;
  error?: string;
}

/**
 * Payload for room:join event
 */
export interface JoinRoomPayload {
  roomId: string;
  sessionId: string;
  displayName?: string;
}

/**
 * Response for room:join event
 */
export interface JoinRoomResponse {
  success: boolean;
  room?: Room;
  yourColor?: PlayerColor;
  error?: 'room_full' | 'room_not_found' | 'room_ended';
  message?: string;
}

/**
 * Payload for room:rejoin event
 */
export interface RejoinRoomPayload {
  roomId: string;
  sessionId: string;
}

/**
 * Response for room:rejoin event
 */
export interface RejoinRoomResponse {
  success: boolean;
  room?: Room;
  yourColor?: PlayerColor;
  gameState?: GameState;
  error?: 'room_not_found' | 'session_not_in_room' | 'room_ended';
  message?: string;
}

/**
 * Payload for game:move event
 */
export interface GameMovePayload {
  move: Move;
  gameState?: GameState; // Full game state to broadcast to other players
  gameStateHash: string;
}

/**
 * Payload for game:skill event
 */
export interface UseSkillPayload {
  skillId: string;
  gameState?: GameState; // Full game state after skill execution
  targetPieceId?: string;
}
