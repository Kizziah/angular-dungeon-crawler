import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DungeonFloor, Position, Cell } from '../../core/models/dungeon.model';

@Component({
  selector: 'app-dungeon-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dungeon-view.component.html',
  styleUrls: ['./dungeon-view.component.scss']
})
export class DungeonViewComponent {
  @Input() floor!: DungeonFloor;
  @Input() position!: Position;
  @Input() direction: string = 'N';

  readonly RADIUS = 4;

  getViewGrid(): { cell: Cell; isParty: boolean; dx: number; dy: number }[][] {
    const grid: { cell: Cell; isParty: boolean; dx: number; dy: number }[][] = [];
    for (let dy = -this.RADIUS; dy <= this.RADIUS; dy++) {
      const row: { cell: Cell; isParty: boolean; dx: number; dy: number }[] = [];
      for (let dx = -this.RADIUS; dx <= this.RADIUS; dx++) {
        const x = this.position.x + dx;
        const y = this.position.y + dy;
        const isParty = dx === 0 && dy === 0;
        if (x >= 0 && x < this.floor.width && y >= 0 && y < this.floor.height) {
          row.push({ cell: this.floor.cells[y][x], isParty, dx, dy });
        } else {
          row.push({ cell: { type: 'wall', visited: false, hasMonster: false, chestLooted: false, trapTriggered: false, doorLocked: false }, isParty, dx, dy });
        }
      }
      grid.push(row);
    }
    return grid;
  }

  getCellChar(cell: Cell, isParty: boolean): string {
    if (isParty) {
      return this.getDirectionArrow();
    }
    if (!cell.visited) return ' ';
    switch (cell.type) {
      case 'wall': return '█';
      case 'floor': return '·';
      case 'door': return '+';
      case 'stairs-up': return '<';
      case 'stairs-down': return '>';
      case 'chest': return cell.chestLooted ? '·' : '□';
      case 'trap': return cell.trapTriggered ? '·' : '^';
      case 'entrance': return 'E';
      default: return '·';
    }
  }

  getCellColor(cell: Cell, isParty: boolean): string {
    if (isParty) return '#ffff00';
    if (!cell.visited) return '#111111';
    switch (cell.type) {
      case 'wall': return '#005500';
      case 'floor': return '#003300';
      case 'door': return '#aa6600';
      case 'stairs-up': return '#00ffff';
      case 'stairs-down': return '#00ffff';
      case 'chest': return cell.chestLooted ? '#003300' : '#ffaa00';
      case 'trap': return cell.trapTriggered ? '#003300' : '#ff4444';
      case 'entrance': return '#00ffff';
      default: return '#003300';
    }
  }

  private getDirectionArrow(): string {
    switch (this.direction) {
      case 'N': return '▲';
      case 'S': return '▼';
      case 'E': return '►';
      case 'W': return '◄';
      default: return '@';
    }
  }
}
