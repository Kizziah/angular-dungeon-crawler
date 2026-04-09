import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HyruleService } from '../../core/services/hyrule.service';
import { OverworldState, TILE_RENDER, OverworldCell } from '../../core/models/overworld.model';

const VP_W = 21;
const VP_H = 15;

@Component({
  selector: 'app-hyrule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hyrule.component.html',
  styleUrls: ['./hyrule.component.scss']
})
export class HyruleComponent implements OnInit, OnDestroy {
  private hyruleService = inject(HyruleService);
  private router = inject(Router);

  statusMsg = signal('');
  private statusTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly VP_W = VP_W;
  readonly VP_H = VP_H;
  readonly TILE_RENDER = TILE_RENDER;

  state = signal<OverworldState | null>(null);

  viewport = computed(() => {
    const s = this.state();
    if (!s) return null;
    return this.hyruleService.getViewport(s, VP_W, VP_H);
  });

  playerVPX = Math.floor(VP_W / 2);
  playerVPY = Math.floor(VP_H / 2);

  ngOnInit(): void {
    this.state.set(this.hyruleService.initHyrule());
    this.setStatus('🗡️  You step into the land of Hyrule!');
  }

  ngOnDestroy(): void {
    if (this.statusTimeout) clearTimeout(this.statusTimeout);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    let dx = 0, dy = 0;
    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W': dy = -1; break;
      case 'ArrowDown':  case 's': case 'S': dy =  1; break;
      case 'ArrowLeft':  case 'a': case 'A': dx = -1; break;
      case 'ArrowRight': case 'd': case 'D': dx =  1; break;
      case 'Escape': this.router.navigate(['/overworld']); return;
      case 'm': case 'M': this.router.navigate(['/hyrule-map']); return;
      default: return;
    }

    e.preventDefault();
    this.step(dx, dy);
  }

  private step(dx: number, dy: number): void {
    const s = this.state();
    if (!s) return;

    const event = this.hyruleService.movePlayer(s, dx, dy);
    this.state.set({ ...s });

    switch (event.type) {
      case 'blocked':
        if (event.tile === 'mountain' || event.tile === 'snow') {
          this.setStatus('⛰️  The rocky terrain blocks your path.');
        } else {
          this.setStatus('🌊 The way is blocked.');
        }
        break;
      case 'enter-portal3':
        this.setStatus('✨ The portal glows... returning to Westeros...');
        setTimeout(() => this.router.navigate(['/overworld']), 600);
        break;
      case 'enter-town':
        this.setStatus('🏘️  You enter ' + (event.name ?? 'a village') + '. (Not yet open.)');
        break;
      case 'enter-city':
        this.setStatus('🏙️  You arrive at ' + (event.name ?? 'a city') + '. (Not yet open.)');
        break;
      case 'enter-castle':
        this.setStatus('🏰 You approach ' + (event.name ?? 'a castle') + '. (Not yet open.)');
        break;
      case 'enter-dungeon':
        this.setStatus('⚔️  You find ' + (event.name ?? 'a dungeon entrance') + '. (Not yet open.)');
        break;
      case 'encounter':
        this.setStatus('⚠️  A monster lurks in the ' + event.tile + '!');
        break;
      case 'move':
        this.clearStatus();
        break;
    }
  }

  private setStatus(msg: string): void {
    this.statusMsg.set(msg);
    if (this.statusTimeout) clearTimeout(this.statusTimeout);
    this.statusTimeout = setTimeout(() => this.statusMsg.set(''), 4000);
  }

  private clearStatus(): void {
    if (this.statusTimeout) clearTimeout(this.statusTimeout);
    this.statusMsg.set('');
  }

  readonly OOB_CELL: OverworldCell = { type: 'ocean', visited: true, passable: false };

  cellStyle(cell: OverworldCell | null, vpX: number, vpY: number): Record<string, string> {
    if (vpX === this.playerVPX && vpY === this.playerVPY) {
      return { color: '#ffffff', 'background-color': '#002211' };
    }
    const c = cell ?? this.OOB_CELL;
    const r = TILE_RENDER[c.type];
    return { color: r.color, 'background-color': r.bg ?? '#000000' };
  }

  cellChar(cell: OverworldCell | null, vpX: number, vpY: number): string {
    if (vpX === this.playerVPX && vpY === this.playerVPY) return '&#64;';
    const c = cell ?? this.OOB_CELL;
    return TILE_RENDER[c.type].char;
  }
}
