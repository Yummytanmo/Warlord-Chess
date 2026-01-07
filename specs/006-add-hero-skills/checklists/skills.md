# Checklist: Hero Skill Requirements

**Purpose**: Validate the quality, completeness, and clarity of the requirements for the new Hero Skills feature.
**Domain**: Game Rules / Skills
**Created**: 2026-01-07

## Requirement Completeness
- [ ] CHK001 Are the exact triggers for all passive skills defined (e.g., "Ba Wang" effect on Horse)? [Completeness, Spec §2.1]
- [ ] CHK002 Are the conditions for "Multi-stage Turns" fully specified (start, end, interruption)? [Completeness, Plan §Research 1]
- [ ] CHK003 Is the initial state for Hanxin (0 pawns, 2 markers) explicitly defined in the data model? [Completeness, Spec §2.3]
- [ ] CHK004 Are the interaction steps for "Dian Bing" (placing pawns) defined (e.g., UI flow)? [Gap]
- [ ] CHK005 Is the definition of "Same name piece" for Fankui and Zhangliang clear and unambiguous? [Ambiguity, Spec §2.6]

## Requirement Clarity
- [ ] CHK006 Is the timing of Xiaohe's "Yue Xia" return (next turn vs immediate) clarified? [Ambiguity, Spec §2.4]
- [ ] CHK007 Is the definition of "Consecutive Turns" for Xiangyu's "Ba Wang" unambiguous? [Clarity, Spec §2.1]
- [ ] CHK008 Are the "River crossing" rules for Xiangyu's "Bei Shui" precisely defined (rank indices)? [Clarity, Spec §2.1]
- [ ] CHK009 Is the "Elephant Eye" blocking rule modification for Liubang's "Hong Men" clearly stated? [Clarity, Spec §2.2]

## Logic Consistency
- [ ] CHK010 Do the skill effects conflict with basic movement rules (e.g., bounding box)? [Consistency]
- [ ] CHK011 Is the interaction between "Qin Zheng" (Liubang) and "Geng Yi" (King out of palace) consistent? [Consistency, Spec §2.2]
- [ ] CHK012 Are the "Limited Skill" usage tracking mechanisms defined in the data model? [Traceability, Plan §Data Model]

## Edge Case Coverage
- [ ] CHK013 Is the behavior defined if a multi-stage turn cannot be completed (e.g., no valid second move)? [Edge Case, Gap]
- [ ] CHK014 Are requirements specified for undoing a skill-triggered action (e.g., un-placing a pawn)? [Edge Case, Gap]
- [ ] CHK015 Is the interaction defined if two Fankui players try to exchange pieces simultaneously? [Edge Case]
- [ ] CHK016 What happens if Hanxin has 5 markers but no valid placement spots (blocked board)? [Edge Case]

## Non-Functional Requirements
- [ ] CHK017 Are performance constraints defined for skill validation logic? [Performance]
- [ ] CHK018 Is the visual feedback for active skills (markers, highlights) specified? [UX]

## Testability
- [ ] CHK019 Can the "random placement" of Hanxin's 5 pawns be tested deterministically? [Measurability]
- [ ] CHK020 Are the conditions for "First time being Checked" (Zhangliang) verifiable in state? [Measurability, Spec §2.5]