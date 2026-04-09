import { Injectable } from '@angular/core';
import {
  OverworldCell, OverworldState, OverworldEvent,
  OverworldTileType, ENCOUNTER_TILES, IMPASSABLE_TILES, SHIP_TILES
} from '../models/overworld.model';

// ── Westeros-inspired overworld map, 160×80 tiles ────────────────────────────
// The current tiny island (cols 8-23, rows 36-48) is a small isle off Bear Island.
// Bear Island itself sits at cols 40-50, rows 37-46.
// The Wall runs at row 16 from col 55-148 (mountains).
// Town of Dejenol: (16, 42)   Dungeon entrance: (20, 39)
// ─────────────────────────────────────────────────────────────────────────────

const MAP_W = 160;
const MAP_H = 80;

const RAW_MAP: string[] = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...............................................................................................~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.*********************************************************************************************.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.*********************************************************************************************.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.*********************************************************************************************.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.*********************************************************************************************.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.*********************************************************************************************.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.*********************************************************************************************.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ffffffffffffffff*************************************************************fffffffffffffff*.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ffffffffffffffff***********fffffffffffffff*************fffffffffffffff*******fffffffffffffff*.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ffffffffffffffff***********fffffffffffffff*************fffffffffffffff*******fffffffffffffff*.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ffffffffffffffff***********fffffffffffffff*************fffffffffffffff*******fffffffffffffff*.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ffffffffffffffff***********fffffffffffffff*************fffffffffffffff*******fffffffffffffff*.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffff^^^^^^^^^ffffffffffffffffffffffffffffffffffffffffffffffffffff.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffff^^^^^^^^^ffffffffffffffffffffffffffffffffffffffffffffffffffff.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffff^^^^^^^^^ffffffffffffffffffffffffffffffffffffffffffffffffffff.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffff^^^^^^^^^fffffffffffffffffffffffffffffffffffffffffffffffffffff....~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffff^^^^^^^^^ffffffffffffffffffffffffffffffffffffffffffffffffffffffff.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffff^^^^^^^^^ffffffffffffffffffffffffffffffffffffffffffffffffffffffff.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffff^^^^^^^^^ffffffffffffffffffffffffffffffffffffffffffffffffffffffff.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffffffffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffffffffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffffffffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffffffffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffffffffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~..............,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,..............~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~..............~~~............~~~~~~~~~~~~~~~~~~.%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,,,,,,,,,,.~~~.ffffffffff.~~~~~~~~~~~~~~~~~~.%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,,^^^^^^,,.~~~.ffffffffff.~~~~~~~~~~~~~~~~~~.%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,,^^^^^^,,.~~~.ffffffffff.~~~~..............,,,,,,,,fffffffffrff,,,,,,,,r,,fffffffffffffff...............^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,,^^^^^^,,.~~~.ffffffffff.~~~~.,,,,,,,,,,,,,,,,,,,,,fffffffffrff,,,,,,,,r,,ffffffffffffffffff,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,,^^^^^^,,.~~~.ffffffffff.~~~~.,,,,,,,,,,,,,,,,,,,,,fffffffffrff,,,,,,,,b,,ffffffffffffffffff,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,,^^^^^^,,.~~~.ffffffffff.~~~~.,,,,,,,,,,,,,,,,,,,,,fffffffffbff,,,,,,,,r,,ffffffffffffffffff,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,,^^^^^^,,.~~~.ffffffffff.~~~~.,,,,,,,,,,,,,,,,,,,,,ffffffff,r,,,,,,,,,,r,,,,,,,,,,,,,,ffffff,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,,^^^^^^,,.~~~.ffffffffff.~~~~.,,,,,,,,,,,,,,,,,,,,,ffffffff,r,,,,,,,,,,r,,,,,,,,,,,,,,ffffff,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~.,,,pPQ,,,,,,,.~~~............~~~~...............,,,,,,,ffffffff,r,,,,,,,,,,r,,,,,,,,,,,,,,ffffff,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~..............~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,frrrrrbrrrrrrrrrrrrrrrrrrrrrrrrrbrrrrrrrrrrrrrr,,,,,,^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,ffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,ffffff,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,ffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,ffffff,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^ffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,ffffff,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^ffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,ffffff,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.....~~~~~~^^^^^^^ffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,ffffff,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fff.~~~~~~^^^^^^^ffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,ffffff,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fff.~~~~~~^^^^^^^ffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~....f...~~~^^^^^^^ffffffffffffffffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ff.~~~^^^^^^^ffffffffffffffffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.....~.ff.~~~^^^^^^^^,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fff.~....~~~^^^^^^^^,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fff.~~~~~~~~^^^^^^^^,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.....~~~~~~~~^^^^^^^^,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^,,,,,,,,,rrrrrrrrrrrbrrrrrrrr..............,,,,,,,,,,,,,,,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...............ffffffffffffffffffffffffffffffffff,,.~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ffffffffffffffffffffffffffffffffffffffffffffffff,,.~~~~~~^~~~~~~~.,,,,,,,,,,,,,,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.ffffffffffffffffffffffffffffffffffffffffffffffff,,.~~~~~~^.~~~~~~.,,,,,,,,,,,,,,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ffff,,.~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffrrrrrrrrrrrrrrbrrrrrrrrrrrbrrrrrr,,,,,,ffff,,.~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ffff,,.~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffff,,,,^^^^^^^^^^^^^^^^^^^^^^,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^,,,^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffff,,,,^^^^^^^^^^^^^^^^^^^^^^,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^,,,^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffff,,,,^^^^^^^^^^^^^^^^^^^^^^,,,^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^,,,^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.fffffffffff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~................,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...............................................................................~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];

// Town + dungeon + ships override raw map
const TOWN_X    = 16;  const TOWN_Y    = 42;
const DUNGEON_X = 20;  const DUNGEON_Y = 40;

// Player start: just west of town gate
export const OVERWORLD_START_X = 11;
export const OVERWORLD_START_Y = 42;

// Ships moored in ocean near coast
const SHIP_POSITIONS: [number, number][] = [
  [23, 42],   // adjacent to tiny island east coast
  [38, 42],   // adjacent to Bear Island east coast
  [116, 27],  // White Harbor docks
  [122, 38],  // Gulltown harbor
  [100, 65],  // Dragonstone sea
  [120, 68],  // Storm's End coast
  [107, 76],  // Sunspear coast
];

// Named settlements placed on the overworld
const NAMED_LOCATIONS: { x: number; y: number; type: 'town' | 'city' | 'castle' | 'dungeon'; name: string }[] = [
  // Starting island
  { x: TOWN_X,  y: TOWN_Y,  type: 'town',    name: 'Dejenol' },
  { x: DUNGEON_X, y: DUNGEON_Y, type: 'dungeon', name: 'Dejenol Dungeon' },
  // Beyond the Wall
  { x: 90,  y:  6, type: 'dungeon', name: 'Haunted Forest Ruins' },
  { x: 70,  y:  8, type: 'dungeon', name: 'Wildling Encampment' },
  // The Wall & Night's Watch
  { x: 90,  y: 14, type: 'castle',  name: 'Castle Black' },
  { x: 90,  y: 15, type: 'dungeon', name: "Night's Watch Cells" },
  { x: 70,  y: 14, type: 'castle',  name: 'Eastwatch-by-the-Sea' },
  { x: 110, y: 14, type: 'castle',  name: 'Shadow Tower' },
  // The North
  { x: 90,  y: 27, type: 'castle',  name: 'Winterfell' },
  { x: 91,  y: 28, type: 'dungeon', name: 'Winterfell Crypts' },
  { x: 100, y: 21, type: 'castle',  name: 'The Dreadfort' },
  { x: 101, y: 22, type: 'dungeon', name: 'Dreadfort Dungeons' },
  { x: 115, y: 26, type: 'city',    name: 'White Harbor' },
  { x: 107, y: 23, type: 'castle',  name: 'Last Hearth' },
  { x: 76,  y: 24, type: 'castle',  name: 'Deepwood Motte' },
  { x: 48,  y: 42, type: 'castle',  name: 'Bear Island' },
  // The Neck / Riverlands
  { x: 80,  y: 36, type: 'castle',  name: 'Moat Cailin' },
  { x: 81,  y: 37, type: 'dungeon', name: 'Moat Cailin Ruins' },
  { x: 78,  y: 46, type: 'castle',  name: 'Riverrun' },
  { x: 66,  y: 47, type: 'castle',  name: 'The Twins' },
  { x: 67,  y: 47, type: 'dungeon', name: 'Frey Dungeon' },
  { x: 90,  y: 52, type: 'castle',  name: 'Harrenhal' },
  { x: 91,  y: 53, type: 'dungeon', name: 'Harrenhal Dungeons' },
  { x: 80,  y: 48, type: 'town',    name: 'Pinkmaiden' },
  { x: 84,  y: 44, type: 'town',    name: 'Stoney Sept' },
  // The Vale
  { x: 112, y: 44, type: 'castle',  name: 'The Eyrie' },
  { x: 113, y: 45, type: 'dungeon', name: 'Sky Cells' },
  { x: 120, y: 36, type: 'city',    name: 'Gulltown' },
  { x: 108, y: 50, type: 'castle',  name: 'Runestone' },
  // Westerlands / Iron Islands
  { x: 58,  y: 46, type: 'city',    name: 'Casterly Rock' },
  { x: 59,  y: 47, type: 'dungeon', name: 'Rock Mines' },
  { x: 56,  y: 50, type: 'town',    name: 'Lannisport' },
  { x: 48,  y: 55, type: 'castle',  name: 'Pyke' },
  { x: 49,  y: 56, type: 'dungeon', name: 'Pyke Dungeons' },
  // Crownlands / King's Landing
  { x: 100, y: 60, type: 'city',    name: "King's Landing" },
  { x: 101, y: 61, type: 'dungeon', name: 'Red Keep Dungeon' },
  { x: 100, y: 64, type: 'castle',  name: 'Dragonstone' },
  { x: 101, y: 65, type: 'dungeon', name: 'Dragonstone Vaults' },
  { x: 90,  y: 58, type: 'town',    name: 'Duskendale' },
  // The Reach
  { x: 68,  y: 66, type: 'city',    name: 'Highgarden' },
  { x: 69,  y: 67, type: 'dungeon', name: 'Highgarden Dungeons' },
  { x: 65,  y: 74, type: 'city',    name: 'Oldtown' },
  { x: 66,  y: 75, type: 'dungeon', name: 'Citadel Vaults' },
  { x: 80,  y: 72, type: 'town',    name: 'Bitterbridge' },
  // Stormlands
  { x: 120, y: 66, type: 'castle',  name: "Storm's End" },
  { x: 121, y: 67, type: 'dungeon', name: "Storm's End Dungeons" },
  // Dorne
  { x: 106, y: 74, type: 'city',    name: 'Sunspear' },
  { x: 107, y: 75, type: 'dungeon', name: 'Sunspear Cells' },
  { x: 88,  y: 76, type: 'castle',  name: 'Starfall' },
];

const CHAR_MAP: Record<string, OverworldTileType> = {
  '~': 'ocean', '.': 'coast', ',': 'plains', 'f': 'forest',
  '^': 'mountain', '*': 'snow', '%': 'swamp', '#': 'town',
  '>': 'dungeon', '=': 'road', 'r': 'river', 'b': 'bridge', 'w': 'wall', 'p': 'portal', 'P': 'portal2', 'Q': 'portal3',
};

const ENCOUNTER_CHANCE = 0.12;

@Injectable({ providedIn: 'root' })
export class OverworldService {

  private buildMap(): OverworldCell[][] {
    const map: OverworldCell[][] = [];
    for (let y = 0; y < MAP_H; y++) {
      const row: OverworldCell[] = [];
      const line = RAW_MAP[y] ?? '';
      for (let x = 0; x < MAP_W; x++) {
        const ch = line[x] ?? '~';
        let type: OverworldTileType = CHAR_MAP[ch] ?? 'ocean';
        for (const [sx, sy] of SHIP_POSITIONS) {
          if (x === sx && y === sy) type = 'ship';
        }
        row.push({ type, visited: false, passable: !IMPASSABLE_TILES.has(type) });
      }
      map.push(row);
    }
    // Apply named locations
    for (const loc of NAMED_LOCATIONS) {
      const cell = map[loc.y]?.[loc.x];
      if (cell) {
        cell.type = loc.type;
        cell.name = loc.name;
        cell.passable = true;
      }
    }
    return map;
  }

  initOverworld(): OverworldState {
    const map = this.buildMap();
    const state: OverworldState = {
      map, playerX: OVERWORLD_START_X, playerY: OVERWORLD_START_Y,
      inShip: false, shipX: null, shipY: null
    };
    this.revealAround(state, OVERWORLD_START_X, OVERWORLD_START_Y);
    return state;
  }

  movePlayer(state: OverworldState, dx: number, dy: number): OverworldEvent {
    const nx = state.playerX + dx;
    const ny = state.playerY + dy;

    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return { type: 'blocked' };

    const cell = state.map[ny][nx];
    const targetType = cell.type;

    if (state.inShip) {
      if (IMPASSABLE_TILES.has(targetType) && targetType !== 'ocean') return { type: 'blocked', tile: targetType };
    } else {
      if (IMPASSABLE_TILES.has(targetType) && targetType !== 'ship') return { type: 'blocked', tile: targetType };
    }

    state.playerX = nx;
    state.playerY = ny;
    this.revealAround(state, nx, ny);
    cell.visited = true;

    if (!state.inShip && targetType === 'ship') {
      state.inShip = true;
      cell.type = 'ocean';
      cell.passable = true;
      return { type: 'boarded', tile: 'ship' };
    }

    if (state.inShip && !SHIP_TILES.has(targetType)) {
      state.inShip = false;
      const prevX = nx - dx, prevY = ny - dy;
      if (prevX >= 0 && prevX < MAP_W && prevY >= 0 && prevY < MAP_H) {
        state.map[prevY][prevX].type = 'ship';
        state.shipX = prevX; state.shipY = prevY;
      }
      return { type: 'disembarked', tile: targetType };
    }

    if (!state.inShip) {
      if (targetType === 'town')    return { type: 'enter-town',    tile: targetType, name: cell.name };
      if (targetType === 'city')    return { type: 'enter-city',    tile: targetType, name: cell.name };
      if (targetType === 'castle')  return { type: 'enter-castle',  tile: targetType, name: cell.name };
      if (targetType === 'dungeon') return { type: 'enter-dungeon', tile: targetType };
      if (targetType === 'portal')  return { type: 'enter-portal',  tile: targetType };
      if (targetType === 'portal2') return { type: 'enter-portal2', tile: targetType };
      if (targetType === 'portal3') return { type: 'enter-portal3', tile: targetType };
      if (ENCOUNTER_TILES.has(targetType) && Math.random() < ENCOUNTER_CHANCE)
        return { type: 'encounter', tile: targetType };
    }

    return { type: 'move', tile: targetType };
  }

  private revealAround(state: OverworldState, cx: number, cy: number, radius = 3): void {
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H)
          state.map[y][x].visited = true;
      }
  }

  getViewport(state: OverworldState, vpW: number, vpH: number): {
    cells: (OverworldCell | null)[][]; offsetX: number; offsetY: number
  } {
    const offsetX = state.playerX - Math.floor(vpW / 2);
    const offsetY = state.playerY - Math.floor(vpH / 2);
    const cells: (OverworldCell | null)[][] = [];
    for (let vy = 0; vy < vpH; vy++) {
      const row: (OverworldCell | null)[] = [];
      for (let vx = 0; vx < vpW; vx++) {
        const wx = offsetX + vx, wy = offsetY + vy;
        row.push((wx >= 0 && wx < MAP_W && wy >= 0 && wy < MAP_H) ? state.map[wy][wx] : null);
      }
      cells.push(row);
    }
    return { cells, offsetX, offsetY };
  }
}
