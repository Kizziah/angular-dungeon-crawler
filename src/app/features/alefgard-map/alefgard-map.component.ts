import { Component, OnInit, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlefgardService } from '../../core/services/alefgard.service';
import { TILE_RENDER, OverworldCell } from '../../core/models/overworld.model';

const ALEFGARD_LOCATIONS = [
  { x: 14, y: 13, name: 'Tantegel' },
  { x: 17, y: 16, name: 'Brecconary' },
  { x: 47, y:  7, name: 'Kol' },
  { x:  6, y: 33, name: 'Garinham' },
  { x: 75, y: 36, name: 'Rimuldar' },
  { x: 42, y: 48, name: 'Hauksness' },
  { x: 22, y: 50, name: 'Cantlin' },
  { x: 58, y: 38, name: 'Charlock' },
  { x: 48, y: 44, name: "Erdrick's Cave" },
  { x: 12, y: 15, name: 'Portal' },
];

@Component({
  selector: 'app-alefgard-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alefgard-map.component.html',
  styleUrls: ['./alefgard-map.component.scss']
})
export class AlefgardMapComponent implements OnInit {
  private alefgardService = inject(AlefgardService);
  private router = inject(Router);

  readonly TILE_RENDER = TILE_RENDER;
  readonly locations = ALEFGARD_LOCATIONS;
  readonly OOB_CELL: OverworldCell = { type: 'ocean', visited: true, passable: false };

  mapRows = signal<OverworldCell[][]>([]);

  ngOnInit(): void {
    this.mapRows.set(this.alefgardService.getFullMap());
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
    if (window.history.length > 1) window.history.back();
    else this.router.navigate(['/alefgard']);
  }

  cellStyle(cell: OverworldCell): Record<string, string> {
    const r = TILE_RENDER[cell.type];
    return { color: r.color, 'background-color': r.bg ?? '#000000' };
  }

  cellChar(cell: OverworldCell): string {
    return TILE_RENDER[cell.type].char;
  }

  trackByIndex(index: number): number { return index; }
}
