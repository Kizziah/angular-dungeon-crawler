import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { GuildService } from '../../core/services/guild.service';
import { Character } from '../../core/models/character.model';
import { CharacterCardComponent } from './character-card.component';

@Component({
  selector: 'app-guild',
  standalone: true,
  imports: [CommonModule, CharacterCardComponent],
  templateUrl: './guild.component.html',
  styleUrls: ['./guild.component.scss']
})
export class GuildComponent {
  private gameState = inject(GameStateService);
  private guildService = inject(GuildService);
  private router = inject(Router);

  guild = this.gameState.guild;
  activeParty = this.gameState.activeParty;

  get characters() { return this.guild().characters; }
  get partyCount() { return this.activeParty().length; }
  get guildGold() { return this.guild().gold; }

  addToParty(char: Character): void {
    if (this.partyCount >= 6) return;
    this.gameState.updateGuild(g => this.guildService.addToParty(g, char.id));
  }

  removeFromParty(char: Character): void {
    this.gameState.updateGuild(g => this.guildService.removeFromParty(g, char.id));
  }

  viewInventory(char: Character): void {
    this.router.navigate(['/inventory', char.id]);
  }

  createCharacter(): void {
    this.router.navigate(['/create-character']);
  }

  goToTown(): void {
    if (this.partyCount === 0) {
      alert('Add at least one character to the party first!');
      return;
    }
    this.router.navigate(['/town']);
  }

  enterDungeon(): void {
    if (this.partyCount === 0) {
      alert('Add at least one character to the party first!');
      return;
    }
    this.router.navigate(['/dungeon']);
  }

  goToOverworld(): void {
    if (this.partyCount === 0) {
      alert('Add at least one character to the party first!');
      return;
    }
    this.router.navigate(['/overworld']);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    switch (e.key.toLowerCase()) {
      case 'n': this.createCharacter();  break;
      case 't': this.goToTown();         break;
      case 'd': this.enterDungeon();     break;
      case 'o': this.goToOverworld();    break;
    }
  }

  deleteCharacter(char: Character): void {
    if (char.inParty) return;
    if (confirm(`Delete ${char.name}?`)) {
      this.gameState.updateGuild(g => ({
        ...g,
        characters: g.characters.filter(c => c.id !== char.id)
      }));
    }
  }
}
