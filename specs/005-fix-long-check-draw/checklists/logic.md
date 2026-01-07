# Checklist: Game Logic Requirements

**Purpose**: Validate the quality, completeness, and safety of the "Long Check Draw" logic requirements.
**Domain**: Game Rules / Logic
**Created**: 2026-01-07

## Requirement Completeness
- [ ] CHK001 Are the exact conditions for "Long Check" (number of moves, player sequence) fully specified? [Completeness, Spec §2]
- [ ] CHK002 Is the reset condition for the consecutive check counter defined (e.g., upon a non-checking move)? [Gap]
- [ ] CHK003 Are requirements defined for game end state transitions when Long Check is detected? [Completeness]
- [ ] CHK004 Is the behavior specified if a "Long Check" also results in a Checkmate? (Which takes precedence?) [Edge Case, Gap]

## Requirement Clarity
- [ ] CHK005 Is "Consecutive" unambiguously defined? (Does it mean *every* half-move is a check, or just one player's moves?) [Clarity, Spec §2]
- [ ] CHK006 Is the distinction between "Check" (attack on King) and "Move" (any piece movement) clear in the requirements? [Clarity]
- [ ] CHK007 Are the criteria for "Accurate Check Detection" quantified or referenced to standard chess rules? [Clarity]

## Logic Consistency
- [ ] CHK008 Does the `isCheck` flag requirement align with the existing `Move` data structure? [Consistency, Plan §Data Model]
- [ ] CHK009 Are the Long Check rules consistent with other draw conditions (e.g., 200 move limit)? [Consistency]
- [ ] CHK010 Is the "Player Experience" goal (continue normally if not checking) consistent with the proposed logic? [Consistency, Spec §3]

## Edge Case Coverage
- [ ] CHK011 Are requirements defined for scenarios where a player has *no choice* but to check (forced moves)? [Edge Case, Gap]
- [ ] CHK012 Is the scenario of "Multi-piece check" (discovered check + direct check) covered? [Coverage]
- [ ] CHK013 Are requirements specified for undoing a move that caused a Long Check draw? [Edge Case, Gap]
- [ ] CHK014 Is the behavior defined for "Perpetual Chase" vs "Perpetual Check"? (Are they treated differently?) [Gap]

## Non-Functional Requirements
- [ ] CHK015 Are performance budgets defined for the `isCheck` calculation to maintain 60fps? [Performance, Plan §Constraints]
- [ ] CHK016 Is the memory impact of storing `isCheck` on every move history item evaluated? [Performance]
- [ ] CHK017 Are thread-safety or side-effect constraints defined for the `executeMove` update? [Reliability]

## Testability
- [ ] CHK018 Can the "6 consecutive checks" condition be objectively simulated in tests? [Measurability]
- [ ] CHK019 Are the criteria for "No false positives" (normal play) verifiable? [Measurability]
