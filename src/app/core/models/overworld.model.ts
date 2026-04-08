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
  | 'city'
  | 'castle'
  | 'dungeon'
  | 'ship'
  | 'river'
  | 'bridge';

export interface OverworldCell {
  type: OverworldTileType;
  visited: boolean;
  passable: boolean;
  name?: string;
}

export interface OverworldState {
  map: OverworldCell[][];
  playerX: number;
  playerY: number;
  inShip: boolean;
  shipX: number | null;  // where the ship was left (if player disembarked)
  shipY: number | null;
}

export type OverworldEventType = 'move' | 'encounter' | 'enter-town' | 'enter-city' | 'enter-castle' | 'enter-dungeon' | 'blocked' | 'boarded' | 'disembarked';

export interface OverworldEvent {
  type: OverworldEventType;
  tile?: OverworldTileType;
  name?: string;
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
  city:     { char: 'Ω', color: '#ff9900', bg: '#1a0800' },
  castle:   { char: '◆', color: '#aaccff', bg: '#080a1a' },
  dungeon:  { char: '>', color: '#ff4444', bg: '#1a0000' },
  ship:     { char: 'S', color: '#00ddff', bg: '#0a1a55' },
  river:    { char: '≈', color: '#4488ff', bg: '#001133' },
  bridge:   { char: '═', color: '#aa8844', bg: '#002244' },
};

/** Tiles that trigger a random encounter */
export const ENCOUNTER_TILES = new Set<OverworldTileType>(['plains', 'forest', 'swamp']);

/** Tiles the player cannot walk on without a ship */
export const IMPASSABLE_TILES = new Set<OverworldTileType>(['ocean', 'river']);

/** Tiles passable only while in a ship */
export const SHIP_TILES = new Set<OverworldTileType>(['ocean', 'ship']);
