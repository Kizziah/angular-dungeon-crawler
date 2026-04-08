import { Injectable } from '@angular/core';
import { DungeonFloor, DungeonState, Cell, Position } from '../models/dungeon.model';
import { MonsterGroup } from '../models/monster.model';
import { Item } from '../models/item.model';
import { MonsterService } from './monster.service';
import { ItemService } from './item.service';

export interface DungeonEvent {
  type: 'none' | 'encounter' | 'chest' | 'trap' | 'stairs-up' | 'stairs-down' | 'blocked' | 'entrance' | 'door';
  data?: any;
}

export interface TrapEvent {
  type: 'dart' | 'pit' | 'gas' | 'alarm';
  damage?: number;
  message: string;
}

interface Room {
  x: number; y: number; w: number; h: number;
}

@Injectable({ providedIn: 'root' })
export class DungeonService {

  constructor(private monsterService: MonsterService, private itemService: ItemService) {}

  generateFloor(level: number, seed?: number): DungeonFloor {
    const width = 40;
    const height = 25;
    const cells: Cell[][] = [];

    for (let y = 0; y < height; y++) {
      cells[y] = [];
      for (let x = 0; x < width; x++) {
        cells[y][x] = { type: 'wall', visited: false, hasMonster: false, chestLooted: false, trapTriggered: false, doorLocked: false };
      }
    }

    const rooms: Room[] = [];
    const numRooms = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numRooms * 10 && rooms.length < numRooms; i++) {
      const w = 4 + Math.floor(Math.random() * 7);
      const h = 4 + Math.floor(Math.random() * 5);
      const x = 1 + Math.floor(Math.random() * (width - w - 2));
      const y = 1 + Math.floor(Math.random() * (height - h - 2));
      const room: Room = { x, y, w, h };
      if (!rooms.some(r => this.roomsOverlap(r, room))) {
        rooms.push(room);
        this.carveRoom(cells, room);
      }
    }

    for (let i = 1; i < rooms.length; i++) {
      this.connectRooms(cells, rooms[i - 1], rooms[i]);
    }

    this.placeDoors(cells, rooms, width, height);

    const entranceRoom = rooms[0];
    const entrancePos: Position = { x: entranceRoom.x + 1, y: entranceRoom.y + 1 };
    cells[entrancePos.y][entrancePos.x].type = level === 1 ? 'entrance' : 'stairs-up';

    const lastRoom = rooms[rooms.length - 1];
    const stairsDownPos: Position = { x: lastRoom.x + Math.floor(lastRoom.w / 2), y: lastRoom.y + Math.floor(lastRoom.h / 2) };
    cells[stairsDownPos.y][stairsDownPos.x].type = 'stairs-down';

    const numChests = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numChests && i < rooms.length - 1; i++) {
      const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
      const cx = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
      const cy = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
      if (cells[cy] && cells[cy][cx] && cells[cy][cx].type === 'floor') {
        cells[cy][cx].type = 'chest';
      }
    }

    const numTraps = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numTraps; i++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const tx = room.x + Math.floor(Math.random() * room.w);
      const ty = room.y + Math.floor(Math.random() * room.h);
      if (cells[ty] && cells[ty][tx] && cells[ty][tx].type === 'floor') {
        cells[ty][tx].type = 'trap';
      }
    }

    cells[entrancePos.y][entrancePos.x].visited = true;
    this.revealAdjacentWalls(cells, entrancePos.x, entrancePos.y, width, height);

    return {
      level,
      width,
      height,
      cells,
      stairsUp: entrancePos,
      stairsDown: stairsDownPos,
      entrance: entrancePos,
      seed: seed || Date.now()
    };
  }

  private revealAdjacentWalls(cells: Cell[][], x: number, y: number, width: number, height: number): void {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const t = cells[ny][nx].type;
          if (t === 'wall' || t === 'door') {
            cells[ny][nx].visited = true;
          }
        }
      }
    }
  }

  private placeDoors(cells: Cell[][], rooms: Room[], width: number, height: number): void {
    // A good door location is a floor cell that sits at a narrow passage entrance:
    // exactly 2 floor neighbours that are collinear (N–S or E–W) and 2 wall neighbours.
    // We scan every room's border perimeter to find its entrances, then possibly place a door.
    const isFloor = (x: number, y: number) =>
      x >= 0 && x < width && y >= 0 && y < height &&
      (cells[y][x].type === 'floor' || cells[y][x].type === 'door');

    const isWall = (x: number, y: number) =>
      x >= 0 && x < width && y >= 0 && y < height && cells[y][x].type === 'wall';

    // Collect room interior cells in a Set for quick lookup
    const roomCells = new Set<string>();
    for (const r of rooms) {
      for (let ry = r.y; ry < r.y + r.h; ry++) {
        for (let rx = r.x; rx < r.x + r.w; rx++) {
          roomCells.add(`${rx},${ry}`);
        }
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (cells[y][x].type !== 'floor') continue;
        // Only place doors at room boundaries (room cells adjacent to non-room floor = corridor entry)
        if (!roomCells.has(`${x},${y}`)) continue;

        // Check if any orthogonal neighbour is a floor cell NOT in a room (i.e. a corridor)
        const neighbours = [
          { nx: x, ny: y - 1 }, { nx: x, ny: y + 1 },
          { nx: x - 1, ny: y }, { nx: x + 1, ny: y },
        ];
        const hasCorridorNeighbour = neighbours.some(
          ({ nx, ny }) => isFloor(nx, ny) && !roomCells.has(`${nx},${ny}`)
        );
        if (!hasCorridorNeighbour) continue;

        // The corridor entry cell itself is inside the room — find the first corridor cell
        // and place the door there instead (one step outside the room).
        for (const { nx, ny } of neighbours) {
          if (!isFloor(nx, ny) || roomCells.has(`${nx},${ny}`)) continue;
          // Verify it's a chokepoint: exactly 2 collinear floor neighbours, 2 wall neighbours
          const n = isFloor(nx, ny - 1);
          const s = isFloor(nx, ny + 1);
          const e = isFloor(nx + 1, ny);
          const w = isFloor(nx - 1, ny);
          const wn = isWall(nx, ny - 1);
          const ws = isWall(nx, ny + 1);
          const we = isWall(nx + 1, ny);
          const ww = isWall(nx - 1, ny);
          const isHorizontalPassage = e && w && wn && ws;
          const isVerticalPassage   = n && s && we && ww;
          if ((isHorizontalPassage || isVerticalPassage) && Math.random() < 0.65) {
            cells[ny][nx].type = 'door';
          }
        }
      }
    }
  }

  private roomsOverlap(a: Room, b: Room): boolean {
    return a.x < b.x + b.w + 1 && a.x + a.w + 1 > b.x &&
           a.y < b.y + b.h + 1 && a.y + a.h + 1 > b.y;
  }

  private carveRoom(cells: Cell[][], room: Room): void {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (cells[y] && cells[y][x]) cells[y][x].type = 'floor';
      }
    }
  }

  private connectRooms(cells: Cell[][], a: Room, b: Room): void {
    const ax = a.x + Math.floor(a.w / 2);
    const ay = a.y + Math.floor(a.h / 2);
    const bx = b.x + Math.floor(b.w / 2);
    const by = b.y + Math.floor(b.h / 2);
    let x = ax, y = ay;
    while (x !== bx) {
      if (cells[y] && cells[y][x]) cells[y][x].type = 'floor';
      x += x < bx ? 1 : -1;
    }
    while (y !== by) {
      if (cells[y] && cells[y][x]) cells[y][x].type = 'floor';
      y += y < by ? 1 : -1;
    }
  }

  moveParty(state: DungeonState, dx: number, dy: number): { newState: DungeonState; event: DungeonEvent } {
    const floor = state.floors[state.currentFloor];
    const newX = state.partyPosition.x + dx;
    const newY = state.partyPosition.y + dy;

    if (newX < 0 || newX >= floor.width || newY < 0 || newY >= floor.height) {
      return { newState: state, event: { type: 'blocked' } };
    }

    const cell = floor.cells[newY][newX];
    if (cell.type === 'wall') {
      return { newState: state, event: { type: 'blocked' } };
    }

    const newCells = floor.cells.map(row => row.map(c => ({ ...c })));
    newCells[newY][newX].visited = true;
    this.revealAdjacentWalls(newCells, newX, newY, floor.width, floor.height);

    const direction = dx > 0 ? 'E' : dx < 0 ? 'W' : dy > 0 ? 'S' : 'N';
    const newState: DungeonState = {
      ...state,
      partyPosition: { x: newX, y: newY },
      partyDirection: direction as 'N' | 'S' | 'E' | 'W',
      floors: { ...state.floors, [state.currentFloor]: { ...floor, cells: newCells } }
    };

    let event: DungeonEvent = { type: 'none' };

    switch (cell.type) {
      case 'stairs-down':
        event = { type: 'stairs-down' };
        break;
      case 'stairs-up':
        event = { type: 'stairs-up' };
        break;
      case 'entrance':
        event = { type: 'entrance' };
        break;
      case 'chest':
        if (!cell.chestLooted) {
          event = { type: 'chest', data: this.itemService.generateLoot(state.currentFloor, 1 + Math.floor(Math.random() * 3)) };
          newCells[newY][newX].chestLooted = true;
        }
        break;
      case 'trap':
        if (!cell.trapTriggered) {
          event = { type: 'trap', data: this.triggerTrap(state.currentFloor) };
          newCells[newY][newX].trapTriggered = true;
        }
        break;
      case 'floor':
        if (Math.random() < 0.3) {
          event = { type: 'encounter', data: this.monsterService.rollEncounterGroup(state.currentFloor) };
        }
        break;
      case 'door':
        if (!newCells[newY][newX].visited) {
          event = { type: 'door' };
        } else if (Math.random() < 0.3) {
          event = { type: 'encounter', data: this.monsterService.rollEncounterGroup(state.currentFloor) };
        }
        break;
    }

    return { newState, event };
  }

  rollEncounter(floorLevel: number): MonsterGroup | null {
    if (Math.random() < 0.3) {
      return this.monsterService.rollEncounterGroup(floorLevel);
    }
    return null;
  }

  openChest(floor: DungeonFloor, _pos: Position): Item[] {
    return this.itemService.generateLoot(floor.level, 1 + Math.floor(Math.random() * 3));
  }

  triggerTrap(floorLevel: number): TrapEvent {
    const dmg1 = this.localRollDice('1d6');
    const dmg2 = this.localRollDice('1d10');
    const dmg3 = this.localRollDice('1d4');
    const traps: TrapEvent[] = [
      { type: 'dart', damage: dmg1, message: 'A dart flies out and hits you!' },
      { type: 'pit', damage: dmg2, message: 'You fall into a pit!' },
      { type: 'gas', damage: dmg3, message: 'Poison gas fills the room!' },
      { type: 'alarm', message: 'An alarm sounds! Monsters are alerted!' }
    ];
    const _ = floorLevel; // used for scaling in future
    return traps[Math.floor(Math.random() * traps.length)];
  }

  private localRollDice(notation: string): number {
    const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (!match) return 1;
    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    let total = 0;
    for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
    return Math.max(1, total + modifier);
  }

  getVisibleCells(floor: DungeonFloor, pos: Position, radius: number = 4): Cell[][] {
    const result: Cell[][] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      const row: Cell[] = [];
      for (let dx = -radius; dx <= radius; dx++) {
        const x = pos.x + dx;
        const y = pos.y + dy;
        if (x >= 0 && x < floor.width && y >= 0 && y < floor.height) {
          row.push(floor.cells[y][x]);
        } else {
          row.push({ type: 'wall', visited: false, hasMonster: false, chestLooted: false, trapTriggered: false, doorLocked: false });
        }
      }
      result.push(row);
    }
    return result;
  }

  initDungeonState(): DungeonState {
    const floor1 = this.generateFloor(1);
    return {
      currentFloor: 1,
      floors: { 1: floor1 },
      partyPosition: { ...floor1.entrance },
      partyDirection: 'N'
    };
  }

  descendFloor(state: DungeonState): DungeonState {
    const nextLevel = state.currentFloor + 1;
    let floor = state.floors[nextLevel];
    if (!floor) {
      floor = this.generateFloor(nextLevel);
    }
    return {
      ...state,
      currentFloor: nextLevel,
      floors: { ...state.floors, [nextLevel]: floor },
      partyPosition: { ...floor.entrance }
    };
  }

  ascendFloor(state: DungeonState): DungeonState {
    const prevLevel = state.currentFloor - 1;
    if (prevLevel < 1) return state;
    const floor = state.floors[prevLevel];
    if (!floor) return state;
    return {
      ...state,
      currentFloor: prevLevel,
      partyPosition: { ...floor.stairsDown }
    };
  }
}
