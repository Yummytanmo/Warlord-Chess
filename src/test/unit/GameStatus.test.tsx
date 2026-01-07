import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameStatus } from '@/components/game/GameStatus';
import { useGameStore } from '@/store/gameStore';
import { PlayerColor, GamePhase, PieceType } from '@/types/game';

// Mock Zustand store
vi.mock('@/store/gameStore');

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const mockGameState = {
  board: { getPiece: vi.fn(), setPiece: vi.fn() },
  players: [
    {
      id: 'player1',
      color: PlayerColor.RED,
      hero: {
        id: 'liubang',
        name: '刘邦',
        skills: [],
        awakened: false
      },
      pieces: []
    },
    {
      id: 'player2',
      color: PlayerColor.BLACK,
      hero: {
        id: 'xiangyu',
        name: '项羽',
        skills: [],
        awakened: false
      },
      pieces: []
    }
  ],
  currentPlayer: PlayerColor.RED,
  gamePhase: GamePhase.PLAYING,
  moveHistory: [
    {
      from: { x: 0, y: 6 },
      to: { x: 0, y: 5 },
      piece: {
        id: 'pawn1',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 6 },
        isAlive: true
      },
      timestamp: Date.now()
    }
  ]
};

const mockUseGameStore = useGameStore as any;

describe('GameStatus Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseGameStore.mockReturnValue({
      gameState: mockGameState,
      getCurrentPlayer: vi.fn(() => PlayerColor.RED),
      getOpponentPlayer: vi.fn(() => PlayerColor.BLACK),
      undoLastMove: vi.fn(),
      canUndoMove: vi.fn(() => true),
      startNewGame: vi.fn()
    });
  });

  it('should render game status with current game phase', () => {
    render(<GameStatus />);
    
    expect(screen.getByText('游戏状态')).toBeInTheDocument();
    expect(screen.getByText('游戏进行中')).toBeInTheDocument();
  });

  it('should display current player information', () => {
    render(<GameStatus />);
    
    expect(screen.getByText('红方 - 刘邦')).toBeInTheDocument();
    expect(screen.getByText('黑方 - 项羽')).toBeInTheDocument();
    expect(screen.getByText('当前回合')).toBeInTheDocument();
  });

  it('should show move history', () => {
    render(<GameStatus />);
    
    expect(screen.getByText('移动历史')).toBeInTheDocument();
    expect(screen.getByText('(1 步)')).toBeInTheDocument();
  });

  it('should handle undo move action', async () => {
    const mockUndoLastMove = vi.fn();
    mockUseGameStore.mockReturnValue({
      gameState: mockGameState,
      getCurrentPlayer: vi.fn(() => PlayerColor.RED),
      getOpponentPlayer: vi.fn(() => PlayerColor.BLACK),
      undoLastMove: mockUndoLastMove,
      canUndoMove: vi.fn(() => true),
      startNewGame: vi.fn()
    });

    render(<GameStatus />);
    
    const undoButton = screen.getByRole('button', { name: /撤销/ });
    fireEvent.click(undoButton);
    
    await waitFor(() => {
      expect(mockUndoLastMove).toHaveBeenCalled();
    });
  });

  it('should handle new game action', async () => {
    const mockStartNewGame = vi.fn();
    mockUseGameStore.mockReturnValue({
      gameState: mockGameState,
      getCurrentPlayer: vi.fn(() => PlayerColor.RED),
      getOpponentPlayer: vi.fn(() => PlayerColor.BLACK),
      undoLastMove: vi.fn(),
      canUndoMove: vi.fn(() => true),
      startNewGame: mockStartNewGame
    });

    render(<GameStatus />);
    
    const newGameButton = screen.getByRole('button', { name: /新游戏/ });
    fireEvent.click(newGameButton);
    
    await waitFor(() => {
      expect(mockStartNewGame).toHaveBeenCalled();
    });
  });

  it('should disable undo button when undo is not available', () => {
    mockUseGameStore.mockReturnValue({
      gameState: mockGameState,
      getCurrentPlayer: vi.fn(() => PlayerColor.RED),
      getOpponentPlayer: vi.fn(() => PlayerColor.BLACK),
      undoLastMove: vi.fn(),
      canUndoMove: vi.fn(() => false),
      startNewGame: vi.fn()
    });

    render(<GameStatus />);
    
    const undoButton = screen.getByRole('button', { name: /撤销/ });
    expect(undoButton).toBeDisabled();
  });

  it('should show game over state', () => {
    const gameOverState = {
      ...mockGameState,
      gamePhase: GamePhase.GAME_OVER,
      winner: PlayerColor.RED
    };

    mockUseGameStore.mockReturnValue({
      gameState: gameOverState,
      getCurrentPlayer: vi.fn(() => PlayerColor.RED),
      getOpponentPlayer: vi.fn(() => PlayerColor.BLACK),
      undoLastMove: vi.fn(),
      canUndoMove: vi.fn(() => false),
      startNewGame: vi.fn()
    });

    render(<GameStatus />);
    
    expect(screen.getByText('游戏结束！')).toBeInTheDocument();
    expect(screen.getByText('红方获胜')).toBeInTheDocument();
  });

  it('should show empty move history when no moves', () => {
    const noMovesState = {
      ...mockGameState,
      moveHistory: []
    };

    mockUseGameStore.mockReturnValue({
      gameState: noMovesState,
      getCurrentPlayer: vi.fn(() => PlayerColor.RED),
      getOpponentPlayer: vi.fn(() => PlayerColor.BLACK),
      undoLastMove: vi.fn(),
      canUndoMove: vi.fn(() => false),
      startNewGame: vi.fn()
    });

    render(<GameStatus />);
    
    expect(screen.getByText('暂无移动记录')).toBeInTheDocument();
  });

  it('should not render when game state is null', () => {
    mockUseGameStore.mockReturnValue({
      gameState: null,
      getCurrentPlayer: vi.fn(() => null),
      getOpponentPlayer: vi.fn(() => null),
      undoLastMove: vi.fn(),
      canUndoMove: vi.fn(() => false),
      startNewGame: vi.fn()
    });

    const { container } = render(<GameStatus />);
    expect(container.firstChild).toBeNull();
  });
});