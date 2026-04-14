import { Injectable } from '@angular/core';
import {
  OverworldCell, OverworldState, OverworldEvent,
  OverworldTileType, ENCOUNTER_TILES, IMPASSABLE_TILES, SHIP_TILES
} from '../models/overworld.model';
import {
  TORLAND_RAW_MAP, TORLAND_MAP_W, TORLAND_MAP_H,
  TORLAND_LOCATIONS, TORLAND_START_X, TORLAND_START_Y
} from '../data/torland_map.data';

// ── Torland overworld map, 128×128 tiles (from torland-grid.png) ─────────────

const MAP_W = TORLAND_MAP_W;
const MAP_H = TORLAND_MAP_H;
const RAW_MAP = TORLAND_RAW_MAP;

export const TOWN_X = 38;  export const TOWN_Y = 20;   // Mordor
export const OVERWORLD_START_X = TORLAND_START_X;
export const OVERWORLD_START_Y = TORLAND_START_Y;

const SHIP_POSITIONS: [number, number][] = [
  [36, 22],   // Off Mordor coast
  [22, 68],   // Westgate harbor
  [60, 100],  // Southhaven port
  [91, 28],   // Eastmark coast
  [116, 58],  // Seaport dock
];

const NAMED_LOCATIONS: { x: number; y: number; type: 'town' | 'city' | 'castle' | 'dungeon'; name: string }[] =
  TORLAND_LOCATIONS as { x: number; y: number; type: 'town' | 'city' | 'castle' | 'dungeon'; name: string }[];

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

  getFullMap(state: OverworldState): OverworldCell[][] {
    return state.map;
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
