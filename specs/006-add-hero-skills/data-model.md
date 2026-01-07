# Data Model: Hero Skills

## 1. GameState Updates
```typescript
interface GameState {
  // ... existing fields
  
  // For Multi-stage turns
  turnState?: {
    phase: 'normal' | 'extra_move' | 'force_move' | 'skill_interaction';
    sourceSkillId?: string;
    requiredPieceId?: string; // ID of piece that MUST be moved
    bannedPieceTypes?: PieceType[]; // Types that CANNOT be moved
    remainingMoves: number;
    context?: any; // Extra data (e.g. tracking "Yue Xia" targets)
  };

  // For Hanxin's markers
  markers: Record<string, number>; // playerColor -> count
}
```

## 2. Skill State Updates
```typescript
interface SkillState {
  // ... existing fields
  
  // Custom data for specific skills
  // e.g. Hanxin: { exchangedPieceId: string }
  // e.g. Xiaohe: { yueXiaTargets: { onBoard: string, removed: string } }
  customData?: Record<string, any>;
}
```

## 3. Skill Payload
```typescript
interface SkillUseParams {
  skillId: string;
  targetPosition?: Position;
  targetPieceId?: string;
  secondaryTargetPieceId?: string; // For swapping/exchanging
  extraParams?: any;
}
```
