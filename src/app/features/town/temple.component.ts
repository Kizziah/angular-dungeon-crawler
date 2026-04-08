import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { TownService } from '../../core/services/town.service';
import { Character } from '../../core/models/character.model';
import { Item } from '../../core/models/item.model';

@Component({
  selector: 'app-temple',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './temple.component.html',
  styleUrls: ['./temple.component.scss']
})
export class TempleComponent {
  private gameState = inject(GameStateService);
  private townService = inject(TownService);
  private router = inject(Router);

  guild = this.gameState.guild;
  party = this.gameState.activeParty;
  message = '';

  resurrect(char: Character): void {
    const result = this.townService.resurrect(char, this.guild().gold);
    if (!result.success && this.guild().gold < result.cost) {
      this.message = `Not enough gold! Need ${result.cost} gp.`;
      return;
    }
    this.gameState.updateGuild(g => ({
      ...g,
      gold: g.gold - result.cost,
      characters: g.characters.map(c => c.id === char.id ? result.char : c)
    }));
    this.message = result.char.status === 'Healthy'
      ? `${char.name} has been resurrected!`
      : `The resurrection failed! ${char.name} is now ashes.`;
  }

  cureStatus(char: Character): void {
    const result = this.townService.cureStatus(char, this.guild().gold);
    if (!result.canAfford) {
      this.message = `Not enough gold! Need ${result.cost} gp.`;
      return;
    }
    this.gameState.updateGuild(g => ({
      ...g,
      gold: g.gold - result.cost,
      characters: g.characters.map(c => c.id === char.id ? result.newChar : c)
    }));
    this.message = `${char.name}'s status cured for ${result.cost} gp!`;
  }

  identifyItem(char: Character, item: Item): void {
    const result = this.townService.identifyItem(item, this.guild().gold);
    if (!result.canAfford) {
      this.message = `Not enough gold! Need ${result.cost} gp.`;
      return;
    }
    this.gameState.updateGuild(g => ({
      ...g,
      gold: g.gold - result.cost,
      characters: g.characters.map(c =>
        c.id === char.id
          ? { ...c, inventory: c.inventory.map(i => i.id === item.id ? result.item : i) }
          : c
      )
    }));
    this.message = `${result.item.name} identified for ${result.cost} gp!`;
  }

  getResurrectCost(char: Character): number {
    return 500 + char.level * 100;
  }

  getCureCost(char: Character): number {
    const costs: Record<string, number> = { Poisoned: 50, Paralyzed: 100, Stoned: 300 };
    return costs[char.status] || 0;
  }

  needsHelp(char: Character): boolean {
    return char.status !== 'Healthy';
  }

  getAllChars(): Character[] {
    return this.guild().characters;
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
