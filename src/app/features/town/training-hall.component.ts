import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { TownService } from '../../core/services/town.service';
import { Character } from '../../core/models/character.model';

@Component({
  selector: 'app-training-hall',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './training-hall.component.html',
  styleUrls: ['./training-hall.component.scss']
})
export class TrainingHallComponent {
  private gameState = inject(GameStateService);
  private townService = inject(TownService);
  private router = inject(Router);

  guild = this.gameState.guild;
  message = '';

  getAllChars(): Character[] {
    return this.guild().characters;
  }

  canLevelUp(char: Character): boolean {
    return char.experience >= char.experienceToNext;
  }

  getLevelCost(char: Character): number {
    return 100 * char.level;
  }

  levelUp(char: Character): void {
    const result = this.townService.levelUp(char, this.guild().gold);
    if (!result.canLevel) {
      this.message = `${char.name} needs more experience!`;
      return;
    }
    if (!result.canAfford) {
      this.message = `Not enough gold! Need ${result.cost} gp.`;
      return;
    }
    this.gameState.updateGuild(g => ({
      ...g,
      gold: g.gold - result.cost,
      characters: g.characters.map(c => c.id === char.id ? result.char : c)
    }));
    this.message = `${char.name} leveled up to level ${result.char.level}!`;
  }

  getXpProgress(char: Character): number {
    return Math.round((char.experience / char.experienceToNext) * 100);
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
}
