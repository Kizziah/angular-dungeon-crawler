import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MystaraService } from '../../core/services/mystara.service';
import { TILE_RENDER, OverworldCell } from '../../core/models/overworld.model';

const MYSTARA_LOCATIONS = [
  { x: 70, y: 62, name: 'Specularum' },
  { x: 68, y: 56, name: 'Kelvin' },
  { x: 70, y: 52, name: 'Threshold' },
  { x: 64, y: 58, name: 'Blk Eagle' },
  { x: 84, y: 60, name: 'Thyatis' },
  { x: 90, y: 52, name: 'Kerendas' },
  { x: 78, y: 68, name: 'Lucinius' },
  { x: 44, y: 58, name: 'Darokin' },
  { x: 50, y: 50, name: 'Corunglain' },
  { x: 62, y: 48, name: 'Selenica' },
  { x: 38, y: 40, name: 'Glantri' },
  { x: 58, y: 52, name: 'Alfheim' },
  { x: 30, y: 20, name: 'Soderfjord' },
  { x: 38, y: 16, name: 'Vestland' },
  { x: 54, y: 10, name: 'Ostland' },
  { x: 80, y: 28, name: 'Dwarfgate' },
  { x: 64, y: 18, name: 'Heldann' },
  { x: 82, y: 42, name: 'Ylaruam' },
  { x: 28, y: 60, name: 'Five Shires' },
  { x: 66, y: 80, name: 'Ierendi' },
  { x: 52, y: 78, name: 'Minrothad' },
  { x: 66, y: 66, name: 'Portal' },
];

@Component({
  selector: 'app-mystara-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mystara-map.component.html',
  styleUrls: ['./mystara-map.component.scss']
})
export class MystaraMapComponent implements OnInit {
  private mystaraService = inject(MystaraService);
  private router = inject(Router);

  readonly TILE_RENDER = TILE_RENDER;
  readonly locations = MYSTARA_LOCATIONS;
  readonly OOB_CELL: OverworldCell = { type: 'ocean', visited: true, passable: false };

  mapRows = signal<OverworldCell[][]>([]);

  ngOnInit(): void {
    this.mapRows.set(this.mystaraService.getFullMap());
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
    else this.router.navigate(['/mystara']);
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
