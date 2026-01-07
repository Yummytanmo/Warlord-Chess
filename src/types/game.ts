// 基础游戏实体类型定义

export interface Position {
  x: number;
  y: number;
}

export enum PieceType {
  KING = 'king',      // 将
  ADVISOR = 'advisor', // 士
  ELEPHANT = 'elephant', // 象
  HORSE = 'horse',    // 马
  CHARIOT = 'chariot', // 车
  CANNON = 'cannon',  // 炮
  PAWN = 'pawn'       // 兵
}

export enum PlayerColor {
  RED = 'red',
  BLACK = 'black'
}

export interface Piece {
  id: string;
  type: PieceType;
  color: PlayerColor;
  position: Position;
  isAlive: boolean;
}

export interface Player {
  id: string;
  color: PlayerColor;
  hero: Hero;
  pieces: Piece[];
}

// 武将系统类型定义
export interface Hero {
  id: string;
  name: string;
  skills: Skill[];
  awakened: boolean;
}

export enum SkillType {
  PASSIVE = 'passive',    // 被动技能
  ACTIVE = 'active',      // 主动技能
  LIMITED = 'limited',    // 限定技
  AWAKENING = 'awakening' // 觉醒技
}

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  isUsed: boolean;
  canUse(): boolean;
  execute(context: GameContext): SkillResult;
}

export interface GameContext {
  gameState: GameState;
  piece?: Piece;
  move?: Move;
  player?: Player;
}

export interface SkillResult {
  success: boolean;
  modifiedMove?: Move;
  gameStateChanges?: Partial<GameState>;
  message?: string;
}

// 游戏状态类型定义
export enum GamePhase {
  HERO_SELECTION = 'hero_selection',
  PLAYING = 'playing',
  GAME_OVER = 'game_over'
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  timestamp: number;
}

export interface GameState {
  board: Board;
  players: [Player, Player];
  currentPlayer: PlayerColor;
  gamePhase: GamePhase;
  moveHistory: Move[];
  winner?: PlayerColor;
}

// 棋盘类型定义
export interface Board {
  grid: (Piece | null)[][];
  readonly BOARD_SIZE: { width: number; height: number };
  getPiece(position: Position): Piece | null;
  setPiece(position: Position, piece: Piece | null): void;
  isValidPosition(position: Position): boolean;
  isInPalace(position: Position, color: PlayerColor): boolean;
  hasRiverCrossed(position: Position, color: PlayerColor): boolean;
}

// 移动验证相关类型
export interface MoveValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface MoveValidator {
  validateMove(move: Move, gameState: GameState): MoveValidationResult;
}

// 错误处理类型
export enum GameErrorType {
  INVALID_MOVE = "invalid_move",
  SKILL_NOT_AVAILABLE = "skill_not_available",
  GAME_STATE_INVALID = "game_state_invalid",
  HERO_NOT_FOUND = "hero_not_found",
  NETWORK_ERROR = "network_error"
}

export interface GameError {
  type: GameErrorType;
  message: string;
  context?: any;
}

// 网络通信类型
export interface SocketEvents {
  // 客户端发送
  'join-room': (roomId: string) => void;
  'move': (move: { from: Position; to: Position }) => void;
  'use-skill': (skillId: string) => void;
  'select-hero': (heroId: string) => void;
  
  // 服务器发送
  'game-state': (gameState: GameState) => void;
  'player-joined': (player: Player) => void;
  'move-result': (result: MoveResult) => void;
  'skill-used': (result: SkillResult) => void;
  'error': (error: GameError) => void;
}

export interface MoveResult {
  success: boolean;
  move?: Move;
  error?: string;
}

// UI相关类型
export interface GameLayers {
  backgroundLayer: any; // Konva.Layer
  gridLayer: any;       // Konva.Layer
  pieceLayer: any;      // Konva.Layer
  highlightLayer: any;  // Konva.Layer
  effectLayer: any;     // Konva.Layer
  uiLayer: any;         // Konva.Layer
}