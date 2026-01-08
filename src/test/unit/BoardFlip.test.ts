import { describe, it, expect } from 'vitest';
import { getDisplayPos, BOARD_COLS, BOARD_ROWS } from '@/components/game/board/constants';

describe('Board Flip Logic', () => {
    it('should return same coordinates when not flipped', () => {
        const x = 3;
        const y = 4;
        const result = getDisplayPos(x, y, false);
        expect(result).toEqual({ x: 3, y: 4 });
    });

    it('should return inverted coordinates when flipped', () => {
        const x = 0;
        const y = 0;
        // Should become (8, 9)
        const result = getDisplayPos(x, y, true);
        expect(result).toEqual({
            x: BOARD_COLS - 1 - x,
            y: BOARD_ROWS - 1 - y
        });
    });

    it('should correctly flip center coordinates', () => {
        const x = 4;
        const y = 4; // River bank
        // Should become (4, 5)
        const result = getDisplayPos(x, y, true);
        expect(result).toEqual({
            x: BOARD_COLS - 1 - x,
            y: BOARD_ROWS - 1 - y
        });
        expect(result.x).toBe(4);
        expect(result.y).toBe(5);
    });

    it('should be reversible', () => {
        const x = 2;
        const y = 7;
        const flipped = getDisplayPos(x, y, true);
        const doubleFlipped = getDisplayPos(flipped.x, flipped.y, true);

        // Note: getDisplayPos transforms logical to visual.
        // If we apply the same transformation to the visual coordinates, we should get back the logical ones
        // because (N - (N - x)) = x
        expect(doubleFlipped).toEqual({ x, y });
    });
});
