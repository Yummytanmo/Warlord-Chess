# Specification: Modernize Board UI

## 1. Background
The current game uses a fallback HTML/CSS board implementation (`FallbackBoard.tsx`) because the initial Konva.js integration was either incomplete or disabled. The goal is to replace this fallback with a fully functional, visually appealing, and high-performance board using `react-konva` (Konva.js), aligning with the "Performance Priority Architecture" and "Player Experience First" principles of the project constitution.

## 2. Requirements

### 2.1 Visual Design
- **Board Aesthetics**:
  - Use a high-quality wood texture or a clean, modern vector background for the board.
  - Render crisp grid lines (楚河汉界) and coordinate markers.
  - Implement a visual style that feels "modern yet traditional" (e.g., minimalist pieces with traditional calligraphy, or stylized tokens).
- **Piece Design**:
  - Replace simple HTML circles with Konva `Circle` or `Image` nodes.
  - Use distinct colors/gradients for Red (Crimson/Gold) and Black (Charcoal/Silver).
  - Add shadows and depth to pieces to make them pop off the board.
  - *Optional*: Animated selection state (e.g., pulsing glow).

### 2.2 Interactions
- **Selection**: Clicking a piece should highlight it visually (glow, scale up, or distinct border).
- **Movement**:
  - Valid move indicators should be rendered on the board layer (e.g., distinct dots or highlights on grid intersections).
  - Smooth animation for piece movement (using Konva's `Tween` or `react-konva` transition props).
  - *Feedback*: Visual cues for capturing an enemy piece (e.g., flash, shake).

### 2.3 Performance
- **Canvas Rendering**: Use `react-konva` to render the entire board state.
- **Layering**:
  - **Background Layer**: Static board image/grid (rarely re-renders).
  - **Grid/Highlight Layer**: Dynamic valid move markers.
  - **Piece Layer**: Dynamic pieces (frequent updates).
- **Optimization**: Ensure 60fps performance during animations. Use `listening={false}` for static background elements to optimize hit detection.

### 2.4 Technical Constraints
- **Library**: Must use `react-konva` and `konva`.
- **Responsive**: The board must scale to fit the container (desktop/tablet sizes).
- **State Integration**: Must connect to `useGameStore` for game state (pieces, selection, valid moves).

## 3. User Stories
- As a player, I want to see a beautiful, high-resolution board so that the game feels premium.
- As a player, I want smooth animations when pieces move so that I can easily track the game flow.
- As a player, I want clear visual indicators for selected pieces and valid moves so that I don't make mistakes.

## 4. Implementation Details
- **Component Structure**:
  - `GameBoard.tsx`: Main container, handles sizing and `Stage`.
  - `BoardLayer.tsx`: Renders background, grid, river.
  - `PieceLayer.tsx`: Renders all pieces.
  - `HighlightLayer.tsx`: Renders selection and valid move markers.
- **Asset Strategy**:
  - Use CSS/Canvas primitives for board wood texture/lines initially (to avoid large asset deps), or high-quality SVG if available.
  - Use text/font rendering for Piece characters to maintain crispness at any scale.

## 5. Migration Plan
- Remove `FallbackBoard.tsx` usage in `GameBoard.tsx`.
- Refactor `GameBoard.tsx` to initialize `Stage` and `Layer`.
- Implement sub-components (`BoardLayer`, `PieceLayer`) one by one.
