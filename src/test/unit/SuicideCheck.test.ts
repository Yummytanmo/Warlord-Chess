import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '@/lib/gameManager';
import { PieceType, PlayerColor, Position, GamePhase } from '@/types/game';
import { PieceSetup } from '@/lib/pieceSetup';

describe('Suicide Prevention', () => {
    let gameManager: GameManager;

    beforeEach(() => {
        gameManager = new GameManager();
    });

    it('should prevent moving King into check (Direct Suicide)', () => {
        const gameState = gameManager.createNewGame();
        gameState.gamePhase = GamePhase.PLAYING;
        gameState.board.grid = Array(10).fill(null).map(() => Array(9).fill(null));

        const redKing = {
            id: 'r_k',
            type: PieceType.KING,
            color: PlayerColor.RED,
            position: { x: 4, y: 9 },
            isAlive: true,
            name: '帅'
        };

        const blackChariot = {
            id: 'b_c',
            type: PieceType.CHARIOT,
            color: PlayerColor.BLACK,
            position: { x: 3, y: 0 },
            isAlive: true,
            name: '车'
        };

        gameState.board.setPiece(redKing.position, redKing);
        gameState.board.setPiece(blackChariot.position, blackChariot);

        gameState.players[0].pieces = [redKing];
        gameState.players[1].pieces = [blackChariot];
        gameState.currentPlayer = PlayerColor.RED;

        // Move King to (3, 9), exposed to Chariot at (3, 0)
        const move = {
            from: { x: 4, y: 9 },
            to: { x: 3, y: 9 },
            piece: redKing,
            timestamp: Date.now()
        };

        const result = gameManager.executeMove(gameState, move);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('不能送将');
    });

    it('should prevent moving a pinned piece (Revealed Check)', () => {
        const gameState = gameManager.createNewGame();
        gameState.gamePhase = GamePhase.PLAYING;
        gameState.board.grid = Array(10).fill(null).map(() => Array(9).fill(null));

        const redKing = {
            id: 'r_k',
            type: PieceType.KING,
            color: PlayerColor.RED,
            position: { x: 4, y: 9 },
            isAlive: true,
            name: '帅'
        };

        // Use Chariot as blocker so it can move sideways
        const redBlocker = {
            id: 'r_c',
            type: PieceType.CHARIOT,
            color: PlayerColor.RED,
            position: { x: 4, y: 8 },
            isAlive: true,
            name: '车'
        };

        const blackChariot = {
            id: 'b_c',
            type: PieceType.CHARIOT,
            color: PlayerColor.BLACK,
            position: { x: 4, y: 0 }, // Attacking column 4
            isAlive: true,
            name: '车'
        };

        gameState.board.setPiece(redKing.position, redKing);
        gameState.board.setPiece(redBlocker.position, redBlocker);
        gameState.board.setPiece(blackChariot.position, blackChariot);

        gameState.players[0].pieces = [redKing, redBlocker];
        gameState.players[1].pieces = [blackChariot];
        gameState.currentPlayer = PlayerColor.RED;

        // Move Blocker away from column 4
        const move = {
            from: { x: 4, y: 8 },
            to: { x: 3, y: 8 },
            piece: redBlocker,
            timestamp: Date.now()
        };

        const result = gameManager.executeMove(gameState, move);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('不能送将');
    });

    it('should prevent Flying General (Kings facing each other)', () => {
        const gameState = gameManager.createNewGame();
        gameState.gamePhase = GamePhase.PLAYING;
        gameState.board.grid = Array(10).fill(null).map(() => Array(9).fill(null));

        const redKing = {
            id: 'r_k',
            type: PieceType.KING,
            color: PlayerColor.RED,
            position: { x: 4, y: 9 },
            isAlive: true,
            name: '帅'
        };

        // Use Chariot as blocker
        const redBlocker = {
            id: 'r_c',
            type: PieceType.CHARIOT,
            color: PlayerColor.RED,
            position: { x: 4, y: 8 },
            isAlive: true,
            name: '车'
        };

        const blackKing = {
            id: 'b_k',
            type: PieceType.KING,
            color: PlayerColor.BLACK,
            position: { x: 4, y: 0 }, // Facing Red King
            isAlive: true,
            name: '将'
        };

        gameState.board.setPiece(redKing.position, redKing);
        gameState.board.setPiece(redBlocker.position, redBlocker);
        gameState.board.setPiece(blackKing.position, blackKing);

        gameState.players[0].pieces = [redKing, redBlocker];
        gameState.players[1].pieces = [blackKing];
        gameState.currentPlayer = PlayerColor.RED;

        // Move Blocker away, exposing Kings
        const move = {
            from: { x: 4, y: 8 },
            to: { x: 3, y: 8 },
            piece: redBlocker,
            timestamp: Date.now()
        };

        const result = gameManager.executeMove(gameState, move);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('不能送将');
    });
});
