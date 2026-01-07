# Quickstart: Testing Long Check Draw

To verify the fix:

1.  **Run Unit Tests**:
    ```bash
    npm run test:unit src/test/unit/gameManager.test.ts
    ```

2.  **Manual Verification**:
    - Start the game.
    - Make moves that do NOT check. Ensure game continues past 6 moves.
    - Setup a position where you can check the opponent repeatedly.
    - Check 3 times (opponent escapes/blocks 3 times) -> Total 6 ply.
    - Verify game ends with "Draw".
