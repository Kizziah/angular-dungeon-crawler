import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { OverworldService } from '../../core/services/overworld.service';
import { OverworldViewComponent } from './overworld-3d-view.component';

const VP_W = 21;
const VP_H = 15;

@Component({
  selector: 'app-overworld',
  standalone: true,
  imports: [CommonModule, OverworldViewComponent],
  templateUrl: './overworld.component.html',
  styleUrls: ['./overworld.component.scss']
})
export class OverworldComponent implements OnInit, OnDestroy {
  private gameState = inject(GameStateService);
  private overworldService = inject(OverworldService);
  private router = inject(Router);

  statusMsg = signal('');
  private statusTimeout: ReturnType<typeof setTimeout> | null = null;

  get state() { return this.gameState.overworldState(); }
  inShip  = computed(() => this.gameState.overworldState()?.inShip ?? false);
  direction = computed(() => this.gameState.overworldState()?.direction ?? 'N');
  activeCharacter = computed(() => this.gameState.activeParty()[0] ?? null);
  viewport = computed(() => {
    const s = this.gameState.overworldState();
    return s ? this.overworldService.getViewport(s, VP_W, VP_H) : null;
  });

  ngOnInit(): void {
    if (!this.gameState.overworldState()) {
      this.gameState.overworldState.set(this.overworldService.initOverworld());
    }
    this.setStatus('⚔️  You step onto the overworld. W/S = forward/back, A/D = turn.');
  }

  ngOnDestroy(): void {
    if (this.statusTimeout) clearTimeout(this.statusTimeout);
  }

  // ── Direction tables (mirrors dungeon component) ─────────────────────────
  private static readonly FORWARD: Record<string, [number, number]> = {
    N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0]
  };
  private static readonly TURN_LEFT: Record<string, 'N' | 'S' | 'E' | 'W'> = {
    N: 'W', W: 'S', S: 'E', E: 'N'
  };
  private static readonly TURN_RIGHT: Record<string, 'N' | 'S' | 'E' | 'W'> = {
    N: 'E', E: 'S', S: 'W', W: 'N'
  };

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const facing = (this.gameState.overworldState()?.direction ?? 'N') as 'N' | 'S' | 'E' | 'W';
    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W': {
        e.preventDefault();
        const [dx, dy] = OverworldComponent.FORWARD[facing];
        this.step(dx, dy);
        break;
      }
      case 'ArrowDown':  case 's': case 'S': {
        e.preventDefault();
        const [dx, dy] = OverworldComponent.FORWARD[facing];
        this.step(-dx, -dy);
        break;
      }
      case 'ArrowLeft':  case 'a': case 'A':
        e.preventDefault();
        this.turn(OverworldComponent.TURN_LEFT[facing]);
        break;
      case 'ArrowRight': case 'd': case 'D':
        e.preventDefault();
        this.turn(OverworldComponent.TURN_RIGHT[facing]);
        break;
      case 'Escape': this.router.navigate(['/guild']); return;
      case 'm': case 'M': this.router.navigate(['/worldmap']); return;
      default: return;
    }
  }

  private turn(newDir: 'N' | 'S' | 'E' | 'W'): void {
    const s = this.gameState.overworldState();
    if (!s) return;
    s.direction = newDir;
    this.gameState.overworldState.set({ ...s });
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
}
