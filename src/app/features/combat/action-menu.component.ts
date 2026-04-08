import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CombatActionChoice = 'attack' | 'spell' | 'item' | 'defend' | 'flee';

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-menu.component.html',
  styleUrls: ['./action-menu.component.scss']
})
export class ActionMenuComponent {
  @Input() spells: string[] = [];
  @Input() hasItems = false;
  @Input() currentActor = '';
  @Output() actionChosen = new EventEmitter<{ type: CombatActionChoice; spellId?: string }>();

  showSpells = false;

  attack(): void {
    this.actionChosen.emit({ type: 'attack' });
  }

  defend(): void {
    this.actionChosen.emit({ type: 'defend' });
  }

  flee(): void {
    this.actionChosen.emit({ type: 'flee' });
  }

  toggleSpells(): void {
    this.showSpells = !this.showSpells;
  }

  castSpell(spellId: string): void {
    this.actionChosen.emit({ type: 'spell', spellId });
    this.showSpells = false;
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (this.showSpells) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.spells.length) {
        this.castSpell(this.spells[n - 1]);
      } else if (e.key.toLowerCase() === 'b' || e.key === 'Escape') {
        this.toggleSpells();
      }
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'a': this.attack();       break;
      case 's': if (this.spells.length > 0) this.toggleSpells(); break;
      case 'd': this.defend();       break;
      case 'f': this.flee();         break;
    }
  }
}
