import { Component, OnInit, HostListener, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { OverworldService } from '../../core/services/overworld.service';
import { TILE_RENDER, OverworldCell } from '../../core/models/overworld.model';

const NAMED_LOCATIONS = [
  { x: 16,  y: 42, name: 'Dejenol' },
  { x: 90,  y: 27, name: 'Winterfell' },
  { x: 90,  y: 14, name: 'Castle Black' },
  { x: 115, y: 26, name: 'White Harbor' },
  { x: 80,  y: 36, name: 'Moat Cailin' },
  { x: 78,  y: 46, name: 'Riverrun' },
  { x: 90,  y: 52, name: 'Harrenhal' },
  { x: 112, y: 44, name: 'The Eyrie' },
  { x: 58,  y: 46, name: 'Casterly Rock' },
  { x: 100, y: 64, name: 'Dragonstone' },
  { x: 100, y: 60, name: "King's Landing" },
  { x: 68,  y: 66, name: 'Highgarden' },
  { x: 120, y: 66, name: "Storm's End" },
  { x: 106, y: 74, name: 'Sunspear' },
];

@Component({
  selector: 'app-worldmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './worldmap.component.html',
  styleUrls: ['./worldmap.component.scss']
})
export class WorldMapComponent implements OnInit {
  private gameState = inject(GameStateService);
  private overworldService = inject(OverworldService);
  private router = inject(Router);

  readonly TILE_RENDER = TILE_RENDER;
  readonly locations = NAMED_LOCATIONS;

  readonly OOB_CELL: OverworldCell = { type: 'ocean', visited: true, passable: false };

  get state() { return this.gameState.overworldState(); }

  mapRows = computed(() => {
    const s = this.gameState.overworldState();
    if (!s) return [];
    return s.map;
  });

  playerX = computed(() => this.gameState.overworldState()?.playerX ?? -1);
  playerY = computed(() => this.gameState.overworldState()?.playerY ?? -1);
  inShip  = computed(() => this.gameState.overworldState()?.inShip ?? false);

  ngOnInit(): void {
    if (!this.gameState.overworldState()) {
      this.gameState.overworldState.set(this.overworldService.initOverworld());
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape' || e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'm') {
      this.goBack();
    }
  }

  goBack(): void {
    const history = window.history;
    if (history.length > 1) history.back();
    else this.router.navigate(['/town']);
  }

  cellStyle(cell: OverworldCell, x: number, y: number): Record<string, string> {
    if (x === this.playerX() && y === this.playerY()) {
      return { color: '#ffffff', 'background-color': this.inShip() ? '#001a33' : '#333300' };
    }
    if (!cell.visited) {
      return { color: '#111111', 'background-color': '#000000' };
    }
    const r = TILE_RENDER[cell.type];
    return { color: r.color, 'background-color': r.bg ?? '#000000' };
  }

  cellChar(cell: OverworldCell, x: number, y: number): string {
    if (x === this.playerX() && y === this.playerY()) {
      return this.inShip() ? '⛵' : '@';
    }
    if (!cell.visited) return ' ';
    return TILE_RENDER[cell.type].char;
  }

  trackByIndex(index: number): number { return index; }
}
