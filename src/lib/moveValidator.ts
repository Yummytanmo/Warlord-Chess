import { 
  Move, 
  MoveValidationResult, 
  MoveValidator, 
  GameState, 
  Position, 
  Piece, 
  PieceType, 
  PlayerColor 
} from '@/types/game';

/**
 * 象棋移动规则验证器
 * 实现各种棋子的移动逻辑验证
 */
export class ChessMoveValidator implements MoveValidator {
  
  /**
   * 验证移动是否合法
   */
  validateMove(move: Move, gameState: GameState): MoveValidationResult {
    const { from, to, piece } = move;
    const { board } = gameState;

    // 基础验证
    if (!board.isValidPosition(from) || !board.isValidPosition(to)) {
      return { isValid: false, reason: '移动位置超出棋盘范围' };
    }

    if (from.x === to.x && from.y === to.y) {
      return { isValid: false, reason: '起始位置和目标位置相同' };
    }

    // 验证棋子是否存在于起始位置
    const pieceAtFrom = board.getPiece(from);
    if (!pieceAtFrom || pieceAtFrom.id !== piece.id) {
      return { isValid: false, reason: '起始位置没有指定的棋子' };
    }

    // 验证目标位置
    const pieceAtTo = board.getPiece(to);
    if (pieceAtTo && pieceAtTo.color === piece.color) {
      return { isValid: false, reason: '目标位置有己方棋子' };
    }

    // 根据棋子类型验证移动规则
    switch (piece.type) {
      case PieceType.KING:
        return this.validateKingMove(from, to, piece, board);
      case PieceType.ADVISOR:
        return this.validateAdvisorMove(from, to, piece, board);
      case PieceType.ELEPHANT:
        return this.validateElephantMove(from, to, piece, board);
      case PieceType.HORSE:
        return this.validateHorseMove(from, to, piece, board);
      case PieceType.CHARIOT:
        return this.validateChariotMove(from, to, piece, board);
      case PieceType.CANNON:
        return this.validateCannonMove(from, to, piece, board);
      case PieceType.PAWN:
        return this.validatePawnMove(from, to, piece, board);
      default:
        return { isValid: false, reason: '未知的棋子类型' };
    }
  }

  /**
   * 验证将/帅的移动
   * 只能在九宫内移动，每次只能走一格（横或竖）
   */
  private validateKingMove(from: Position, to: Position, piece: Piece, board: any): MoveValidationResult {
    // 只能走一格，且只能横走或竖走
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
      return { isValid: false, reason: '将/帅只能走一格（横或竖）' };
    }

    // 必须在九宫内
    if (!board.isInPalace(to, piece.color)) {
      return { isValid: false, reason: '将/帅不能离开九宫' };
    }

    return { isValid: true };
  }

  /**
   * 验证士的移动
   * 只能在九宫内斜走，每次只能走一格
   */
  private validateAdvisorMove(from: Position, to: Position, piece: Piece, board: any): MoveValidationResult {
    // 必须在九宫内
    if (!board.isInPalace(to, piece.color)) {
      return { isValid: false, reason: '士不能离开九宫' };
    }

    // 只能斜走一格
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    if (dx === 1 && dy === 1) {
      return { isValid: true };
    }

    return { isValid: false, reason: '士只能斜走一格' };
  }

  /**
   * 验证象的移动
   * 只能斜走两格（田字格），不能过河，不能被象心阻挡
   */
  private validateElephantMove(from: Position, to: Position, _piece: Piece, board: any): MoveValidationResult {
    // 不能过河
    if (board.hasRiverCrossed(to, _piece.color)) {
      return { isValid: false, reason: '象不能过河' };
    }

    // 只能走田字格（斜走两格）
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) !== 2 || Math.abs(dy) !== 2) {
      return { isValid: false, reason: '象只能走田字格' };
    }

    // 检查象心是否被阻挡
    const elephantHeartX = from.x + dx / 2;
    const elephantHeartY = from.y + dy / 2;
    const elephantHeart = { x: elephantHeartX, y: elephantHeartY };

    if (board.getPiece(elephantHeart)) {
      return { isValid: false, reason: '象心被阻挡' };
    }

    return { isValid: true };
  }

  /**
   * 验证马的移动
   * 走日字格，可能被拌马腿
   */
  private validateHorseMove(from: Position, to: Position, _piece: Piece, board: any): MoveValidationResult {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // 检查是否是日字格移动
    const isValidLShape = 
      (Math.abs(dx) === 2 && Math.abs(dy) === 1) || 
      (Math.abs(dx) === 1 && Math.abs(dy) === 2);

    if (!isValidLShape) {
      return { isValid: false, reason: '马只能走日字格' };
    }

    // 检查拌马腿
    let legX: number, legY: number;
    if (Math.abs(dx) === 2) {
      // 横向移动两格，检查横向的拌马腿
      legX = from.x + dx / 2;
      legY = from.y;
    } else {
      // 纵向移动两格，检查纵向的拌马腿
      legX = from.x;
      legY = from.y + dy / 2;
    }

    const legPosition = { x: legX, y: legY };
    if (board.getPiece(legPosition)) {
      return { isValid: false, reason: '马被拌腿' };
    }

    return { isValid: true };
  }

  /**
   * 验证车的移动
   * 只能直线移动，路径不能被阻挡
   */
  private validateChariotMove(from: Position, to: Position, _piece: Piece, board: any): MoveValidationResult {
    // 只能直线移动
    if (!board.isOnSameLine(from, to)) {
      return { isValid: false, reason: '车只能直线移动' };
    }

    // 检查路径是否被阻挡
    if (board.isPathBlocked(from, to)) {
      return { isValid: false, reason: '车的移动路径被阻挡' };
    }

    return { isValid: true };
  }

  /**
   * 验证炮的移动
   * 不吃子时直线移动且路径不能被阻挡
   * 吃子时必须隔一个棋子
   */
  private validateCannonMove(from: Position, to: Position, _piece: Piece, board: any): MoveValidationResult {
    // 只能直线移动
    if (!board.isOnSameLine(from, to)) {
      return { isValid: false, reason: '炮只能直线移动' };
    }

    const targetPiece = board.getPiece(to);
    
    if (!targetPiece) {
      // 不吃子，路径必须畅通
      if (board.isPathBlocked(from, to)) {
        return { isValid: false, reason: '炮移动时路径被阻挡' };
      }
    } else {
      // 吃子，必须隔一个棋子
      const piecesInPath = this.countPiecesInPath(from, to, board);
      if (piecesInPath !== 1) {
        return { isValid: false, reason: '炮吃子必须隔一个棋子' };
      }
    }

    return { isValid: true };
  }

  /**
   * 验证兵/卒的移动
   * 未过河只能向前，过河后可以横走
   */
  private validatePawnMove(from: Position, to: Position, piece: Piece, board: any): MoveValidationResult {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // 只能走一格
    if (Math.abs(dx) + Math.abs(dy) !== 1) {
      return { isValid: false, reason: '兵/卒只能走一格' };
    }

    const hasRiverCrossed = board.hasRiverCrossed(from, piece.color);

    if (!hasRiverCrossed) {
      // 未过河，只能向前
      const forwardDirection = piece.color === PlayerColor.RED ? -1 : 1;
      if (dy !== forwardDirection || dx !== 0) {
        return { isValid: false, reason: '兵/卒未过河时只能向前' };
      }
    } else {
      // 已过河，可以横走或继续向前，但不能后退
      if (dx !== 0 && dy !== 0) {
        return { isValid: false, reason: '兵/卒不能斜走' };
      }

      // 不能后退
      const backwardDirection = piece.color === PlayerColor.RED ? 1 : -1;
      if (dy === backwardDirection) {
        return { isValid: false, reason: '兵/卒不能后退' };
      }
    }

    return { isValid: true };
  }

  /**
   * 计算路径中的棋子数量（不包括起点和终点）
   */
  private countPiecesInPath(from: Position, to: Position, board: any): number {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    
    let count = 0;
    let currentX = from.x + dx;
    let currentY = from.y + dy;

    while (currentX !== to.x || currentY !== to.y) {
      if (board.getPiece({ x: currentX, y: currentY })) {
        count++;
      }
      currentX += dx;
      currentY += dy;
    }

    return count;
  }

  /**
   * 获取棋子的所有可能移动位置
   */
  getValidMoves(piece: Piece, gameState: GameState): Position[] {
    const validMoves: Position[] = [];
    const { board } = gameState;

    // 遍历棋盘上的所有位置
    for (let y = 0; y < board.BOARD_SIZE.height; y++) {
      for (let x = 0; x < board.BOARD_SIZE.width; x++) {
        const to = { x, y };
        const move: Move = {
          from: piece.position,
          to,
          piece,
          timestamp: Date.now()
        };

        const result = this.validateMove(move, gameState);
        if (result.isValid) {
          validMoves.push(to);
        }
      }
    }

    return validMoves;
  }
}