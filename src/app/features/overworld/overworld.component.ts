import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { OverworldService } from '../../core/services/overworld.service';
import { TILE_RENDER, OverworldCell } from '../../core/models/overworld.model';

const VP_W = 21;
const VP_H = 15;

@Component({
  selector: 'app-overworld',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overworld.component.html',
  styleUrls: ['./overworld.component.scss']
})
export class OverworldComponent implements OnInit, OnDestroy {
  private gameState = inject(GameStateService);
  private overworldService = inject(OverworldService);
  private router = inject(Router);

  statusMsg = signal('');
  private statusTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly VP_W = VP_W;
  readonly VP_H = VP_H;
  readonly TILE_RENDER = TILE_RENDER;

  get state() { return this.gameState.overworldState(); }

  inShip = computed(() => this.gameState.overworldState()?.inShip ?? false);

  viewport = computed(() => {
    const s = this.gameState.overworldState();
    if (!s) return null;
    return this.overworldService.getViewport(s, VP_W, VP_H);
  });

  playerVPX = computed(() => Math.floor(VP_W / 2));
  playerVPY = computed(() => Math.floor(VP_H / 2));

  ngOnInit(): void {
    if (!this.gameState.overworldState()) {
      this.gameState.overworldState.set(this.overworldService.initOverworld());
    }
    this.setStatus('⚔️  You step onto the overworld. Use arrows or WASD to move.');
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
      case 'Escape': this.router.navigate(['/guild']); return;
      case 'm': case 'M': this.router.navigate(['/worldmap']); return;
      default: return;
    }

    e.preventDefault();
    this.step(dx, dy);
  }

  private step(dx: number, dy: number): void {
    const s = this.gameState.overworldState();
    if (!s) return;

    const event = this.overworldService.movePlayer(s, dx, dy);
    this.gameState.overworldState.set({ ...s });

    switch (event.type) {
      case 'blocked':
        if (event.tile === 'wall') {
          this.setStatus('🧱 The Wall stands before you — none may pass.');
        } else if (event.tile === 'mountain') {
          this.setStatus('⛰️  The mountains block your path.');
        } else if (event.tile === 'river') {
          this.setStatus('🌊 The river blocks your path — find a bridge to cross.');
        } else {
          this.setStatus(s.inShip ? '⛵ You cannot sail there.' : '🌊 The way is blocked.');
        }
        break;
      case 'boarded':
        this.setStatus('⛵ You board the ship! Sail the seas — step onto land to disembark.');
        break;
      case 'disembarked':
        this.setStatus('🏖️  You disembark. Your ship waits in the water.');
        break;
      case 'enter-town':
        this.setStatus(`🏘️  Entering ${event.name ?? 'the Town of Dejenol'}...`);
        setTimeout(() => this.router.navigate(['/town']), 400);
        break;
      case 'enter-city':
        this.setStatus(`🏙️  You arrive at ${event.name ?? 'a city'}. (City not yet open.)`);
        break;
      case 'enter-castle':
        this.setStatus(`🏰 You arrive at ${event.name ?? 'a castle'}. (Castle not yet open.)`);
        break;
      case 'enter-dungeon':
        this.setStatus('⚔️  You descend into the dungeon...');
        setTimeout(() => this.router.navigate(['/dungeon']), 400);
        break;
      case 'enter-portal':
        this.setStatus('✨ A shimmering portal draws you in...');
        setTimeout(() => this.router.navigate(['/alefgard']), 600);
        break;
      case 'enter-portal2':
        this.setStatus('🌀 A cyan portal swirls open... the Known World awaits!');
        setTimeout(() => this.router.navigate(['/mystara']), 600);
        break;
      case 'enter-portal3':
        this.setStatus('🗡️  A golden portal flickers... Hyrule awaits!');
        setTimeout(() => this.router.navigate(['/hyrule']), 600);
        break;
      case 'encounter':
        this.setStatus(this.encounterMsg(event.tile));
        break;
      case 'move':
        this.clearStatus();
        break;
    }
  }

  private encounterMsg(tile?: string): string {
    switch (tile) {
      case 'forest':  return '🐺 A pack of wolves charges from the trees!';
      case 'plains':  return '⚔️  Bandits leap from the tall grass!';
      case 'swamp':   return '🐍 Something slithers up from the bog!';
      case 'snow':    return '🧊 White Walkers stir in the frozen wastes!';
      case 'coast':   return '🦀 Strange creatures lurk along the shore!';
      default:        return '⚠️  An enemy blocks your path!';
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
    const isPlayer = vpX === this.playerVPX() && vpY === this.playerVPY();
    if (isPlayer) {
      // Cyan tint when sailing
      const bg = this.inShip() ? '#001a33' : '#333300';
      return { color: '#ffffff', 'background-color': bg };
    }

    const c = cell ?? this.OOB_CELL;
    const r = TILE_RENDER[c.type];
    return { color: r.color, 'background-color': r.bg ?? '#000000' };
  }

  cellChar(cell: OverworldCell | null, vpX: number, vpY: number): string {
    if (vpX === this.playerVPX() && vpY === this.playerVPY()) {
      return this.inShip() ? '⛵' : '@';
    }
    const c = cell ?? this.OOB_CELL;
    return TILE_RENDER[c.type].char;
  }
}
