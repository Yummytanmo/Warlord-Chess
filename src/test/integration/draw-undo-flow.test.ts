import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameManager } from '../../lib/gameManager';
import { PlayerColor, GamePhase, GameState } from '../../types/game';
import { createDefaultRuleContext } from '../../types/rules';

// Mock socket client
vi.mock('../../lib/multiplayer/socketClient', () => ({
    requestDraw: vi.fn(),
    respondDraw: vi.fn(),
    requestUndo: vi.fn(),
    respondUndo: vi.fn(),
    surrender: vi.fn(),
}));

describe('Draw and Undo Integration Flow', () => {
    let gameManager: GameManager;
    let gameState: GameState;

    beforeEach(() => {
        gameManager = new GameManager();
        gameState = gameManager.createNewGame();
        // Simulate game started
        gameState.gamePhase = GamePhase.PLAYING;
        // Set up players
        gameState.players[0].id = 'player-red';
        gameState.players[0].hero = { id: 'hero1', name: 'Hero 1', skills: [], awakened: false };
        gameState.players[1].id = 'player-black';
        gameState.players[1].hero = { id: 'hero2', name: 'Hero 2', skills: [], awakened: false };
    });

    it('should handle undo move correctly', () => {
        // 1. Red moves
        const redPawn = gameState.players[0].pieces.find(p => p.type === 'pawn')!;
        const move1 = {
            from: redPawn.position,
            to: { x: redPawn.position.x, y: redPawn.position.y - 1 },
            piece: redPawn,
            timestamp: Date.now()
        };

        const result1 = gameManager.executeMove(gameState, move1);
        expect(result1.success).toBe(true);
        gameState = result1.newGameState!;

        expect(gameState.currentPlayer).toBe(PlayerColor.BLACK);
        expect(gameState.moveHistory.length).toBe(1);

        // 2. Undo last move
        const undoState = gameManager.undoLastMove(gameState);
        expect(undoState).not.toBeNull();

        if (undoState) {
            expect(undoState.currentPlayer).toBe(PlayerColor.RED);
            expect(undoState.moveHistory.length).toBe(0);

            // Verify piece position reset
            const resetPawn = undoState.players[0].pieces.find(p => p.id === redPawn.id)!;
            expect(resetPawn.position).toEqual(redPawn.position);
        }
    });

    it('should handle multiple undo moves', () => {
        // 1. Red moves
        const redPawn = gameState.players[0].pieces.find(p => p.type === 'pawn')!;
        const move1 = {
            from: redPawn.position,
            to: { x: redPawn.position.x, y: redPawn.position.y - 1 },
            piece: redPawn,
            timestamp: Date.now()
        };
        gameState = gameManager.executeMove(gameState, move1).newGameState!;

        // 2. Black moves
        const blackPawn = gameState.players[1].pieces.find(p => p.type === 'pawn')!;
        const move2 = {
            from: blackPawn.position,
            to: { x: blackPawn.position.x, y: blackPawn.position.y + 1 },
            piece: blackPawn,
            timestamp: Date.now()
        };
        gameState = gameManager.executeMove(gameState, move2).newGameState!;

        expect(gameState.moveHistory.length).toBe(2);

        // 3. Undo Black's move
        gameState = gameManager.undoLastMove(gameState)!;
        expect(gameState.currentPlayer).toBe(PlayerColor.BLACK);
        expect(gameState.moveHistory.length).toBe(1);

        // 4. Undo Red's move
        gameState = gameManager.undoLastMove(gameState)!;
        expect(gameState.currentPlayer).toBe(PlayerColor.RED);
        expect(gameState.moveHistory.length).toBe(0);
    });
});
