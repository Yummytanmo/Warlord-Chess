import { RuleContext } from '@/types/rules';

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

export enum SkillTrigger {
  BEFORE_MOVE = 'before_move',
  AFTER_MOVE = 'after_move',
  ON_CAPTURE = 'on_capture',
  ON_CHECK = 'on_check',
  ON_TURN_START = 'on_turn_start',
  ON_TURN_END = 'on_turn_end',
  ON_GAME_START = 'on_game_start',
  MANUAL = 'manual'
}

export interface SkillState {
  skillId: string;
  isUsed: boolean;
  isAwakened: boolean;
  usageCount: number;
  maxUsages?: number;
  cooldownTurns: number;
  lastUsedTurn: number;
  customData?: Record<string, any>;
}

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  isUsed: boolean;
  canUse(): boolean;
  execute(context: GameContext): SkillResult;
  applyRules?(context: RuleContext): void;
}

export interface GameContext {
  gameState: GameState;
  piece?: Piece;
  move?: Move;
  player?: Player;
  capturedPiece?: Piece;
}

export interface SkillResult {
  success: boolean;
  modifiedMove?: Move;
  gameStateChanges?: any; // Allow any structure for skill-specific changes
  message?: string;
}

// 游戏状态类型定义
export enum GamePhase {
  HERO_SELECTION = 'hero_selection',
  PLAYING = 'playing',
  GAME_OVER = 'game_over'
}

export interface TurnState {
  phase: 'normal' | 'extra_move' | 'force_move' | 'skill_interaction';
  sourceSkillId?: string;
  requiredPieceId?: string; // ID of piece that MUST be moved
  bannedPieceTypes?: PieceType[]; // Types that CANNOT be moved
  remainingMoves: number;
  context?: any; // Extra data (e.g. tracking "Yue Xia" targets)
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  timestamp: number;
  isCheck?: boolean;
}

export interface GameState {
  board: Board;
  players: [Player, Player];
  currentPlayer: PlayerColor;
  gamePhase: GamePhase;
  moveHistory: Move[];
  winner?: PlayerColor;
  
  // For Multi-stage turns
  turnState?: TurnState;

  // For Hanxin's markers
  markers?: Record<string, number>; // playerColor -> count
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
  getAllPieces(): Piece[];
  getPiecesByColor(color: PlayerColor): Piece[];
  clear(): void;
  clone(): Board;
  isPathBlocked(from: Position, to: Position): boolean;
  getDistance(from: Position, to: Position): number;
  isOnSameLine(pos1: Position, pos2: Position): boolean;
}

// 移动验证相关类型
export interface MoveValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface MoveValidator {
  validateMove(move: Move, gameState: GameState, ruleContext?: RuleContext): MoveValidationResult;
  getValidMoves?(piece: Piece, gameState: GameState, ruleContext?: RuleContext): Position[];
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