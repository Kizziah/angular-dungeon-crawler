import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../core/models/character.model';
import { CharacterService } from '../../core/services/character.service';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-card.component.html',
  styleUrls: ['./character-card.component.scss']
})
export class CharacterCardComponent {
  @Input() character!: Character;
  @Input() selected = false;
  @Output() addToParty = new EventEmitter<Character>();
  @Output() removeFromParty = new EventEmitter<Character>();
  @Output() viewInventory = new EventEmitter<Character>();

  private charService = inject(CharacterService);

  getHpPercent(): number {
    return Math.round((this.character.currentHp / this.character.maxHp) * 100);
  }

  getHpClass(): string {
    const pct = this.getHpPercent();
    if (pct > 60) return 'hp-full';
    if (pct > 30) return 'hp-med';
    return 'hp-low';
  }

  getStatusColor(): string {
    switch (this.character.status) {
      case 'Healthy': return '#33ff33';
      case 'Poisoned': return '#00ff88';
      case 'Paralyzed': return '#ffaa00';
      case 'Stoned': return '#888888';
      case 'Dead': return '#ff4444';
      case 'Ashes': return '#666666';
      default: return '#33ff33';
    }
  }

  getAC(): number {
    return this.charService.calcAC(this.character);
  }

  getAttackBonus(): number {
    return this.charService.calcAttackBonus(this.character);
  }

  getAttackBonusStr(): string {
    const b = this.getAttackBonus();
    return b >= 0 ? `+${b}` : `${b}`;
  }
}
