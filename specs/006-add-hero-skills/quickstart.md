# Quickstart: Testing Hero Skills

## 1. Unit Tests
Each hero has a dedicated test file in `src/test/properties/` or `src/test/unit/`.
Run specific tests:
```bash
npm test src/test/properties/xiangyu-skills.test.ts
npm test src/test/properties/liubang-skills.test.ts
# ... (create files for others)
```

## 2. Manual Verification
1.  **Xiangyu**: Pick Xiangyu. Move Pawn. Verify 2-step move.
2.  **Liubang**: Pick Liubang. Try moving King out of Palace.
3.  **Hanxin**: Pick Hanxin. Verify board has no pawns. Use "Dian Bing" to place pawns.
4.  **Xiaohe**: Use "Yue Xia". End turn. Verify pieces return.
5.  **Zhangliang**: Move King. Verify turn doesn't end. Move another piece.
6.  **Fankui**: Use "Wu Jian". Select own piece, select opponent same piece. Verify both removed.
