import { Piece, PieceType, PlayerColor } from '@/types/game';
import { ChessBoard } from './board';

/**
 * 象棋初始棋子摆放工具
 */
export class PieceSetup {
  
  /**
   * 创建标准象棋开局棋子配置
   */
  static createStandardSetup(): Piece[] {
    const pieces: Piece[] = [];
    
    // 红方棋子（下方）
    const redPieces = [
      // 第一排（y=9）
      { type: PieceType.CHARIOT, x: 0, y: 9 },
      { type: PieceType.HORSE, x: 1, y: 9 },
      { type: PieceType.ELEPHANT, x: 2, y: 9 },
      { type: PieceType.ADVISOR, x: 3, y: 9 },
      { type: PieceType.KING, x: 4, y: 9 },
      { type: PieceType.ADVISOR, x: 5, y: 9 },
      { type: PieceType.ELEPHANT, x: 6, y: 9 },
      { type: PieceType.HORSE, x: 7, y: 9 },
      { type: PieceType.CHARIOT, x: 8, y: 9 },
      
      // 炮（y=7）
      { type: PieceType.CANNON, x: 1, y: 7 },
      { type: PieceType.CANNON, x: 7, y: 7 },
      
      // 兵（y=6）
      { type: PieceType.PAWN, x: 0, y: 6 },
      { type: PieceType.PAWN, x: 2, y: 6 },
      { type: PieceType.PAWN, x: 4, y: 6 },
      { type: PieceType.PAWN, x: 6, y: 6 },
      { type: PieceType.PAWN, x: 8, y: 6 },
    ];

    // 黑方棋子（上方）
    const blackPieces = [
      // 第一排（y=0）
      { type: PieceType.CHARIOT, x: 0, y: 0 },
      { type: PieceType.HORSE, x: 1, y: 0 },
      { type: PieceType.ELEPHANT, x: 2, y: 0 },
      { type: PieceType.ADVISOR, x: 3, y: 0 },
      { type: PieceType.KING, x: 4, y: 0 },
      { type: PieceType.ADVISOR, x: 5, y: 0 },
      { type: PieceType.ELEPHANT, x: 6, y: 0 },
      { type: PieceType.HORSE, x: 7, y: 0 },
      { type: PieceType.CHARIOT, x: 8, y: 0 },
      
      // 炮（y=2）
      { type: PieceType.CANNON, x: 1, y: 2 },
      { type: PieceType.CANNON, x: 7, y: 2 },
      
      // 卒（y=3）
      { type: PieceType.PAWN, x: 0, y: 3 },
      { type: PieceType.PAWN, x: 2, y: 3 },
      { type: PieceType.PAWN, x: 4, y: 3 },
      { type: PieceType.PAWN, x: 6, y: 3 },
      { type: PieceType.PAWN, x: 8, y: 3 },
    ];

    // 创建红方棋子
    redPieces.forEach((pieceData, index) => {
      pieces.push({
        id: `red-${pieceData.type}-${index}`,
        type: pieceData.type,
        color: PlayerColor.RED,
        position: { x: pieceData.x, y: pieceData.y },
        isAlive: true
      });
    });

    // 创建黑方棋子
    blackPieces.forEach((pieceData, index) => {
      pieces.push({
        id: `black-${pieceData.type}-${index}`,
        type: pieceData.type,
        color: PlayerColor.BLACK,
        position: { x: pieceData.x, y: pieceData.y },
        isAlive: true
      });
    });

    return pieces;
  }

  /**
   * 将棋子放置到棋盘上
   */
  static setupBoard(board: ChessBoard, pieces: Piece[]): void {
    // 清空棋盘
    board.clear();
    
    // 放置所有棋子
    pieces.forEach(piece => {
      if (piece.isAlive) {
        board.setPiece(piece.position, piece);
      }
    });
  }

  /**
   * 根据颜色获取棋子列表
   */
  static getPiecesByColor(pieces: Piece[], color: PlayerColor): Piece[] {
    return pieces.filter(piece => piece.color === color && piece.isAlive);
  }

  /**
   * 查找指定类型和颜色的棋子
   */
  static findPiece(pieces: Piece[], type: PieceType, color: PlayerColor): Piece | null {
    return pieces.find(piece => 
      piece.type === type && 
      piece.color === color && 
      piece.isAlive
    ) || null;
  }

  /**
   * 查找王/将棋子
   */
  static findKing(pieces: Piece[], color: PlayerColor): Piece | null {
    return this.findPiece(pieces, PieceType.KING, color);
  }

  /**
   * 检查是否存在将军状态
   * 简化版本，后续会在技能系统中完善
   */
  static isInCheck(pieces: Piece[], color: PlayerColor, _board: ChessBoard): boolean {
    const king = this.findKing(pieces, color);
    if (!king) return false;

    // 检查是否有对方棋子可以攻击到王
    // 这里是简化版本，实际实现会更复杂
    return false; // TODO: 实现完整的将军检测
  }

  /**
   * 创建测试用的简化棋局
   */
  static createTestSetup(): Piece[] {
    return [
      // 红方
      {
        id: 'red-king-test',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      },
      {
        id: 'red-chariot-test',
        type: PieceType.CHARIOT,
        color: PlayerColor.RED,
        position: { x: 0, y: 9 },
        isAlive: true
      },
      
      // 黑方
      {
        id: 'black-king-test',
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 0 },
        isAlive: true
      },
      {
        id: 'black-chariot-test',
        type: PieceType.CHARIOT,
        color: PlayerColor.BLACK,
        position: { x: 0, y: 0 },
        isAlive: true
      }
    ];
  }
}