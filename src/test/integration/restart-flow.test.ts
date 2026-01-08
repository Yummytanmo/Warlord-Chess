import { GameManager } from '../../lib/gameManager';
import { GamePhase, PlayerColor, GameState } from '../../types/game';
import { PieceSetup } from '../../lib/pieceSetup';
import { ChessBoard } from '../../lib/board';
import { getHeroById } from '../../lib/heroes';

describe('Restart and Reselect Flow Integration', () => {
    let gameManager: GameManager;
    let gameState: GameState;

    beforeEach(() => {
        gameManager = new GameManager();
        gameState = gameManager.createNewGame();

        // Setup players with heroes
        const xiangYu = getHeroById('xiangyu');
        const liuBang = getHeroById('liubang');

        if (xiangYu && liuBang) {
            gameState = gameManager.selectHero(gameState, gameState.players[0].id, xiangYu);
            gameState = gameManager.selectHero(gameState, gameState.players[1].id, liuBang);
        }

        // Make some moves to change state
        // Red Cannon to center
        const move1 = {
            from: { x: 1, y: 7 },
            to: { x: 4, y: 7 },
            piece: gameState.board.getPiece({ x: 1, y: 7 })!,
            timestamp: Date.now()
        };
        gameState = gameManager.executeMove(gameState, move1).newGameState!;
    });

    test('restartGame should reset board but keep players and heroes', () => {
        // Verify initial state has moves
        expect(gameState.moveHistory.length).toBe(1);
        expect(gameState.players[0].hero.id).toBe('xiangyu');

        // Restart game
        const restartedState = gameManager.restartGame(gameState.players);

        // Verify reset state
        expect(restartedState.moveHistory.length).toBe(0);
        expect(restartedState.gamePhase).toBe(GamePhase.PLAYING);
        expect(restartedState.currentPlayer).toBe(PlayerColor.RED);

        // Verify players and heroes are preserved
        expect(restartedState.players[0].hero.id).toBe('xiangyu');
        expect(restartedState.players[1].hero.id).toBe('liubang');

        // Verify board is reset (Cannon back to original position)
        const cannon = restartedState.board.getPiece({ x: 1, y: 7 });
        expect(cannon).toBeDefined();
        expect(cannon?.type).toBe('pao');
        expect(restartedState.board.getPiece({ x: 4, y: 7 })).toBeNull();
    });

    test('resetToHeroSelection should reset everything including heroes', () => {
        // Reset to hero selection
        const resetState = gameManager.resetToHeroSelection(gameState.players);

        // Verify reset state
        expect(resetState.moveHistory.length).toBe(0);
        expect(resetState.gamePhase).toBe(GamePhase.HERO_SELECTION);
        expect(resetState.currentPlayer).toBe(PlayerColor.RED);

        // Verify heroes are cleared
        expect(resetState.players[0].hero.id).toBe('empty');
        expect(resetState.players[1].hero.id).toBe('empty');

        // Verify board is reset
        const cannon = resetState.board.getPiece({ x: 1, y: 7 });
        expect(cannon).toBeDefined();
    });
});
