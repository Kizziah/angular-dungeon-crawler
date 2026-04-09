import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HyruleService } from '../../core/services/hyrule.service';
import { TILE_RENDER, OverworldCell } from '../../core/models/overworld.model';

const HYRULE_MAP_LOCATIONS = [
  { x: 62, y: 42, name: 'Lv.1 Eagle' },
  { x: 42, y: 34, name: 'Lv.2 Moon' },
  { x: 104, y: 22, name: 'Lv.3 Manji' },
  { x: 34, y: 16, name: 'Lv.4 Snake' },
  { x: 16, y: 11, name: 'Lv.5 Lizard' },
  { x: 10, y: 36, name: 'Lv.6 Dragon' },
  { x: 22, y: 36, name: 'Lv.7 Demon' },
  { x: 10, y: 14, name: 'Lv.8 Lion' },
  { x: 58, y:  5, name: 'Lv.9 D.Mtn' },
  { x: 56, y: 30, name: 'Kakariko' },
  { x: 74, y: 36, name: 'Mido' },
  { x: 90, y: 28, name: 'Saria' },
  { x: 116, y: 16, name: 'Nabooru' },
  { x: 30, y: 36, name: 'Ruto' },
  { x: 60, y: 22, name: 'Hyrule Castle' },
  { x: 63, y: 42, name: 'Portal' },
];

@Component({
  selector: 'app-hyrule-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hyrule-map.component.html',
  styleUrls: ['./hyrule-map.component.scss']
})
export class HyruleMapComponent implements OnInit {
  private hyruleService = inject(HyruleService);
  private router = inject(Router);

  readonly TILE_RENDER = TILE_RENDER;
  readonly locations = HYRULE_MAP_LOCATIONS;
  readonly OOB_CELL: OverworldCell = { type: 'ocean', visited: true, passable: false };

  mapRows = signal<OverworldCell[][]>([]);

  ngOnInit(): void {
    this.mapRows.set(this.hyruleService.getFullMap());
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
    else this.router.navigate(['/hyrule']);
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
