import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DungeonFloor, Position } from '../../core/models/dungeon.model';

@Component({
  selector: 'app-minimap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minimap.component.html',
  styleUrls: ['./minimap.component.scss']
})
export class MinimapComponent {
  @Input() floor!: DungeonFloor;
  @Input() position!: Position;

  getMapGrid(): { visited: boolean; type: string; isParty: boolean }[][] {
    if (!this.floor) return [];
    const result: { visited: boolean; type: string; isParty: boolean }[][] = [];
    // Scale down for minimap - sample every 2 cells
    for (let y = 0; y < this.floor.height; y++) {
      const row: { visited: boolean; type: string; isParty: boolean }[] = [];
      for (let x = 0; x < this.floor.width; x++) {
        const cell = this.floor.cells[y][x];
        const isParty = x === this.position.x && y === this.position.y;
        row.push({ visited: cell.visited, type: cell.type, isParty });
      }
      result.push(row);
    }
    return result;
  }

  getCellColor(cell: { visited: boolean; type: string; isParty: boolean }): string {
    if (cell.isParty) return '#ffff00';
    if (!cell.visited) return '#111111';
    switch (cell.type) {
      case 'wall': return '#003300';
      case 'floor': return '#005500';
      case 'door': return '#aa6600';
      case 'stairs-up': case 'stairs-down': return '#00cccc';
      case 'chest': return '#ffaa00';
      case 'trap': return '#ff4444';
      case 'entrance': return '#00cccc';
      default: return '#005500';
    }
  }
}
