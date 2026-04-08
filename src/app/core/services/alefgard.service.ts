import { Injectable } from '@angular/core';
import {
  OverworldTileType, OverworldCell, OverworldState, OverworldEvent,
  IMPASSABLE_TILES, ENCOUNTER_TILES
} from '../models/overworld.model';

export const ALEFGARD_W = 100;
export const ALEFGARD_H = 60;
export const ALEFGARD_START_X = 14;
export const ALEFGARD_START_Y = 14;

const ENCOUNTER_CHANCE = 0.08;

const CHAR_MAP: Record<string, OverworldTileType> = {
  '~': 'ocean', '.': 'coast', ',': 'plains', 'f': 'forest',
  '^': 'mountain', '*': 'snow', '%': 'swamp', '=': 'road',
  '>': 'dungeon', 'p': 'portal',
};

const NAMED_LOCATIONS: { x: number; y: number; type: 'town' | 'city' | 'castle' | 'dungeon'; name: string }[] = [
  // Castles
  { x: 14, y: 13, type: 'castle', name: 'Tantegel Castle' },
  { x: 58, y: 38, type: 'castle', name: 'Charlock Castle' },
  { x: 22, y: 50, type: 'castle', name: 'Cantlin' },
  // Towns
  { x: 17, y: 16, type: 'town',   name: 'Brecconary' },
  { x: 47, y:  7, type: 'town',   name: 'Kol' },
  { x:  6, y: 33, type: 'town',   name: 'Garinham' },
  { x: 75, y: 36, type: 'town',   name: 'Rimuldar' },
  { x: 42, y: 48, type: 'town',   name: 'Hauksness' },
  // Dungeons
  { x: 48, y: 44, type: 'dungeon', name: "Erdrick's Cave" },
  { x: 28, y: 40, type: 'dungeon', name: 'Mountain Cave' },
  { x: 52, y: 42, type: 'dungeon', name: 'Swamp Cave' },
];

const RAW_MAP: string[] = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~............~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.......................~~~~~~~~~~~~~~.,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.^^^^^^^,,,,,,,^^^^^^^.~~~~~~~~~~~~~~.,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.^^^^^^^fffffff^^^^^^^.~~~~~~~~~~~~~~.,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.^^^^^^^fffffff^^^^^^^.~~~~~~~~~~~~~~.,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.^^^^^^^fffffff^^^^^^^.~~~~~~~~~~~~~~.,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.^^^^^^^fffffff^^^^^^^.~~~~~~~~~~~~~~.,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.^^^^^^^fffffff^^^^^^^.~~~~~~~~~~~~~~............~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.^^^^^^^f,fffff^^^^^^^.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.,,,,,,,fffffff^^^^^^^.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.,,,,,,p,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.,,,,,,,,,,,,,,,,,,,,,.....~~~~~~~~.....~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.,,,,,,,,,,,,,,,,,,,,fffff..........^^^...................~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.,,,,,,,,,,,,,,,,,,,fffffff,,,,,,,,^^^^^,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~.,,,,,,,,,,,,,,,,,,fffffffff,,,,,,^^^^^^^,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~...,,,,,,,,,,,,,,,fffffffffff,,,,,^^^^^^^,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,fffffffffff,,fff^^^^^^^,,,,,fff,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,fffff,,fffffffffff,fffff^^^^^,,,,,fffff,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~.,,,,,,fffffffffffffffffffffffffff^^^,,,,,fffffff,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~.,,,,,ffffffffffffffffffffffffffffff,,,,,,fffffff,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~.,,,,,ffffffffffffffffffff,fffffffff,,,,,,fffffff,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~.,,,,ffffffffffffffffffff,,fffffffff,,,,,,,fffff,,,,,,,............................~~~~~~~~~~~',
  '~.......,,,,fffffffffffff,fffff,,,fffffffff,,,,,,,,fff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~',
  '~.,,,,,,,,,,fffffffffffff,,,,,,,,,,fffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,fffffffffffff,,,,,,,,,,,fffff,,,,,,,,,,,,,,fff,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,fffffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,fffff,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,,fffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,fffffff,,,,,,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,,fffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,fff%%%%%,,,,,,,,,,,,,,,,,,^^^,,,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,,,fffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,f%%%%%%%%%,,,,,,,,,,,,,,,^^^^^,,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,,,,,fffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%,,,,,,fffff,,^^^^^^^,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%,,,,,fffffff,^^^^^^^,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%,,,fffffff,f^^^^^^^,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%,,,fffffffff,^^^^^,,^^^^.~~~~~~~~~~',
  '~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%,,,fffffffff,,^^^,,,^^^^.~~~~~~~~~~',
  '~.......,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%,,,fffffffff,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%,,,fffffffff,,,,,,^^^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%,,,,,fffffff,,,,,,^^^^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,fff,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%,,,,,,fffff,,,,,,,^^^^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,fffff,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%f,,,,,,,,,,,,,,,,,,^^^^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,fffffff,,,,,,,,,,,,,,,,,,,,,,%%%%%ffff,,,,,,,,,,,,,,,,,,^^^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,fffffff,,,,,,,,,,,,,,,,,,,,,,,,,fffffff,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,fffffff,,,,,,,,,,,,,,,,,,,,,,,,,fffffff,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,fffff,,,,,,,,,,,,,,,,,,,,,,,,,,fffffff,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,fff,,,,,,,,,,,,,,,,,,,,,,,,,,,,fffff,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,fff,,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~',
  '~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~',
  '~~~~~~~...................................................................................~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
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
    const portalCell = this.map[15]?.[12];
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
