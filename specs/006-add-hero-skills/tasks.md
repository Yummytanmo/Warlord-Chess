# Tasks: Implement Hero Skills

**Feature**: Implement Hero Skills
**Branch**: `006-add-hero-skills`
**Spec**: `/specs/006-add-hero-skills/spec.md`
**Plan**: `/specs/006-add-hero-skills/plan.md`

## Dependencies

- **Story Order**: Foundation -> Xiangyu -> Liubang -> Hanxin -> Xiaohe -> Zhangliang -> Fankui
- **Critical Path**: GameState updates -> GameManager multi-turn logic -> Specific Skills

## Phase 1: Setup

- [x] T001 Verify feature branch 006-add-hero-skills is active

## Phase 2: Foundational

**Goal**: Extend core systems to support complex skill mechanics (state persistence, multi-stage turns).

- [x] T002 Update GameState interface in src/types/game.ts to include turnState and markers
- [x] T003 Update SkillState interface in src/types/game.ts to include customData
- [x] T004 Implement PieceSetup.getInitialPosition helper in src/lib/pieceSetup.ts
- [x] T005 Update GameManager.executeMove in src/lib/gameManager.ts to handle multi-stage turns (turnState)
- [x] T006 [P] Update RuleContext in src/types/rules.ts to ensure all skill flags are present (move modifiers)

## Phase 3: Xiangyu (Movement Modifiers)

**Goal**: Implement "Bei Shui" (Pawn movement) and "Ba Wang" (Horse mechanics).
**Test Criteria**: Pawn moves 2 steps, Horse ignores limp legs.

- [x] T007 [US1] Create property tests for Xiangyu's skills in src/test/properties/xiangyu-skills.test.ts
- [x] T008 [US1] Implement Xiangyu's skill logic in src/lib/skills/xiangyu.ts
- [x] T009 [US1] Update ChessMoveValidator in src/lib/moveValidator.ts to apply Xiangyu's RuleContext flags

## Phase 4: Liubang (Palace/River Rules)

**Goal**: Implement "Geng Yi" (King out), "Qin Zheng" (Flying General), "Hong Men" (Advisor/Elephant).
**Test Criteria**: King leaves palace, Elephant crosses river/ignores eye.

- [x] T010 [US2] Create property tests for Liubang's skills in src/test/properties/liubang-skills.test.ts
- [x] T011 [US2] Implement Liubang's skill logic in src/lib/skills/liubang.ts
- [x] T012 [US2] Update ChessMoveValidator in src/lib/moveValidator.ts to apply Liubang's RuleContext flags

## Phase 5: Hanxin (Markers & Placement)

**Goal**: Implement "Dian Bing" (Markers/Placement) and "Yong Bing" (Swap).
**Test Criteria**: Start with no pawns, consume markers to place pawns.

- [x] T013 [US3] Create property tests for Hanxin's skills (markers/placement) in src/test/properties/hanxin-skills.test.ts
- [x] T014 [US3] Implement Hanxin's skill logic (Dian Bing/Yong Bing) in src/lib/skills/hanxin.ts
- [x] T015 [US3] Create SkillInteraction component for placing pieces in src/components/game/SkillInteraction.tsx

## Phase 6: Xiaohe (Multi-Stage & Recovery)

**Goal**: Implement "Yue Xia" (Return pieces) and "Bai Ye" (Double King move).
**Test Criteria**: King moves twice, pieces return to start.

- [x] T016 [US4] Create property tests for Xiaohe's skills in src/test/properties/xiaohe-skills.test.ts
- [x] T017 [US4] Implement Xiaohe's skill logic in src/lib/skills/xiaohe.ts
- [x] T018 [US4] Integrate Xiaohe's skill state with GameManager's turnState logic

## Phase 7: Zhangliang (Extra Moves)

**Goal**: Implement "Yun Chou" (King + Other move) and "Jue Sheng" (Double King move on check).
**Test Criteria**: Turn continues after King move.

- [x] T019 [US5] Create property tests for Zhangliang's skills in src/test/properties/zhangliang-skills.test.ts
- [x] T020 [US5] Implement Zhangliang's skill logic in src/lib/skills/zhangliang.ts
- [x] T021 [US5] Implement awakening logic for Shi Lv (Add piece)

## Phase 8: Fankui (Exchange & Resurrection)

**Goal**: Implement "Wu Jian" (Exchange) and "Hu Zhu" (Resurrection).
**Test Criteria**: Pieces exchanged, King resurrected.

- [x] T022 [US6] Create property tests for Fankui's skills in src/test/properties/fankui-skills.test.ts
- [x] T023 [US6] Implement Fankui's skill logic in src/lib/skills/fankui.ts
- [x] T024 [US6] Implement Ci Jue awakening logic (Place removed piece)

## Phase 9: Polish & Cross-Cutting

- [x] T025 Run full test suite to ensure no regressions
- [x] T026 Verify performance of multi-stage turn validation
- [x] T027 [P] Polish SkillInteraction UI for better feedback

## Implementation Strategy

1.  **Core Extension**: First enable `GameManager` to handle "not ending turn" (turnState).
2.  **Simple Modifiers**: Implement passive rule changers (Xiangyu/Liubang) to verify RuleContext.
3.  **Complex Logic**: Implement Active Skills (Hanxin/Fankui) requiring UI and Board manipulation.
4.  **Multi-Stage**: Implement Turn manipulators (Xiaohe/Zhangliang).
