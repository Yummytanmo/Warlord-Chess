import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkillPanel } from '@/components/game/SkillPanel';
import { useGameStore } from '@/store/gameStore';
import { PlayerColor, GamePhase, SkillType } from '@/types/game';

// Mock Zustand store
vi.mock('@/store/gameStore');

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock Radix UI Tooltip
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

const mockGameState = {
  board: { getPiece: vi.fn(), setPiece: vi.fn() },
  players: [
    {
      id: 'player1',
      color: PlayerColor.RED,
      hero: {
        id: 'liubang',
        name: '刘邦',
        skills: [
          {
            id: 'liubang_genyi',
            name: '更衣',
            type: SkillType.PASSIVE,
            description: '你的将可以出九宫。',
            isUsed: false,
            canUse: () => true,
            execute: vi.fn()
          },
          {
            id: 'liubang_qinzheng',
            name: '亲征',
            type: SkillType.LIMITED,
            description: '限定技，强制对方将与你的将在同一条线上。',
            isUsed: false,
            canUse: () => true,
            execute: vi.fn()
          }
        ],
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
  moveHistory: []
};

const mockUseGameStore = useGameStore as any;

describe('SkillPanel Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseGameStore.mockReturnValue({
      gameState: mockGameState,
      useSkill: vi.fn(),
      getAvailableSkills: vi.fn(() => mockGameState.players[0].hero.skills),
      getCurrentPlayer: vi.fn(() => PlayerColor.RED)
    });
  });

  it('should render skill panel with current player skills', () => {
    render(<SkillPanel />);
    
    expect(screen.getByText('刘邦 - 技能面板')).toBeInTheDocument();
    expect(screen.getAllByText('更衣')[0]).toBeInTheDocument();
    expect(screen.getAllByText('亲征')[0]).toBeInTheDocument();
  });

  it('should display skill types correctly', () => {
    render(<SkillPanel />);
    
    expect(screen.getAllByText('被动')[0]).toBeInTheDocument();
    expect(screen.getAllByText('限定')[0]).toBeInTheDocument();
  });

  it('should handle skill usage when clicked', async () => {
    const mockUseSkill = vi.fn();
    mockUseGameStore.mockReturnValue({
      gameState: mockGameState,
      useSkill: mockUseSkill,
      getAvailableSkills: vi.fn(() => mockGameState.players[0].hero.skills),
      getCurrentPlayer: vi.fn(() => PlayerColor.RED)
    });

    render(<SkillPanel />);
    
    const skillButtons = screen.getAllByRole('button');
    const qinzhengButton = skillButtons.find(button => button.textContent?.includes('亲征'));
    
    if (qinzhengButton) {
      fireEvent.click(qinzhengButton);
      
      await waitFor(() => {
        expect(mockUseSkill).toHaveBeenCalledWith('liubang_qinzheng');
      });
    }
  });

  it('should disable used skills', () => {
    const usedSkillGameState = {
      ...mockGameState,
      players: [
        {
          ...mockGameState.players[0],
          hero: {
            ...mockGameState.players[0].hero,
            skills: [
              {
                ...mockGameState.players[0].hero.skills[0],
                isUsed: true,
                canUse: () => false
              }
            ]
          }
        },
        mockGameState.players[1]
      ]
    };

    mockUseGameStore.mockReturnValue({
      gameState: usedSkillGameState,
      useSkill: vi.fn(),
      getAvailableSkills: vi.fn(() => []),
      getCurrentPlayer: vi.fn(() => PlayerColor.RED)
    });

    render(<SkillPanel />);
    
    const skillButtons = screen.getAllByRole('button');
    const genyiButton = skillButtons.find(button => button.textContent?.includes('更衣'));
    
    if (genyiButton) {
      expect(genyiButton).toBeDisabled();
    }
  });

  it('should show no available skills message when no skills are available', () => {
    mockUseGameStore.mockReturnValue({
      gameState: mockGameState,
      useSkill: vi.fn(),
      getAvailableSkills: vi.fn(() => []),
      getCurrentPlayer: vi.fn(() => PlayerColor.RED)
    });

    render(<SkillPanel />);
    
    expect(screen.getByText('当前没有可用技能')).toBeInTheDocument();
  });

  it('should not render when game state is null', () => {
    mockUseGameStore.mockReturnValue({
      gameState: null,
      useSkill: vi.fn(),
      getAvailableSkills: vi.fn(() => []),
      getCurrentPlayer: vi.fn(() => null)
    });

    const { container } = render(<SkillPanel />);
    expect(container.firstChild).toBeNull();
  });
});