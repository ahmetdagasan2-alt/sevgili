export const GRID_SIZES = [3, 4, 5] as const;
export type GridSize = (typeof GRID_SIZES)[number];

export const GRID_LABELS: Record<GridSize, string> = {
  3: "Kolay · 3×3",
  4: "Orta · 4×4",
  5: "Zor · 5×5",
};

export function parseGridSize(value: unknown): GridSize {
  const n = Number(value);
  return (GRID_SIZES as readonly number[]).includes(n) ? (n as GridSize) : 3;
}

/**
 * Returns a shuffled board: board[slot] = piece index.
 * Any permutation is solvable in a swap puzzle; we only make sure no piece
 * starts in its home slot so the board never looks half-solved.
 */
export function shuffledBoard(count: number): number[] {
  const board = Array.from({ length: count }, (_, i) => i);
  // Sattolo's algorithm: a random single cycle, so no fixed points.
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    [board[i], board[j]] = [board[j], board[i]];
  }
  return board;
}

export function isSolved(board: number[]) {
  return board.every((piece, slot) => piece === slot);
}
