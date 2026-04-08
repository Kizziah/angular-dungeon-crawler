export type CellType = 'wall' | 'floor' | 'door' | 'stairs-up' | 'stairs-down' | 'chest' | 'trap' | 'entrance';

export interface Cell {
  type: CellType;
  visited: boolean;
  hasMonster: boolean;
  chestLooted: boolean;
  trapTriggered: boolean;
  doorLocked: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface DungeonFloor {
  level: number;
  width: number;
  height: number;
  cells: Cell[][];
  stairsUp: Position;
  stairsDown: Position;
  entrance: Position;
  seed: number;
}

export interface DungeonState {
  currentFloor: number;
  floors: { [level: number]: DungeonFloor };
  partyPosition: Position;
  partyDirection: 'N' | 'S' | 'E' | 'W';
}
