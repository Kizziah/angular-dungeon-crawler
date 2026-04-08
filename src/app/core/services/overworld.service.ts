import { Injectable } from '@angular/core';
import {
  OverworldCell, OverworldState, OverworldEvent,
  OverworldTileType, ENCOUNTER_TILES, IMPASSABLE_TILES
} from '../models/overworld.model';

// ─── Map Legend ──────────────────────────────────────────────────────────────
// ~ ocean   . coast   , plains   f forest   ^ mountain   * snow
// % swamp   # town    > dungeon  = road
//
// Map is 80 cols × 50 rows.  Town of Dejenol is at (36, 14) in the mountains.
// Dungeon entrance is at (40, 12) deep in the mountains.
// Player starts at (34, 14), just west of the town gate.
// ─────────────────────────────────────────────────────────────────────────────

const RAW_MAP: string[] = [
  //         1111111111222222222233333333334444444444555555555566666666667777777777
  // 1234567890123456789012345678901234567890123456789012345678901234567890123456789 0
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 0
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 1
  '~~~~~~~~~~~~~~~....~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 2
  '~~~~~~~~~~~~~~.....~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 3
  '~~~~~~~~~~~~~......,,,,,,,,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 4
  '~~~~~~~~~~~~~.......,,,,,,,,,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 5
  '~~~~~~~~~~~~~........,,,,,,,,,,,,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 6
  '~~~~~~~~~~~~~~.......,,,,,,,,ffff,,,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~........,,,,,,fffff,,,,,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~.......,,,,,,fffffff,,,,,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~.......,,,,,ffffffff,,,,^^^,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 10
  '~~~~~~~~~~~~~~~~~......,,,,,,ffffff,,,,^^^^^,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 11
  '~~~~~~~~~~~~~~~~~~.....,,,,,,,,,,,,,,^^^^^^^^,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 12
  '~~~~~~~~~~~~~~~~~~.....,,,,,,,,,,,,^^^^^^^^^^,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 13
  '~~~~~~~~~~~~~~~~~~~....,,,,,,,,,,^^^^^^^^^^^^,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 14
  '~~~~~~~~~~~~~~~~~~~.....,,,,,,,,^^^^^^^^^^^^^,,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 15
  '~~~~~~~~~~~~~~~~~~~~.....,,,,,,^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 16
  '~~~~~~~~~~~~~~~~~~~~......,,,,^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 17
  '~~~~~~~~~~~~~~~~~~~~~.....,,,,^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 18
  '~~~~~~~~~~~~~~~~~~~~~......,,,,,,^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 19
  '~~~~~~~~~~~~~~~~~~~~~~......,,,,,^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 20
  '~~~~~~~~~~~~~~~~~~~~~~.......,,,,,,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 21
  '~~~~~~~~~~~~~~~~~~~~~~~.......,,,,,,,,,^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 22
  '~~~~~~~~~~~~~~~~~~~~~~~.........,,,,,,,,,^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 23
  '~~~~~~~~~~~~~~~~~~~~~~~~.........,,,,,,,^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 24
  '~~~~~~~~~~~~~~~~~~~~~~~~..........,,,,,,^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 25
  '~~~~~~~~~~~~~~~~~~~~~~~~~..........,,,,,,^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 26
  '~~~~~~~~~~~~~~~~~~~~~~~~~...........,,,,,,^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 27
  '~~~~~~~~~~~~~~~~~~~~~~~~~~...........,,fff^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 28
  '~~~~~~~~~~~~~~~~~~~~~~~~~~............,ffff^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 29
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~...........fffff^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 30
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~...........fffff^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 31
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,ffff^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 32
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,,,^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 33
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,,^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 34
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,,,,^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 35
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,,,^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 36
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,,,^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 37
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,,^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 38
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,,^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 39
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 40
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,,^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~~', // 41
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~', // 42
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,,^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~', // 43
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~', // 44
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~', // 45
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~', // 46
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~', // 47
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~', // 48
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 49
];

// Town + dungeon precise placements override raw map
const TOWN_X = 36;
const TOWN_Y = 14;
const DUNGEON_X = 40;
const DUNGEON_Y = 12;

// Player start: just outside the town gate (west side)
export const OVERWORLD_START_X = 34;
export const OVERWORLD_START_Y = 14;

const CHAR_MAP: Record<string, OverworldTileType> = {
  '~': 'ocean',
  '.': 'coast',
  ',': 'plains',
  'f': 'forest',
  '^': 'mountain',
  '*': 'snow',
  '%': 'swamp',
  '#': 'town',
  '>': 'dungeon',
  '=': 'road',
};

const ENCOUNTER_CHANCE = 0.12;

@Injectable({ providedIn: 'root' })
export class OverworldService {

  private buildMap(): OverworldCell[][] {
    const rows: OverworldCell[][] = [];

    for (let y = 0; y < 50; y++) {
      const row: OverworldCell[] = [];
      const line = RAW_MAP[y] ?? '';
      for (let x = 0; x < 80; x++) {
        const ch = line[x] ?? '~';
        let type: OverworldTileType = CHAR_MAP[ch] ?? 'ocean';
        // Overwrite town / dungeon positions
        if (x === TOWN_X && y === TOWN_Y) type = 'town';
        if (x === DUNGEON_X && y === DUNGEON_Y) type = 'dungeon';
        row.push({ type, visited: false, passable: !IMPASSABLE_TILES.has(type) });
      }
      rows.push(row);
    }
    return rows;
  }

  initOverworld(): OverworldState {
    const map = this.buildMap();
    const state: OverworldState = { map, playerX: OVERWORLD_START_X, playerY: OVERWORLD_START_Y };
    this.revealAround(state, OVERWORLD_START_X, OVERWORLD_START_Y);
    return state;
  }

  movePlayer(state: OverworldState, dx: number, dy: number): OverworldEvent {
    const nx = state.playerX + dx;
    const ny = state.playerY + dy;

    // Bounds check
    if (nx < 0 || nx >= 80 || ny < 0 || ny >= 50) {
      return { type: 'blocked' };
    }

    const cell = state.map[ny][nx];
    if (!cell.passable) {
      return { type: 'blocked' };
    }

    // Move
    state.playerX = nx;
    state.playerY = ny;
    this.revealAround(state, nx, ny);
    cell.visited = true;

    // Special tiles
    if (cell.type === 'town')    return { type: 'enter-town', tile: cell.type };
    if (cell.type === 'dungeon') return { type: 'enter-dungeon', tile: cell.type };

    // Random encounter on dangerous terrain
    if (ENCOUNTER_TILES.has(cell.type) && Math.random() < ENCOUNTER_CHANCE) {
      return { type: 'encounter', tile: cell.type };
    }

    return { type: 'move', tile: cell.type };
  }

  private revealAround(state: OverworldState, cx: number, cy: number, radius = 3): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < 80 && y >= 0 && y < 50) {
          state.map[y][x].visited = true;
        }
      }
    }
  }

  /** Returns a sub-grid of cells for the viewport, padded with ocean if out of bounds */
  getViewport(state: OverworldState, vpW: number, vpH: number): {
    cells: (OverworldCell | null)[][]; offsetX: number; offsetY: number
  } {
    const offsetX = state.playerX - Math.floor(vpW / 2);
    const offsetY = state.playerY - Math.floor(vpH / 2);
    const cells: (OverworldCell | null)[][] = [];
    for (let vy = 0; vy < vpH; vy++) {
      const row: (OverworldCell | null)[] = [];
      for (let vx = 0; vx < vpW; vx++) {
        const wx = offsetX + vx;
        const wy = offsetY + vy;
        row.push((wx >= 0 && wx < 80 && wy >= 0 && wy < 50) ? state.map[wy][wx] : null);
      }
      cells.push(row);
    }
    return { cells, offsetX, offsetY };
  }
}
