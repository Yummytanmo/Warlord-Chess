import { Board, Position, Piece, PlayerColor } from '@/types/game';

/**
 * 象棋棋盘实现类
 * 实现9x10的棋盘网格，包含位置验证、九宫、河界等功能
 */
export class ChessBoard implements Board {
  public grid: (Piece | null)[][];
  public readonly BOARD_SIZE = { width: 9, height: 10 };

  constructor() {
    // 初始化9x10的棋盘网格
    this.grid = Array(this.BOARD_SIZE.height)
      .fill(null)
      .map(() => Array(this.BOARD_SIZE.width).fill(null));
  }

  /**
   * 获取指定位置的棋子
   */
  getPiece(position: Position): Piece | null {
    if (!this.isValidPosition(position)) {
      return null;
    }
    return this.grid[position.y][position.x];
  }

  /**
   * 在指定位置放置或移除棋子
   */
  setPiece(position: Position, piece: Piece | null): void {
    if (!this.isValidPosition(position)) {
      return;
    }
    this.grid[position.y][position.x] = piece;
    
    // 如果放置棋子，更新棋子的位置
    if (piece) {
      piece.position = { ...position };
    }
  }

  /**
   * 验证位置是否在棋盘范围内
   */
  isValidPosition(position: Position): boolean {
    return (
      position.x >= 0 && 
      position.x < this.BOARD_SIZE.width &&
      position.y >= 0 && 
      position.y < this.BOARD_SIZE.height
    );
  }

  /**
   * 判断位置是否在九宫内
   * 红方九宫：x: 3-5, y: 7-9
   * 黑方九宫：x: 3-5, y: 0-2
   */
  isInPalace(position: Position, color: PlayerColor): boolean {
    if (!this.isValidPosition(position)) {
      return false;
    }

    const isInPalaceX = position.x >= 3 && position.x <= 5;
    
    if (color === PlayerColor.RED) {
      return isInPalaceX && position.y >= 7 && position.y <= 9;
    } else {
      return isInPalaceX && position.y >= 0 && position.y <= 2;
    }
  }

  /**
   * 判断棋子是否已过河
   * 河界在y=4和y=5之间
   */
  hasRiverCrossed(position: Position, color: PlayerColor): boolean {
    if (!this.isValidPosition(position)) {
      return false;
    }

    if (color === PlayerColor.RED) {
      // 红方过河：y < 5
      return position.y < 5;
    } else {
      // 黑方过河：y > 4
      return position.y > 4;
    }
  }

  /**
   * 获取棋盘上所有棋子
   */
  getAllPieces(): Piece[] {
    const pieces: Piece[] = [];
    for (let y = 0; y < this.BOARD_SIZE.height; y++) {
      for (let x = 0; x < this.BOARD_SIZE.width; x++) {
        const piece = this.grid[y][x];
        if (piece && piece.isAlive) {
          pieces.push(piece);
        }
      }
    }
    return pieces;
  }

  /**
   * 获取指定颜色的所有棋子
   */
  getPiecesByColor(color: PlayerColor): Piece[] {
    return this.getAllPieces().filter(piece => piece.color === color);
  }

  /**
   * 清空棋盘
   */
  clear(): void {
    for (let y = 0; y < this.BOARD_SIZE.height; y++) {
      for (let x = 0; x < this.BOARD_SIZE.width; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  /**
   * 复制棋盘状态
   */
  clone(): ChessBoard {
    const newBoard = new ChessBoard();
    for (let y = 0; y < this.BOARD_SIZE.height; y++) {
      for (let x = 0; x < this.BOARD_SIZE.width; x++) {
        const piece = this.grid[y][x];
        if (piece) {
          newBoard.grid[y][x] = { ...piece };
        }
      }
    }
    return newBoard;
  }

  /**
   * 检查两个位置之间的路径是否被阻挡
   * 用于车、炮等棋子的移动验证
   */
  isPathBlocked(from: Position, to: Position): boolean {
    if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
      return true;
    }

    // 计算移动方向
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);

    // 只检查直线移动
    if (dx !== 0 && dy !== 0) {
      return true; // 不是直线移动
    }

    let currentX = from.x + dx;
    let currentY = from.y + dy;

    // 检查路径上是否有棋子阻挡
    while (currentX !== to.x || currentY !== to.y) {
      if (this.getPiece({ x: currentX, y: currentY }) !== null) {
        return true; // 路径被阻挡
      }
      currentX += dx;
      currentY += dy;
    }

    return false;
  }

  /**
   * 计算两个位置之间的距离
   */
  getDistance(from: Position, to: Position): number {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  /**
   * 判断两个位置是否在同一条线上（横线或竖线）
   */
  isOnSameLine(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x || pos1.y === pos2.y;
  }
}