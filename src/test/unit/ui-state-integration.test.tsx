import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useGameStore } from '@/store/gameStore';
import { SkillPanel } from '@/components/game/SkillPanel';
import { GameStatus } from '@/components/game/GameStatus';
import { PlayerColor, GamePhase, SkillType, PieceType } from '@/types/game';
import { getHeroById } from '@/lib/heroes';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock Radix UI components
vi.mock('@radix-ui/react-tooltip', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Trigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? children : <div>{children}</div>,
  Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Arrow: () => <div />
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Test component that uses both SkillPanel and GameStatus
const TestGameInterface = () => {
  return (
    <div data-testid="game-interface">
      <GameStatus />
      <SkillPanel />
    </div>
  );
};

describe('UI State Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state before each test
    act(() => {
      useGameStore.getState().initializeGame();
    });
  });

  it('should show basic game interface', async () => {
    render(<TestGameInterface />);
    
    // Should show basic interface elements
    expect(screen.getByText('游戏状态')).toBeInTheDocument();
    expect(screen.getByText('武将选择中')).toBeInTheDocument();
  });

  it('should synchronize UI updates when hero is selected', async () => {
    render(<TestGameInterface />);
    
    const store = useGameStore.getState();
    
    // Simulate hero selection
    act(() => {
      const liubangHero = getHeroById('liubang');
      if (liubangHero) {
        store.selectHero('player1', liubangHero);
      }
    });

    // Wait for UI to update
    await waitFor(() => {
      expect(screen.getByText('刘邦 - 技能面板')).toBeInTheDocument();
    });
  });

  it('should handle game phase transitions', async () => {
    render(<TestGameInterface />);
    
    const store = useGameStore.getState();
    
    // Start in hero selection phase
    act(() => {
      const gameState = {
        board: { getPiece: vi.fn(), setPiece: vi.fn() },
        players: [
          {
            id: 'player1',
            color: PlayerColor.RED,
            hero: { id: '', name: '未选择', skills: [], awakened: false },
            pieces: []
          },
          {
            id: 'player2',
            color: PlayerColor.BLACK,
            hero: { id: '', name: '未选择', skills: [], awakened: false },
            pieces: []
          }
        ],
        currentPlayer: PlayerColor.RED,
        gamePhase: GamePhase.HERO_SELECTION,
        moveHistory: []
      };
      
      store.updateGameState(gameState as any);
    });

    // Should show hero selection phase
    await waitFor(() => {
      expect(screen.getByText('武将选择中')).toBeInTheDocument();
    });

    // Transition to playing phase
    act(() => {
      const currentState = store.gameState!;
      const updatedState = {
        ...currentState,
        gamePhase: GamePhase.PLAYING,
        players: [
          {
            ...currentState.players[0],
            hero: { id: 'liubang', name: '刘邦', skills: [], awakened: false }
          },
          {
            ...currentState.players[1],
            hero: { id: 'xiangyu', name: '项羽', skills: [], awakened: false }
          }
        ]
      };
      
      store.updateGameState(updatedState);
    });

    // Should show playing phase
    await waitFor(() => {
      expect(screen.getByText('游戏进行中')).toBeInTheDocument();
    });
  });

  it('should update move history in real-time', async () => {
    render(<TestGameInterface />);
    
    const store = useGameStore.getState();
    
    // Set up initial game state
    act(() => {
      const gameState = {
        board: { getPiece: vi.fn(), setPiece: vi.fn() },
        players: [
          {
            id: 'player1',
            color: PlayerColor.RED,
            hero: { id: 'liubang', name: '刘邦', skills: [], awakened: false },
            pieces: []
          },
          {
            id: 'player2',
            color: PlayerColor.BLACK,
            hero: { id: 'xiangyu', name: '项羽', skills: [], awakened: false },
            pieces: []
          }
        ],
        currentPlayer: PlayerColor.RED,
        gamePhase: GamePhase.PLAYING,
        moveHistory: []
      };
      
      store.updateGameState(gameState as any);
    });

    // Initially no moves
    await waitFor(() => {
      expect(screen.getByText('暂无移动记录')).toBeInTheDocument();
    });

    // Add a move to history
    act(() => {
      const currentState = store.gameState!;
      const move = {
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
      };
      
      const updatedState = {
        ...currentState,
        moveHistory: [move]
      };
      
      store.updateGameState(updatedState);
    });

    // Should show move count
    await waitFor(() => {
      expect(screen.getByText('(1 步)')).toBeInTheDocument();
    });
  });

  it('should handle game over state', async () => {
    render(<TestGameInterface />);
    
    const store = useGameStore.getState();
    
    // Set game over state
    act(() => {
      const gameState = {
        board: { getPiece: vi.fn(), setPiece: vi.fn() },
        players: [
          {
            id: 'player1',
            color: PlayerColor.RED,
            hero: { id: 'liubang', name: '刘邦', skills: [], awakened: false },
            pieces: []
          },
          {
            id: 'player2',
            color: PlayerColor.BLACK,
            hero: { id: 'xiangyu', name: '项羽', skills: [], awakened: false },
            pieces: []
          }
        ],
        currentPlayer: PlayerColor.RED,
        gamePhase: GamePhase.GAME_OVER,
        winner: PlayerColor.RED,
        moveHistory: []
      };
      
      store.updateGameState(gameState as any);
    });

    // Should show game over state
    await waitFor(() => {
      expect(screen.getByText('游戏结束！')).toBeInTheDocument();
      expect(screen.getByText('红方获胜')).toBeInTheDocument();
    });
  });
});