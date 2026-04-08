import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-town',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './town.component.html',
  styleUrls: ['./town.component.scss']
})
export class TownComponent {
  private gameState = inject(GameStateService);
  private router = inject(Router);

  guild = this.gameState.guild;
  party = this.gameState.activeParty;

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    // Don't intercept when focus is inside an input/textarea
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    switch (e.key.toLowerCase()) {
      case 'i': this.router.navigate(['/town/inn']);      break;
      case 's': this.router.navigate(['/town/shop']);     break;
      case 't': this.router.navigate(['/town/temple']);   break;
      case 'r': this.router.navigate(['/town/training']); break;
      case 'b': this.router.navigate(['/town/bank']);     break;
      case 'd': this.router.navigate(['/dungeon']);       break;
      case 'g': this.router.navigate(['/guild']);         break;
    }
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  returnToGuild(): void {
    this.router.navigate(['/guild']);
  }

  enterDungeon(): void {
    this.router.navigate(['/dungeon']);
  }
}
