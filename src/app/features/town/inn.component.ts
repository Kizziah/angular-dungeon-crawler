import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { TownService } from '../../core/services/town.service';

@Component({
  selector: 'app-inn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inn.component.html',
  styleUrls: ['./inn.component.scss']
})
export class InnComponent {
  private gameState = inject(GameStateService);
  private townService = inject(TownService);
  private router = inject(Router);

  guild = this.gameState.guild;
  party = this.gameState.activeParty;
  message = '';

  rest(): void {
    const chars = this.party();
    const result = this.townService.rest(chars, this.guild().gold);
    if (!result.canAfford) {
      this.message = `Not enough gold! Need ${result.cost} gp.`;
      return;
    }
    this.gameState.updateGuild(g => ({
      ...g,
      gold: g.gold - result.cost,
      characters: g.characters.map(c => {
        const healed = result.healed.find(h => h.id === c.id);
        return healed || c;
      })
    }));
    this.message = `Party rested and recovered! Cost: ${result.cost} gp.`;
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') this.back();
  }

    back(): void {
    this.router.navigate(['/town']);
  }

  getCost(): number {
    return this.party().length * 10;
  }
}
