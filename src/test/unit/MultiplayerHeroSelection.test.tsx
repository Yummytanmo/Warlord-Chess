import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MultiplayerHeroSelection } from '@/components/game/MultiplayerHeroSelection';
import { PlayerColor, GamePhase } from '@/types/game';
import { HeroClass } from '@/lib/heroes';

// Mock dependencies
const mockSelectHero = vi.fn();
const mockGameState = {
    gamePhase: GamePhase.HERO_SELECTION,
    players: [
        { id: 'p1', color: PlayerColor.RED, hero: null },
        { id: 'p2', color: PlayerColor.BLACK, hero: null }
    ]
};

vi.mock('@/store/gameStore', () => ({
    useGameStore: () => ({
        gameState: mockGameState,
        selectHero: mockSelectHero
    })
}));

const mockHeroes: HeroClass[] = [
    { id: 'h1', name: 'Hero 1', description: 'Desc 1', skills: [] } as any,
    { id: 'h2', name: 'Hero 2', description: 'Desc 2', skills: [] } as any
];

vi.mock('@/lib/heroes', () => ({
    getAllHeroes: () => mockHeroes,
    HeroClass: class { }
}));

// Mock HeroCard to simplify testing
vi.mock('@/components/game/HeroCard', () => ({
    HeroCard: ({ hero, isSelected, onSelect, disabled }: any) => (
        <div
            data-testid={`hero-card-${hero.id}`}
            onClick={() => !disabled && onSelect(hero)}
            data-selected={isSelected}
            data-disabled={disabled}
        >
            {hero.name}
        </div>
    )
}));

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

describe('MultiplayerHeroSelection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGameState.players[0].hero = null;
        mockGameState.players[1].hero = null;
    });

    it('should render available heroes', () => {
        render(<MultiplayerHeroSelection playerColor={PlayerColor.RED} />);

        expect(screen.getByText('Hero 1')).toBeInTheDocument();
        expect(screen.getByText('Hero 2')).toBeInTheDocument();
    });

    it('should handle preview selection flow', async () => {
        render(<MultiplayerHeroSelection playerColor={PlayerColor.RED} />);

        // Initial state: no confirm button
        expect(screen.queryByText('确认选择')).not.toBeInTheDocument();

        // Click hero to preview
        fireEvent.click(screen.getByTestId('hero-card-h1'));

        // Should show confirm button
        expect(screen.getByText('确认选择')).toBeInTheDocument();
        expect(screen.getByText('已选择: Hero 1')).toBeInTheDocument();

        // selectHero should NOT be called yet
        expect(mockSelectHero).not.toHaveBeenCalled();

        // Click confirm
        fireEvent.click(screen.getByText('确认选择'));

        // selectHero should be called
        expect(mockSelectHero).toHaveBeenCalledWith('p1', mockHeroes[0]);
    });

    it('should allow selecting same hero as opponent', () => {
        // Setup opponent with Hero 1
        mockGameState.players[1].hero = mockHeroes[0];

        render(<MultiplayerHeroSelection playerColor={PlayerColor.RED} />);

        // Hero 1 should NOT be disabled (unlike before)
        const heroCard = screen.getByTestId('hero-card-h1');
        expect(heroCard).toHaveAttribute('data-disabled', 'false');

        // Should be able to select it
        fireEvent.click(heroCard);

        // Should show confirm button
        expect(screen.getByText('确认选择')).toBeInTheDocument();

        // Confirm
        fireEvent.click(screen.getByText('确认选择'));
        expect(mockSelectHero).toHaveBeenCalledWith('p1', mockHeroes[0]);
    });

    it('should disable selection after confirmation', () => {
        // Setup me with Hero 1
        mockGameState.players[0].hero = mockHeroes[0];

        render(<MultiplayerHeroSelection playerColor={PlayerColor.RED} />);

        // Hero cards should be disabled
        const heroCard1 = screen.getByTestId('hero-card-h1');
        const heroCard2 = screen.getByTestId('hero-card-h2');

        expect(heroCard1).toHaveAttribute('data-disabled', 'true');
        expect(heroCard2).toHaveAttribute('data-disabled', 'true');
    });
});
