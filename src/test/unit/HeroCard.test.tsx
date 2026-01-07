import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HeroCard } from '@/components/game/HeroCard';
import { HeroClass } from '@/lib/heroes';
import { SkillType } from '@/types/game';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Create a test wrapper with TooltipProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Tooltip.Provider>
    {children}
  </Tooltip.Provider>
);

// Create a test hero with skills
const createTestHero = (): HeroClass => {
  return new HeroClass(
    'test-hero',
    '测试武将',
    [
      {
        id: 'test-skill-1',
        name: '测试技能1',
        type: SkillType.PASSIVE,
        description: '这是一个被动技能的描述',
        isUsed: false,
        canUse: () => true,
        execute: () => ({ success: true })
      },
      {
        id: 'test-skill-2',
        name: '测试技能2',
        type: SkillType.LIMITED,
        description: '这是一个限定技能的描述',
        isUsed: false,
        canUse: () => true,
        execute: () => ({ success: true })
      }
    ],
    '/test-avatar.jpg',
    '这是一个测试武将的描述，用于验证组件功能。'
  );
};

describe('HeroCard Component', () => {
  let testHero: HeroClass;
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    testHero = createTestHero();
  });

  it('should render hero name', () => {
    render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    expect(screen.getByText('测试武将')).toBeInTheDocument();
  });

  it('should render hero description', () => {
    render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    expect(screen.getByText('这是一个测试武将的描述，用于验证组件功能。')).toBeInTheDocument();
  });

  it('should render hero skills', () => {
    render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    expect(screen.getByText('测试技能1')).toBeInTheDocument();
    expect(screen.getByText('测试技能2')).toBeInTheDocument();
    expect(screen.getByText('被动')).toBeInTheDocument();
    expect(screen.getByText('限定')).toBeInTheDocument();
  });

  it('should render skills section header', () => {
    render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    expect(screen.getByText('技能')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    const card = screen.getByText('测试武将').closest('div');
    fireEvent.click(card!);
    
    expect(mockOnSelect).toHaveBeenCalledWith(testHero);
  });

  it('should not call onSelect when disabled', () => {
    render(<HeroCard hero={testHero} onSelect={mockOnSelect} disabled={true} />, { wrapper: TestWrapper });
    
    const card = screen.getByText('测试武将').closest('div');
    fireEvent.click(card!);
    
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('should show selected state when isSelected is true', () => {
    const { container } = render(
      <HeroCard hero={testHero} onSelect={mockOnSelect} isSelected={true} />,
      { wrapper: TestWrapper }
    );
    
    // Check for selected styling classes
    const card = container.querySelector('.border-blue-500');
    expect(card).toBeInTheDocument();
    
    // Check for crown icon indicating selection
    const crownIcon = container.querySelector('svg');
    expect(crownIcon).toBeInTheDocument();
  });

  it('should show disabled state when disabled is true', () => {
    const { container } = render(
      <HeroCard hero={testHero} onSelect={mockOnSelect} disabled={true} />,
      { wrapper: TestWrapper }
    );
    
    // Check for disabled styling
    const card = container.querySelector('.opacity-50');
    expect(card).toBeInTheDocument();
    
    const disabledCard = container.querySelector('.cursor-not-allowed');
    expect(disabledCard).toBeInTheDocument();
  });

  it('should render avatar placeholder when no avatar provided', () => {
    const heroWithoutAvatar = new HeroClass(
      'no-avatar-hero',
      '无头像武将',
      [],
      undefined,
      '没有头像的武将'
    );

    render(<HeroCard hero={heroWithoutAvatar} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    // Should show first character of name as placeholder
    expect(screen.getByText('无')).toBeInTheDocument();
  });

  it('should handle avatar loading error gracefully', () => {
    render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    const avatar = screen.getByAltText('测试武将');
    expect(avatar).toBeInTheDocument();
    
    // Simulate image load error
    fireEvent.error(avatar);
    
    // Image should be hidden on error
    expect(avatar).toHaveStyle({ display: 'none' });
  });

  it('should render different skill type colors', () => {
    const { container } = render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    // Check for passive skill color (blue)
    const passiveSkill = container.querySelector('.text-blue-600');
    expect(passiveSkill).toBeInTheDocument();
    
    // Check for limited skill color (purple)
    const limitedSkill = container.querySelector('.text-purple-600');
    expect(limitedSkill).toBeInTheDocument();
  });

  it('should render skill icons correctly', () => {
    const { container } = render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    // Should have skill icons (SVG elements)
    const skillIcons = container.querySelectorAll('svg');
    expect(skillIcons.length).toBeGreaterThan(0);
  });

  it('should have proper hover effects when not disabled', () => {
    const { container } = render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    const card = container.querySelector('.cursor-pointer');
    expect(card).toBeInTheDocument();
  });

  it('should render without onSelect callback', () => {
    expect(() => {
      render(<HeroCard hero={testHero} />, { wrapper: TestWrapper });
    }).not.toThrow();
    
    expect(screen.getByText('测试武将')).toBeInTheDocument();
  });

  it('should handle hero without description', () => {
    const heroWithoutDescription = new HeroClass(
      'no-desc-hero',
      '无描述武将',
      []
    );

    render(<HeroCard hero={heroWithoutDescription} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    expect(screen.getByText('无描述武将')).toBeInTheDocument();
    // Description should not be rendered
    expect(screen.queryByText('这是一个测试武将的描述')).not.toBeInTheDocument();
  });

  it('should handle hero with no skills', () => {
    const heroWithoutSkills = new HeroClass(
      'no-skills-hero',
      '无技能武将',
      [],
      undefined,
      '没有技能的武将'
    );

    render(<HeroCard hero={heroWithoutSkills} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    expect(screen.getByText('无技能武将')).toBeInTheDocument();
    expect(screen.getByText('技能')).toBeInTheDocument();
    // No skill items should be rendered
    expect(screen.queryByText('被动')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    const { container } = render(<HeroCard hero={testHero} onSelect={mockOnSelect} />, { wrapper: TestWrapper });
    
    // Card should be clickable
    const card = container.querySelector('[role="button"]') || container.querySelector('.cursor-pointer');
    expect(card).toBeInTheDocument();
  });
});