import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DualHeroInfoPanel } from '@/components/game/DualHeroInfoPanel';
import { useGameStore } from '@/store/gameStore';
import { PlayerColor, GamePhase } from '@/types/game';

// Mock dependencies
vi.mock('@/store/gameStore');
vi.mock('@/components/game/SkillPanel', () => ({
    SkillPanel: ({ playerId, viewOnly }: { playerId: string, viewOnly: boolean }) => (
        <div data-testid={`skill-panel-${playerId}`}>
            SkillPanel for {playerId} {viewOnly ? '(View Only)' : '(Interactive)'}
        </div>
    ),
}));

describe('DualHeroInfoPanel', () => {
    const mockPlayers = [
        {
            id: 'player-1',
            color: PlayerColor.RED,
            hero: { id: 'hero-1', name: '关羽', skills: [] },
            isConnected: true,
        },
        {
            id: 'player-2',
            color: PlayerColor.BLACK,
            hero: { id: 'hero-2', name: '曹操', skills: [] },
            isConnected: true,
        },
    ];

    const mockGameState = {
        players: mockPlayers,
        gamePhase: GamePhase.PLAYING,
        currentPlayer: PlayerColor.RED,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useGameStore as any).mockReturnValue({
            gameState: mockGameState,
        });
    });

    it('should render nothing if game state is missing', () => {
        (useGameStore as any).mockReturnValue({ gameState: null });
        const { container } = render(<DualHeroInfoPanel myColor={PlayerColor.RED} isMyTurn={true} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should render both players panels correctly for Red player', () => {
        render(<DualHeroInfoPanel myColor={PlayerColor.RED} isMyTurn={true} />);

        // Check Opponent (Black) Panel
        expect(screen.getByText('对方武将: 曹操')).toBeInTheDocument();
        expect(screen.getByText('仅查看')).toBeInTheDocument();
        expect(screen.getByTestId('skill-panel-player-2')).toHaveTextContent('(View Only)');

        // Check My (Red) Panel
        expect(screen.getByText('我的武将: 关羽')).toBeInTheDocument();
        expect(screen.getByText('当前回合')).toBeInTheDocument();
        expect(screen.getByTestId('skill-panel-player-1')).toHaveTextContent('(Interactive)');
    });

    it('should render both players panels correctly for Black player', () => {
        render(<DualHeroInfoPanel myColor={PlayerColor.BLACK} isMyTurn={false} />);

        // Check Opponent (Red) Panel
        expect(screen.getByText('对方武将: 关羽')).toBeInTheDocument();
        expect(screen.getByText('仅查看')).toBeInTheDocument();
        expect(screen.getByTestId('skill-panel-player-1')).toHaveTextContent('(View Only)');

        // Check My (Black) Panel
        expect(screen.getByText('我的武将: 曹操')).toBeInTheDocument();
        // Should not show "Current Turn" if isMyTurn is false
        expect(screen.queryByText('当前回合')).not.toBeInTheDocument();
        expect(screen.getByTestId('skill-panel-player-2')).toHaveTextContent('(Interactive)');
    });
});
