# Research: Modernize Board UI

## 1. Next.js & Konva SSR
**Problem**: `konva` and `react-konva` depend on the DOM `canvas` element, which is unavailable during Server-Side Rendering (SSR). Importing them directly in a page component causes build/runtime errors ("window is not defined" or similar).
**Solution**:
- Use `next/dynamic` to lazy load the board component with `{ ssr: false }`.
- Example:
  ```typescript
  const GameBoard = dynamic(() => import('@/components/game/board/GameBoard'), {
    ssr: false,
    loading: () => <div>Loading Board...</div>
  });
  ```

## 2. Responsive Canvas
**Problem**: Konva `Stage` needs explicit pixel dimensions (`width`, `height`). CSS percentage widths don't work directly on Canvas resolution.
**Solution**:
- Use a wrapper container `div` that fills the available space.
- Use a `ResizeObserver` (or a hook like `useResizeObserver`) to measure the wrapper's dimensions.
- Pass these dimensions to the `Stage`.
- Re-calculate `cellSize` and `scale` based on these dimensions.

## 3. High-Quality Assets
**Problem**: Loading large images for wood texture is slow.
**Solution**:
- **Board Background**: Use CSS `background` on the wrapper `div` behind the Canvas. This allows using high-res repeating patterns or CSS gradients without canvas overhead.
- **Pieces**: Use `Konva.Circle` with `shadow` + `Konva.Text`. This is lightweight, crisp at any zoom, and performant. No image assets needed for MVP.

## 4. Layer Architecture
- **Stage**
  - **Layer (Background)**: Grid lines, River text. `listening={false}` for performance.
  - **Layer (Highlights)**: Valid move markers, Last move indicator.
  - **Layer (Pieces)**: The pieces. `listening={true}`.
  - **Layer (UI)**: (Optional) Animations or floating text.
