import { Component, OnInit, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlefgardService } from '../../core/services/alefgard.service';
import { TILE_RENDER, OverworldCell } from '../../core/models/overworld.model';

const ALEFGARD_LOCATIONS = [
  { x: 21, y: 18, name: 'Tantegel' },
  { x: 21, y: 22, name: 'Brecconary' },
  { x: 40, y:  8, name: 'Kol' },
  { x: 14, y: 42, name: 'Garinham' },
  { x: 63, y: 27, name: 'Rimuldar' },
  { x: 36, y: 48, name: 'Hauksness' },
  { x: 18, y: 50, name: 'Cantlin' },
  { x: 50, y: 44, name: 'Charlock' },
  { x: 42, y: 48, name: "Erdrick's Cave" },
  { x: 30, y: 14, name: 'Mtn Cave' },
  { x: 17, y: 20, name: 'Portal' },
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
