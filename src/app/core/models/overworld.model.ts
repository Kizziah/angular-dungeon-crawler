export type OverworldTileType =
  | 'ocean'
  | 'coast'
  | 'plains'
  | 'forest'
  | 'mountain'
  | 'snow'
  | 'swamp'
  | 'road'
  | 'town'
  | 'dungeon';

export interface OverworldCell {
  type: OverworldTileType;
  visited: boolean;
  passable: boolean;
}

export interface OverworldState {
  map: OverworldCell[][];
  playerX: number;
  playerY: number;
}

export type OverworldEventType = 'move' | 'encounter' | 'enter-town' | 'enter-dungeon' | 'blocked';

export interface OverworldEvent {
  type: OverworldEventType;
  tile?: OverworldTileType;
}

/** Render info for each tile type */
export const TILE_RENDER: Record<OverworldTileType, { char: string; color: string; bg?: string }> = {
  ocean:    { char: '~', color: '#2255cc', bg: '#0a1a55' },
  coast:    { char: '.', color: '#ddbb77', bg: '#1a1208' },
  plains:   { char: '.', color: '#44aa44', bg: '#0a1a0a' },
  forest:   { char: 'T', color: '#226622', bg: '#0a1a0a' },
  mountain: { char: '^', color: '#888888', bg: '#111111' },
  snow:     { char: '*', color: '#ccddee', bg: '#111122' },
  swamp:    { char: '%', color: '#557755', bg: '#0a1008' },
  road:     { char: '░', color: '#aa8844', bg: '#0a0800' },
  town:     { char: '#', color: '#ffcc00', bg: '#1a1100' },
  dungeon:  { char: '>', color: '#ff4444', bg: '#1a0000' },
};

/** Tiles that trigger a random encounter */
export const ENCOUNTER_TILES = new Set<OverworldTileType>(['plains', 'forest', 'swamp']);

/** Tiles the player cannot walk on */
export const IMPASSABLE_TILES = new Set<OverworldTileType>(['ocean']);
