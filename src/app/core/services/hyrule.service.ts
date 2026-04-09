import { Injectable } from '@angular/core';
import {
  OverworldCell, OverworldState, OverworldEvent, OverworldTileType,
  IMPASSABLE_TILES, ENCOUNTER_TILES
} from '../models/overworld.model';

// Hyrule (Zelda 1) overworld — 128×44 grid sampled from NES palette
// Terrain chars: , plains  f forest  ~ ocean  . coast  ^ mountain  * desert
// Special:       > dungeon  # town  C castle  p portal (return to Westeros)
const RAW_MAP =
  'ffffffffffff****ffffffff**fffff*ffffff*ffffffff*fff*fffffffffff*fffffff*fffffff**fffffffffffff**ffff*ff*fff*fff*~~~~~~~~~ffffff,\n' +
  'fffffffffffff,,ffffff,ff*,fffffffffff,,,,,,,,,,fff,,,fffffffffffff,,,fff*,,,,,,ff,....,ff,,,,,,fffff,,f,,f,,,fff~~~~~~~~~.,,,,,,\n' +
  'ffff,,,,,,,,,,,,,,,,,,,,,,,,,ffff,,f,,,,,*f,,f,,,,,,,,,,,,,,,,,,,,,,,,,,,,^,,,,,*.~~~~.,*,,,,,,,fff,,,,,,,,,,,,fff.ff~~~~.,,,,,,\n' +
  'fffffffff,,,,,,ffffff,,,,,ffffff,,,,,,,,,,f,,f,,ff,,,fffffffffffff,,,fff*,,,,,,f,.~~~~.,f,,,,,,,ffff,,,,,,,,,,,,ff,ff~~~~.,,,,,,\n' +
  'fffffffff,,,,,,fffffff,,,ffffffff,,f,,,fff,,,,,fffffffffffffffffffffffffff,,,,fff,....,fff,,,,,fffff,,ff,ff,,,,ffffff~~~~.,,,,,f\n' +
  'fffffff*fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff*fffffffffff~fffffffffffffffffffffffffffffffff~~~fffffff,\n' +
  'f**ffff**fff*f*ffffff*ff*fffffff,*f*ff*fffff,f*f*,f*fff*,ffffffffffffffffffffffffff~fffffff**ffff*fff*f*f*ffffffffffffff*****fff\n' +
  ',,,,,,,,,,,,,,,,fff,,,,,,,fffff,,,,,,,,,ffff,,,,,,,,ff,,,*fffffffffffffffffffffffff~fffff,,,,,,f,,,,,,,,,,,ff,,f,,,ff,,,,f,,,f,,\n' +
  ',,,,,,,,,,,,,,,,f,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.,,,,,,,,,,,,,,,,,,,,,,,,,.......,,,,,,,,,,,f\n' +
  'f,,,,,,,,,,,,,,ff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,*,,,,,f,,,,,,,,,,,,,fffffffffffffff,,,,,f,,,,,,ff,,,,,,,,,f,.~~~~~~~f,,,,,,,,,,,\n' +
  'ffffffffffffffffffffffffffffffffffffffff*fffffffffffffff*ff,,,ffffffffffffffffffffffffff*ffffffffffffffffff,.~~~~~~~ffff*ffffff,\n' +
  ',,,,,,,,,,,,,,,,ffffffffffffffffffffff*ffff*f*fffffffffffff,,,ff^,,^^^^^fffffff*fffffffffffffffffffffffffff,.~~~~~~~~~~~.,,,,,,,\n' +
  ',^^^^^^^^^^^^^^^f^^^^^^f*,,,f,,,,,,,,,,,,,,,,,,ff,,f,ffffff,,,f,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ffff,,.~~~~~~~~~~~.^^^^^^,\n' +
  ',^^^^^^^^^^^^^^,f^.~^,^f*,,,f,,,,,,,,,,,,,,,,,,,*,,,,..............,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ffffff,,,.~~~~~~~~~~~.^^^^^^,\n' +
  ',^^^^^^^^^^^^^^^f^^^^^^f*,,,f,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,........~~~.^^^^^^,\n' +
  ',^^^^^^^^^^^^^^,f^^^^^^f*,,fff,,,ff,,,,,,,,,,,,ff,fff~~~~~~~~~~~~~~~.,,f,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~.^^^^^,.\n' +
  ',^^^^^^,,^^^^^^^ff*f******f*****ff*f****f*ff****f,*f.~~~~~~~~~~~~~~~.ffff*f*****f,,,,,,*,,,,,,,*fffffffffff,,fff*,,,.~~~~~~~~~.~\n' +
  ',^^^^^^^^^^^^^^,fffffffffffffffffffffffffffffffff,fff~~~~fffffff~~~~.fff*ffffffff,,,,,,,,,,,,,,fffffff,ffff,,ffff,,,.~~~~~~~~~~~\n' +
  ',^^^^^^^^^^^^^^,,,fff,fff^^^^^^f,,,,,..ffff,fff,..f,.~~~~.,f,,,f~~~~.,,,,,.~~f,,f,,,,,,,,,,,,,,ff,,,,,,ff,,,,,,,f,,,.~~~~~~~~~~~\n' +
  ',^^^^^^^^^^^^^^^,,,,,,,,,^^^^^^f,,,,.~~~ff..~~~.~~~.~~~~~.,,,,,,....,,,f,,.~~~.,f,,,,,,,,,,,,,,f,,,,,,,ff,,,,,,,f,,,,.......~~~~\n' +
  ',^^^^^^^^^^^^^^,f,,,,,,ff^^^^^^ff,,,.~~~~~~~~~~~~~~~~~~~~.,,,,,.~~~~.,,f,,,...,ff,,,,,,,,,,,,,,ff,,,,,,ff,,,,,,,f,,,,,,,,,,.~~~~\n' +
  ',^^^^^^,,^^^^^^,*fffffff*fffffffffff.~~~~~~~~~~~~~~~~~~~~fffffff~~~~.fff,ff,,ffffff,,fff*fffff,ffffffffff,^,,,,,*fffffff*ff.~~~~\n' +
  ',^^^^^^,,^^^^^^,ffffffffffffffffff*f.~~~~ffffff.~~~~~~~~~~~~~~~~~~~~.ffffff,,fffffff,fffffffff,ffffffffff,,^,,,,ffffffffff,,.~~~\n' +
  ',^^^^^^^^^^^^^^,*,.~~.,f,,.~~.,f,,,,.~~~~.,,,,,f~~~~~~~~~~~~~~~~~~~~.,,ff,f,,ffff,,,,,,ff,,,,f,ff,,ffffff,,,,,,,f,,,,,,fff,.~~~~\n' +
  ',^^^^^^^^^^^^^^,*.~~~~.,*,.~~~.,,,,,.~~~~.,,,,,f~~~~................,,,ff,,,,,,,,,,,,,,,,,,,,f,f,,,ff,,,,,,,,,,,,,,,,,,ff^,.~~~~\n' +
  ',^^^^^^^^^^^^^^,*,....,,*,,...,,,,,,.~~~~.,,,,,.~~~.,ffffffffffff,,,,,,ff,,,,ffff,,,,,,f,,,,,f,ff,,,,,ff,,,,,,,,,,,,,,,ff,,.~~~~\n' +
  ',,^^^^^^^^^^^^^,f,,,,,,ff,,,,,,ff,,,.~~~~.,,,,,.~~~.,fffffffffffff,,,,fff,f,,fffff,ffffff,,,,f,fff,f,,fff,,,,,,ff,,,,,,fff,.~~~~\n' +
  ',,,,,,,,,,,,,,,,*ff,,fff*ff,,ffffff,.~~~~ffffff~~~~.,fffffffffffffff,ffffff,,ffffffffffff^,,^f,ffffffffff,fffffffffffffffff.~~~~\n' +
  ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,f,,,.~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,ffff,,fffff,,,,,,,,,,,,,,,,,,,,fff,ffffffff,,ffffff,.~~~~\n' +
  ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,f,,,.~~~~~~~~~~~~~~.,,,,,,,,,,,,,,,,,,,,fff,,ffff,,,,,,,,,,,,,,,ffffff,ff,ffff,f,,,,,,,fff,.~~~~\n' +
  ',^^^^^^^,,,,,,,,,,,,,,,,,,,,,,,,,,,,,..ff......ff..,,,,,,,,,,,,,,,,,,,,,,,,,,......,,,,,,,,,,,,,ffffff,,,,,,,,,,,,,,,,,ff,,.~~~~\n' +
  ',^^^^^^^,,,,,,,,,,,,,,,,,,,,,,,,f,,,,,,ff,,,,,,fff,,,,,,,,,,,,,,,,,,,,,,fff,.~~~~~~.,,,,,,,,,,,,ffffff,ff,fffffff,,,ff,ff,,.~~~~\n' +
  ',^^^^^^,,,,,,,,,,,,,,,,,,,,,,,,,fffffffff,,,,fffffffffffffffffffff,,,,,,fff,.~~~~~~.,,ff,f,,,f,fffffff,ff,ffffffffffffff,ff.~~~~\n' +
  ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ffff,f,ff,,,,f,ffffffffffffffffff,^,,,,,fff,.~~~~~~.,,ff,f,,,f,fffffff,ff,ffffffffffffffff,,.~~~\n' +
  ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,f,,,,,,,,,,,,,,,,,,,,,,ff,,,,,,ff,,,,,,,f,,,.~~~~~~.,,,,,,,,,,,ffff,,,,,,,,,,ffff,,,,,,,,,,.~~~~\n' +
  ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^,,,,,,,,,,,,,,,,,,,,,,,.~~~..~.,,,,,,,,,,,,,,f,,,,ff,ffff,,,,,,,,^,,,,,.~~~\n' +
  ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,...,,.,,,,,,,,,,,,,,,f,,,,ff,ffff,,,,,,,,,,,,,.~~~~\n' +
  ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ffffffffff,.ffffffffff,ffff,fffff,,,,,,,fffffffffffffffffffff,,fffffffffffffffffffffffff,,,.~~~~\n' +
  'f,*f****,*,,*,**,,,,,,,,,,,,,,,,ffffffffff.~ffffffffff,ffff,fffff,,f,f,,fffffffffffffffffffff,,fffffffffffffffffffffffffff*,.~~~\n' +
  'ff,,,,,,,,,,,,ff,,,,,,,,,,,,,,,,fffffffff,,.fffffffff,,fff,,fffff,,,,,,,,ff,,,fffff,ffffffff,,,,,,,,,,,,,,,,,,,,,ffffffffff,.~~~\n' +
  'f,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ff,,,,,,,,,,,,,,ff,,,fffff,,,,,,,,ff,,,,ff*,,,ffffff,,,,,,,,,,,,,,,,,,,,,,f,f,f,,,f,.~~~~\n' +
  'f,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ff,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,^,,,,,,,,,,,,,,.................................~~~~\n' +
  'ff,,,,,,,,,,,,,f,,,,,,,,,,,,,,,,f,,,,,,ff,,.,,,,,,,,,,,ff,,,,,,ff,,,,,,,,,,,,,ffff,,,ffffff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
  'ffffffff*fffffff,,,,,,,,,,,,,,,,fffffffffff~ffffffffffffffffffffffffffffffffffffffffffff*ff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n';

export const HYRULE_W = 128;
export const HYRULE_H = 44;
export const HYRULE_START_X = 63;
export const HYRULE_START_Y = 38;

// Zelda 1 named locations (col, row, tile override, name)
interface NamedLocation { x: number; y: number; type: OverworldTileType; name: string; }

const NAMED_LOCATIONS: NamedLocation[] = [
  // 9 Dungeons
  { x: 62, y: 42, type: 'dungeon', name: 'Level 1: Eagle' },
  { x: 42, y: 34, type: 'dungeon', name: 'Level 2: Moon' },
  { x: 104, y: 22, type: 'dungeon', name: 'Level 3: Manji' },
  { x: 34, y: 16, type: 'dungeon', name: 'Level 4: Snake' },
  { x: 16, y: 11, type: 'dungeon', name: 'Level 5: Lizard' },
  { x: 10, y: 36, type: 'dungeon', name: 'Level 6: Dragon' },
  { x: 22, y: 36, type: 'dungeon', name: 'Level 7: Demon' },
  { x: 10, y: 14, type: 'dungeon', name: 'Level 8: Lion' },
  { x: 58, y:  5, type: 'dungeon', name: 'Level 9: Death Mountain' },
  // Towns
  { x: 56, y: 30, type: 'town', name: 'Kakariko Village' },
  { x: 74, y: 36, type: 'town', name: 'Mido Town' },
  { x: 90, y: 28, type: 'town', name: 'Saria Town' },
  { x: 116, y: 16, type: 'town', name: 'Nabooru Town' },
  { x: 30, y: 36, type: 'town', name: 'Ruto Town' },
  // Castle
  { x: 60, y: 22, type: 'castle', name: 'Hyrule Castle' },
  // Portal back to Westeros
  { x: 63, y: 42, type: 'portal', name: 'Portal to Westeros' },
];

const CHAR_MAP: Record<string, OverworldTileType> = {
  ',': 'plains', 'f': 'forest', '~': 'ocean', '.': 'coast',
  '^': 'mountain', '*': 'snow', '>': 'dungeon', '#': 'town', 'C': 'castle', 'p': 'portal',
};

const ENCOUNTER_CHANCE = 0.10;

@Injectable({ providedIn: 'root' })
export class HyruleService {

  initHyrule(): OverworldState {
    const map = this.buildMap();
    return {
      map,
      playerX: HYRULE_START_X,
      playerY: HYRULE_START_Y,
      inShip: false,
      shipX: null,
      shipY: null,
    };
  }

  private buildMap(): OverworldCell[][] {
    const rows = RAW_MAP.trim().split('\n');
    const map: OverworldCell[][] = [];

    for (let y = 0; y < HYRULE_H; y++) {
      const row: OverworldCell[] = [];
      const line = rows[y] ?? '';
      for (let x = 0; x < HYRULE_W; x++) {
        const ch = line[x] ?? '~';
        const type = (CHAR_MAP[ch] ?? 'ocean') as OverworldTileType;
        row.push({
          type,
          visited: true,
          passable: !IMPASSABLE_TILES.has(type),
        });
      }
      map.push(row);
    }

    // Apply named locations
    for (const loc of NAMED_LOCATIONS) {
      if (loc.y < HYRULE_H && loc.x < HYRULE_W) {
        map[loc.y][loc.x].type = loc.type;
        map[loc.y][loc.x].passable = true;
        map[loc.y][loc.x].name = loc.name;
      }
    }

    // Reveal starting area
    this.revealAround(map, HYRULE_START_X, HYRULE_START_Y, 3);

    return map;
  }

  movePlayer(state: OverworldState, dx: number, dy: number): OverworldEvent {
    const nx = state.playerX + dx;
    const ny = state.playerY + dy;

    if (nx < 0 || nx >= HYRULE_W || ny < 0 || ny >= HYRULE_H) {
      return { type: 'blocked', tile: 'ocean' };
    }

    const cell = state.map[ny][nx];
    const targetType = cell.type;

    if (!cell.passable) {
      return { type: 'blocked', tile: targetType };
    }

    state.playerX = nx;
    state.playerY = ny;
    cell.visited = true;
    this.revealAround(state.map, nx, ny, 2);

    if (targetType === 'portal')   return { type: 'enter-portal3', tile: targetType };
    if (targetType === 'town')     return { type: 'enter-town',    tile: targetType, name: cell.name };
    if (targetType === 'city')     return { type: 'enter-city',    tile: targetType, name: cell.name };
    if (targetType === 'castle')   return { type: 'enter-castle',  tile: targetType, name: cell.name };
    if (targetType === 'dungeon')  return { type: 'enter-dungeon', tile: targetType, name: cell.name };
    if (ENCOUNTER_TILES.has(targetType) && Math.random() < ENCOUNTER_CHANCE)
      return { type: 'encounter', tile: targetType };

    return { type: 'move', tile: targetType };
  }

  revealAround(map: OverworldCell[][], x: number, y: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < HYRULE_W && ny >= 0 && ny < HYRULE_H) {
          map[ny][nx].visited = true;
        }
      }
    }
  }

  getViewport(state: OverworldState, vpW: number, vpH: number): (OverworldCell | null)[][] {
    const halfW = Math.floor(vpW / 2);
    const halfH = Math.floor(vpH / 2);
    const startX = state.playerX - halfW;
    const startY = state.playerY - halfH;

    const vp: (OverworldCell | null)[][] = [];
    for (let vy = 0; vy < vpH; vy++) {
      const row: (OverworldCell | null)[] = [];
      for (let vx = 0; vx < vpW; vx++) {
        const mx = startX + vx;
        const my = startY + vy;
        if (mx < 0 || mx >= HYRULE_W || my < 0 || my >= HYRULE_H) {
          row.push(null);
        } else {
          const cell = state.map[my][mx];
          row.push(cell.visited ? cell : null);
        }
      }
      vp.push(row);
    }
    return vp;
  }

  getFullMap(): OverworldCell[][] {
    return this.buildMap().map(row => row.map(c => ({ ...c, visited: true })));
  }
}
