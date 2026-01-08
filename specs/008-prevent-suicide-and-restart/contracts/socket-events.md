# Data Model
No persistent data model changes.

# Socket Events Contract

## Restart Game
### Request
- **Event**: `game:restart:request`
- **Payload**: `{ requestingPlayerId: string }`

### Response
- **Event**: `game:restart:response`
- **Payload**: `{ accept: boolean }`

### Action (if accepted)
- **Event**: `game:init` (or `game:state`)
- **Payload**: `{ gameState: NewGameState }`

## Reselect Hero
### Request
- **Event**: `game:reselect:request`
- **Payload**: `{ requestingPlayerId: string }`

### Response
- **Event**: `game:reselect:response`
- **Payload**: `{ accept: boolean }`

### Action (if accepted)
- **Event**: `game:state`
- **Payload**: `{ gameState: ResetGameState }` (Phase = HERO_SELECTION)
