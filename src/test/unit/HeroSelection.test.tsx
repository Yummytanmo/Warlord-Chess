import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeroSelection } from '@/components/game/HeroSelection';
import { useGameStore } from '@/store/gameStore';

// Mock the game store
vi.mock('@/store/gameStore');

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Radix UI components to simplify testing
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: any) => open ? <div data-testid="dialog-open">{children}</div> : <div data-testid="dialog-closed">{children}</div>,
  Trigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
  Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ children }: any) => <div data-testid="dialog-overlay">{children}</div>,
  Content: ({ children }: any) => <div data-testid="dialog-content" role="dialog">{children}</div>,
  Title: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  Description: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  Close: ({ children }: any) => <div data-testid="dialog-close">{children}</div>,
}));

vi.mock('@radix-ui/react-tooltip', () => ({
  Provider: ({ children }: any) => children,
  Root: ({ children }: any) => children,
  Trigger: ({ children }: any) => children,
  Portal: ({ children }: any) => children,
  Content: ({ children }: any) => <div>{children}</div>,
  Arrow: () => <div />,
}));

describe('HeroSelection Component', () => {
  const mockSetHeroSelectionOpen = vi.fn();
  const mockSelectHero = vi.fn();

  const mockGameStore = {
    isHeroSelectionOpen: false,
    setHeroSelectionOpen: mockSetHeroSelectionOpen,
    selectHero: mockSelectHero,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockReturnValue(mockGameStore);
  });

  it('should render hero selection trigger button', () => {
    render(<HeroSelection />);
    
    const triggerButton = screen.getByRole('button', { name: '选择武将' });
    expect(triggerButton).toBeInTheDocument();
  });

  it('should render dialog when open', () => {
    const openStore = {
      ...mockGameStore,
      isHeroSelectionOpen: true,
    };
    (useGameStore as any).mockReturnValue(openStore);

    render(<HeroSelection />);
    
    expect(screen.getByTestId('dialog-open')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
  });

  it('should not render dialog content when closed', () => {
    render(<HeroSelection />);
    
    expect(screen.getByTestId('dialog-closed')).toBeInTheDocument();
  });

  it('should display player selection status', () => {
    const openStore = {
      ...mockGameStore,
      isHeroSelectionOpen: true,
    };
    (useGameStore as any).mockReturnValue(openStore);

    render(<HeroSelection />);
    
    expect(screen.getByText('红方: 未选择')).toBeInTheDocument();
    expect(screen.getByText('黑方: 未选择')).toBeInTheDocument();
  });

  it('should render hero cards', () => {
    const openStore = {
      ...mockGameStore,
      isHeroSelectionOpen: true,
    };
    (useGameStore as any).mockReturnValue(openStore);

    render(<HeroSelection />);
    
    // Check if hero names are rendered (we expect 6 heroes)
    expect(screen.getByText('项羽')).toBeInTheDocument();
    expect(screen.getByText('刘邦')).toBeInTheDocument();
    expect(screen.getByText('韩信')).toBeInTheDocument();
    expect(screen.getByText('萧何')).toBeInTheDocument();
    expect(screen.getByText('张良')).toBeInTheDocument();
    expect(screen.getByText('樊哙')).toBeInTheDocument();
  });

  it('should show action buttons', () => {
    const openStore = {
      ...mockGameStore,
      isHeroSelectionOpen: true,
    };
    (useGameStore as any).mockReturnValue(openStore);

    render(<HeroSelection />);
    
    expect(screen.getByText('重新选择')).toBeInTheDocument();
    expect(screen.getByText('开始游戏')).toBeInTheDocument();
  });

  it('should disable start game button initially', () => {
    const openStore = {
      ...mockGameStore,
      isHeroSelectionOpen: true,
    };
    (useGameStore as any).mockReturnValue(openStore);

    render(<HeroSelection />);
    
    const startButton = screen.getByText('开始游戏').closest('button');
    expect(startButton).toBeDisabled();
  });

  it('should show current player selection prompt', () => {
    const openStore = {
      ...mockGameStore,
      isHeroSelectionOpen: true,
    };
    (useGameStore as any).mockReturnValue(openStore);

    render(<HeroSelection />);
    
    expect(screen.getByText('请 红方 选择武将')).toBeInTheDocument();
  });

  it('should have proper responsive grid layout', () => {
    const openStore = {
      ...mockGameStore,
      isHeroSelectionOpen: true,
    };
    (useGameStore as any).mockReturnValue(openStore);

    const { container } = render(<HeroSelection />);
    
    // Check for responsive grid classes
    const heroGrid = container.querySelector('.grid');
    expect(heroGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('should render with proper dialog structure', () => {
    const openStore = {
      ...mockGameStore,
      isHeroSelectionOpen: true,
    };
    (useGameStore as any).mockReturnValue(openStore);

    render(<HeroSelection />);
    
    expect(screen.getByTestId('dialog-portal')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});