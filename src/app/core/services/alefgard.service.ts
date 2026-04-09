import { Injectable } from '@angular/core';
import {
  OverworldTileType, OverworldCell, OverworldState, OverworldEvent,
  IMPASSABLE_TILES, ENCOUNTER_TILES
} from '../models/overworld.model';

export const ALEFGARD_W = 80;
export const ALEFGARD_H = 60;
export const ALEFGARD_START_X = 21;
export const ALEFGARD_START_Y = 22;

const ENCOUNTER_CHANCE = 0.08;

const CHAR_MAP: Record<string, OverworldTileType> = {
  '~': 'ocean', '.': 'coast', ',': 'plains', 'f': 'forest',
  '^': 'mountain', '*': 'snow', '%': 'swamp', '=': 'road',
  '>': 'dungeon', 'p': 'portal',
};

const NAMED_LOCATIONS: { x: number; y: number; type: 'town' | 'city' | 'castle' | 'dungeon'; name: string }[] = [
  // Castles
  { x: 21, y: 18, type: 'castle', name: 'Tantegel Castle' },
  { x: 50, y: 44, type: 'castle', name: 'Charlock Castle' },
  // Towns
  { x: 21, y: 22, type: 'town',   name: 'Brecconary' },
  { x: 40, y:  8, type: 'town',   name: 'Kol' },
  { x: 14, y: 42, type: 'town',   name: 'Garinham' },
  { x: 63, y: 27, type: 'town',   name: 'Rimuldar' },
  { x: 36, y: 48, type: 'town',   name: 'Hauksness' },
  { x: 18, y: 50, type: 'town',   name: 'Cantlin' },
  // Dungeons
  { x: 30, y: 14, type: 'dungeon', name: 'Mountain Cave' },
  { x: 46, y: 38, type: 'dungeon', name: 'Swamp Cave' },
  { x: 42, y: 48, type: 'dungeon', name: "Erdrick's Cave" },
];

const RAW_MAP: string[] = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~..........................................................~~~~~~~~~~~~~~',
  '~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~',
  '~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.....~~~~~~~~~~',
  '~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.ffffffffffff,ffffffffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffff,,,,,,,fffffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.ffffffff,,,,,,,,,ffffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffff,,,,,,,,,,,fffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffff,,,,,,,,,,,fffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.ffffff,,p,,,,,,,,,,ffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffff,,,,,,,,,,,fffffffffffffffffffffffff^^^^^^^^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffff,,,,,,,,,,,fffffffffffffffffffffffff^^^^^^^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.ffffffff,,,,,,,,,ffffffffffffffffffffffffff^^^^^^^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.fffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,f^^^^^^^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.ffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,fffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.fffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,fffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.ffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,fffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.ffffffffffff,ffffffffffffffffffffffffffffffffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffffffffffffffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffffffffffffffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffffffffffffffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffffffffffffffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffffffffffffffff,,^^,,,,,,,,^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffff%%%%%%%%%%%%%%%^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffffffffffffffffffffff%%%%%%%%%%%%%%%^^^^^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffff,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffff,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffff,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffff,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.fffffffffffffffff,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.ffffffffffff,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.ffffffffffff,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.ffffffffffff,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.f,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.f,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~.f,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~..,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%^^^^^^.~~~~~~~~~~',
  '~~~~~~~~~.............................................................~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];

@Injectable({ providedIn: 'root' })
export class AlefgardService {
  private map: OverworldCell[][] = [];

  initAlefgard(): OverworldState {
    if (this.map.length === 0) this.buildMap();
    return {
      map: this.map,
      playerX: ALEFGARD_START_X,
      playerY: ALEFGARD_START_Y,
      inShip: false,
      shipX: null,
      shipY: null,
    };
  }

  private buildMap(): void {
    this.map = RAW_MAP.map(row =>
      row.split('').map(ch => {
        const type = CHAR_MAP[ch] ?? 'ocean';
        return { type, visited: false, passable: !IMPASSABLE_TILES.has(type) };
      })
    );
    for (const loc of NAMED_LOCATIONS) {
      const cell = this.map[loc.y]?.[loc.x];
      if (cell) { cell.type = loc.type; cell.name = loc.name; cell.passable = true; }
    }
    // Portal tile is passable
    const portalCell = this.map[20]?.[17];
    if (portalCell) portalCell.passable = true;
  }

  getFullMap(): OverworldCell[][] {
    if (this.map.length === 0) this.buildMap();
    return this.map;
  }

  getViewport(state: OverworldState, vpW: number, vpH: number): (OverworldCell | null)[][] {
    const halfW = Math.floor(vpW / 2);
    const halfH = Math.floor(vpH / 2);
    const result: (OverworldCell | null)[][] = [];
    for (let row = 0; row < vpH; row++) {
      result.push([]);
      for (let col = 0; col < vpW; col++) {
        const mx = state.playerX - halfW + col;
        const my = state.playerY - halfH + row;
        const cell = this.map[my]?.[mx] ?? null;
        if (cell && !cell.visited) {
          const dx = Math.abs(col - halfW), dy = Math.abs(row - halfH);
          if (dx <= halfW && dy <= halfH) cell.visited = true;
        }
        result[row].push(cell);
      }
    }
    return result;
  }

  movePlayer(state: OverworldState, dx: number, dy: number): OverworldEvent {
    const nx = state.playerX + dx;
    const ny = state.playerY + dy;
    if (nx < 0 || nx >= ALEFGARD_W || ny < 0 || ny >= ALEFGARD_H) return { type: 'blocked' };

    const cell = this.map[ny][nx];
    const targetType = cell.type;

    if (IMPASSABLE_TILES.has(targetType)) return { type: 'blocked', tile: targetType };

    state.playerX = nx;
    state.playerY = ny;
    cell.visited = true;

    if (targetType === 'portal')  return { type: 'enter-portal', tile: targetType };
    if (targetType === 'town')    return { type: 'enter-town',   tile: targetType, name: cell.name };
    if (targetType === 'city')    return { type: 'enter-city',   tile: targetType, name: cell.name };
    if (targetType === 'castle')  return { type: 'enter-castle', tile: targetType, name: cell.name };
    if (targetType === 'dungeon') return { type: 'enter-dungeon', tile: targetType };
    if (ENCOUNTER_TILES.has(targetType) && Math.random() < ENCOUNTER_CHANCE)
      return { type: 'encounter', tile: targetType };

    return { type: 'move', tile: targetType };
  }
}
