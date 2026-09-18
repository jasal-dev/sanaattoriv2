/** How long a tile's position/color transition takes -- must match FunnelTile's `duration-500` class. */
export const TILE_MOVE_DURATION_MS = 500

/** How long a solved/revealed tile takes to settle into its row before the game-over modal appears. */
export const GAME_OVER_MODAL_DELAY_MS = TILE_MOVE_DURATION_MS + 100
