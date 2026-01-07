# Tasks: Verify Hero Skills Implementation

**Feature**: Verify Hero Skills Correctness
**Branch**: `006-add-hero-skills`
**Spec**: `/specs/006-add-hero-skills/spec.md`
**Plan**: `/specs/006-add-hero-skills/plan.md`

## Dependencies

- **Story Order**: Xiangyu -> Liubang -> Hanxin -> Xiaohe -> Zhangliang -> Fankui
- **Critical Path**: Code Review -> Test Execution

## Phase 1: Setup

- [x] T001 Verify feature branch 006-add-hero-skills is active and dependencies are installed

## Phase 2: Xiangyu Verification (Movement Modifiers)

**Goal**: Ensure "Bei Shui" (Pawn 2 steps/Cross river) and "Ba Wang" (Horse mechanics) match spec.

- [x] T002 [US1] Review src/lib/skills/xiangyu.ts against spec.md section 2.1
- [x] T003 [US1] Run and verify src/test/properties/xiangyu-skills.test.ts

## Phase 3: Liubang Verification (Palace/River Rules)

**Goal**: Ensure "Geng Yi" (King out), "Qin Zheng" (Line force), "Hong Men" (Advisor/Elephant) match spec.

- [x] T004 [US2] Review src/lib/skills/liubang.ts against spec.md section 2.2
- [x] T005 [US2] Run and verify src/test/properties/liubang-skills.test.ts

## Phase 4: Hanxin Verification (Markers & Placement)

**Goal**: Ensure "Dian Bing" (Markers/Placement), "Yong Bing" (Swap), "Yi Shan" (Gain marker) match spec.

- [x] T006 [US3] Review src/lib/skills/hanxin.ts against spec.md section 2.3
- [x] T007 [US3] Run and verify src/test/properties/hanxin-skills.test.ts

## Phase 5: Xiaohe Verification (Multi-Stage & Recovery)

**Goal**: Ensure "Yue Xia" (Return pieces), "Bai Ye" (Double King move), "Cheng Ye" (Awakening) match spec.

- [x] T008 [US4] Review src/lib/skills/xiaohe.ts against spec.md section 2.4
- [x] T009 [US4] Run and verify src/test/properties/xiaohe-skills.test.ts

## Phase 6: Zhangliang Verification (Extra Moves)

**Goal**: Ensure "Yun Chou" (King + Other), "Jue Sheng" (Double King on Check), "Shi Lv" (Awakening) match spec.

- [x] T010 [US5] Review src/lib/skills/zhangliang.ts against spec.md section 2.5
- [x] T011 [US5] Run and verify src/test/properties/zhangliang-skills.test.ts

## Phase 7: Fankui Verification (Exchange & Resurrection)

**Goal**: Ensure "Wu Jian" (Exchange), "Hu Zhu" (Resurrection), "Ci Jue" (Awakening) match spec.

- [x] T012 [US6] Review src/lib/skills/fankui.ts against spec.md section 2.6
- [x] T013 [US6] Run and verify src/test/properties/fankui-skills.test.ts

## Phase 8: Final Verification

- [x] T014 Run full test suite to ensure overall system stability