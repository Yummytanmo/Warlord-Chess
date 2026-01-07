# Specification: Implement Hero Skills

## 1. Background
The game currently supports basic Xiangqi rules and a framework for Hero Skills. We need to implement the specific skills for 6 heroes: Xiangyu, Liubang, Hanxin, Xiaohe, Zhangliang, and Fankui. These skills introduce unique mechanics affecting movement, pieces, and game flow.

## 2. Hero Requirements

### 2.1 Xiangyu (项羽)
- **Bei Shui (背水)**:
  - **Condition**: Pawn (Soldier) movement.
  - **Effect (Before River)**: Pawn can move 2 steps forward (cross river directly?) -> *Correction based on text*: "Can move directly across river in one step" (implies 2 steps forward if at edge?). "兵未过河前可以一步直接过河" usually means from the rank before river, move 2 squares to cross.
  - **Effect (After River)**: Can move 2 steps (consecutively?) in one turn, but max 1 step forward. *Text*: "每次走棋可以连走两步，但是最多只能前进一步". This implies (1 step side/back + 1 step side/back) OR (1 step forward + 1 step side).
- **Ba Wang (霸王)**:
  - **Type**: Locking Skill (Passive).
  - **Effect 1**: Horse is not blocked by "legs" (limp legs rule ignored), UNLESS the Horse is under attack.
  - **Effect 2**: Cannot move the Horse in two consecutive turns.

### 2.2 Liubang (刘邦)
- **Geng Yi (更衣)**:
  - **Effect**: King (General) can move outside the Palace (Nine Palaces).
- **Qin Zheng (亲征)**:
  - **Type**: Limited Skill (Once per game?).
  - **Effect**: End current turn immediately. Force opponent's King to be on the same file as your King (Flying General rule logic).
    - If Kings meet (no obstacles): Skill fails? *Text*: "双方将若见面则无法发动".
    - If obstacles exist: Remove obstacles (damage source considered as your King).
    - If opponent King is outside Palace: Opponent King cannot move anymore.
- **Hong Men (鸿门)**:
  - **Effect**: Advisors (Shi) can move outside Palace but cannot cross the River.
  - **Effect**: Elephants (Xiang) are not blocked by "Elephant Eye" (can jump even if blocked).

### 2.3 Hanxin (韩信)
- **Dian Bing (点兵)**:
  - **Type**: Locking Skill.
  - **Initial State**: Start with NO Pawns on board. Start with 2 "Pawn Markers".
  - **Turn Start**: Can consume X markers (X<=2) to place X Pawns anywhere inside own River bank (Home side).
  - **Condition (5 Markers)**: When holding 5 markers, clear ALL pieces on both Pawn Ranks (Soldier lines) and place 5 Pawns anywhere on these two lines.
- **Yong Bing (用兵)**:
  - **Type**: Limited Skill.
  - **Effect**: At turn end, swap positions of any one of your pieces with one of your Pawns.
- **Yi Shan (益善)**:
  - **Effect**: When ANY piece capable of crossing river (Chariot, Horse, Cannon, Pawn, King w/Geng Yi?) is removed from board, gain 1 Pawn Marker.
  - **Restriction**: Converted/placed Pawns cannot trigger "Dian Bing" logic (circular dependency prevention?). *Text*: "转化后的兵不能触发'点兵'".

### 2.4 Xiaohe (萧何)
- **Yue Xia (月下)**:
  - **Type**: Limited Skill.
  - **Effect**: End current turn. Choose one of your pieces on board. Choose one of your *removed* pieces. Both return to their initial opening positions in the next turn (or immediately?). *Text*: "在下一回合回到开局位置". Ambiguous: does it happen automatically at start of next turn? Or do they move there?
- **Cheng Ye (成也)**:
  - **Type**: Awakening Skill.
  - **Condition**: "Yue Xia" has been used.
  - **Effect**: One of the "Yue Xia" targets can move one extra step after capturing a piece. This extra step cannot capture.
- **Bai Ye (败也)**:
  - **Type**: Locking Skill.
  - **Effect**: After moving the King, must move the King again (immediately? or next turn?). *Text*: "必须再移动一步将". Implies double move for King always.

### 2.5 Zhangliang (张良)
- **Yun Chou (运筹)**:
  - **Effect**: After moving King, can move another piece (except Chariot).
- **Jue Sheng (决胜)**:
  - **Type**: Limited Skill.
  - **Condition**: First time being Checked (called "General").
  - **Effect**: Can move King twice consecutively.
- **Shi Lv (拾履)**:
  - **Type**: Awakening Skill.
  - **Condition**: King captures a piece for the first time.
  - **Effect**: Choose a piece with same name (as captured?) or same name as one of yours? *Text*: "可选择同名的一个子增加在九宫之内任意位置". "Same name piece" usually means if King captured a Pawn, add a Pawn? Or if King is "Jiang", add "Jiang"? (Impossible). Probably means "Same type as captured piece".

### 2.6 Fankui (樊哙)
- **Wu Jian (舞剑)**:
  - **Type**: Limited Skill.
  - **Effect**: At any moment, use one of your pieces to mutually destroy an opponent's piece of the same name (Exchange).
- **Hu Zhu (护主)**:
  - **Type**: Limited Skill.
  - **Condition**: When King is removed (Captured?).
  - **Effect**: Return King to previous position. Return the attacking piece to its initial position.
- **Ci Jue (赐爵)**:
  - **Type**: Awakening Skill.
  - **Condition**: Both Limited Skills used.
  - **Effect**: Place a *removed* piece anywhere on board.

## 3. Technical Constraints
- **State Management**: Complex states (markers, awakened status, limited skill usage) must be persisted in `GameState`.
- **Turn Sequence**: Some skills allow multiple moves (Zhangliang, Xiaohe, Xiangyu). The engine must support "Partial Turn" or "Multi-stage Turn".
- **Skill Triggers**: Need triggers for "Turn Start", "Turn End", "On Capture", "On Move", "On Check", "On Death".
- **UI**: Need UI for placing pieces (Hanxin, Fankui), selecting targets (Xiaohe, Fankui).

## 4. Open Questions (To be resolved in Research)
- **Xiangyu/Bei Shui**: Exact movement logic for "2 steps".
- **Xiaohe/Yue Xia**: "Next turn return to initial position" - exact timing?
- **Hanxin/Dian Bing**: "Pawn Markers" UI and logic.
- **Zhangliang/Shi Lv**: "Same name piece" definition.
