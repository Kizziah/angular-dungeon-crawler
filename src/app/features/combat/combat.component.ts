import { Component, HostListener, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { CombatService } from '../../core/services/combat.service';
import { CombatState, CombatAction } from '../../core/models/combat.model';
import { Character } from '../../core/models/character.model';
import { MonsterInstance } from '../../core/models/monster.model';
import { SPELLS } from '../../core/data/spells.data';
import { MonsterSpriteComponent } from './monster-sprite.component';
import { ActionMenuComponent } from './action-menu.component';
import { CombatLogComponent } from './combat-log.component';

@Component({
  selector: 'app-combat',
  standalone: true,
  imports: [CommonModule, ActionMenuComponent, CombatLogComponent, MonsterSpriteComponent],
  templateUrl: './combat.component.html',
  styleUrls: ['./combat.component.scss']
})
export class CombatComponent implements OnInit {
  private gameState = inject(GameStateService);
  private combatService = inject(CombatService);
  private router = inject(Router);

  @Output() done = new EventEmitter<'victory' | 'defeat' | 'fled'>();
  @Input() hideEnemies = false;

  combatState: CombatState | null = null;
  selectedEnemyIndex = 0;

  ngOnInit(): void {
    const cs = this.gameState.combatState();
    if (!cs) {
      this.done.emit('victory');
      return;
    }
    this.combatState = cs;
  }

  getCurrentActor(): Character | null {
    if (!this.combatState) return null;
    // Find the first living character starting from currentActorIndex
    const party = this.combatState.party;
    const start = this.combatState.currentActorIndex;
    for (let i = 0; i < party.length; i++) {
      const c = party[(start + i) % party.length];
      if (c.currentHp > 0 && c.status !== 'Dead' && c.status !== 'Stoned') return c;
    }
    return null;
  }

  getCurrentActorSpells(): string[] {
    const actor = this.getCurrentActor();
    if (!actor) return [];
    return actor.spells.map(id => {
      const spell = SPELLS.find(s => s.id === id);
      return spell ? spell.name : id;
    });
  }

  getCurrentActorSpellIds(): string[] {
    return this.getCurrentActor()?.spells || [];
  }

  getAliveEnemies(): MonsterInstance[] {
    return this.combatState?.enemies.filter(e => e.status === 'alive') || [];
  }

  getAliveParty(): Character[] {
    return this.combatState?.party.filter(c => c.currentHp > 0 && c.status !== 'Dead') || [];
  }

  selectEnemy(idx: number): void {
    this.selectedEnemyIndex = idx;
  }

  onActionChosen(action: { type: string; spellId?: string }): void {
    if (!this.combatState || this.combatState.phase !== 'player-input') return;

    const actor = this.getCurrentActor();
    if (!actor) return;

    // Use the actual index of the alive actor in the party array
    const actorIndex = this.combatState.party.indexOf(actor);
    const stateWithCorrectActor = { ...this.combatState, currentActorIndex: actorIndex };

    const combatAction: CombatAction = {
      type: action.type as any,
      actorId: actor.id,
      targetIndex: this.selectedEnemyIndex,
      spellId: action.spellId
    };

    const newState = this.combatService.processPlayerAction(stateWithCorrectActor, combatAction);
    this.combatState = newState;
    this.gameState.combatState.set(newState);

    if (newState.phase === 'victory') {
      this.handleVictory(newState);
    } else if (newState.phase === 'defeat') {
      this.handleDefeat(newState);
    } else if (newState.phase === 'fled') {
      this.done.emit('fled');
    }
  }

  handleVictory(state: CombatState): void {
    // Find the first living party member to receive loot
    const firstAlive = state.party.find(p => p.currentHp > 0 && p.status !== 'Dead');

    this.gameState.updateGuild(g => ({
      ...g,
      gold: g.gold + state.goldGained,
      characters: g.characters.map(c => {
        const combatChar = state.party.find(p => p.id === c.id);
        if (!combatChar) return c;
        // Give loot items to the first living party member
        const newItems = (firstAlive && c.id === firstAlive.id && state.loot?.length)
          ? [...c.inventory, ...state.loot]
          : c.inventory;
        return {
          ...c,
          experience: c.experience + Math.floor(state.xpGained / state.party.length),
          currentHp: combatChar.currentHp,
          currentMp: combatChar.currentMp,
          kills: c.kills + state.enemies.length,
          inventory: newItems
        };
      })
    }));

    // Announce loot in victory event
    if (state.loot?.length) {
      const names = state.loot.map(i => i.unidentifiedName).join(', ');
      this.combatState = {
        ...state,
        log: [...state.log, `🎒 Looted: ${names}`]
      };
      this.gameState.combatState.set(this.combatState);
    }
  }

  handleDefeat(state: CombatState): void {
    // Mark dead characters
    this.gameState.updateGuild(g => ({
      ...g,
      characters: g.characters.map(c => {
        const combatChar = state.party.find(p => p.id === c.id);
        if (!combatChar) return c;
        return {
          ...c,
          currentHp: combatChar.currentHp,
          status: combatChar.status,
          deaths: c.deaths + (combatChar.status === 'Dead' ? 1 : 0)
        };
      })
    }));
  }

  continueAfterCombat(): void {
    const phase = this.combatState?.phase as 'victory' | 'defeat' | 'fled' | undefined;
    this.gameState.combatState.set(null);
    this.done.emit(phase ?? 'victory');
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const phase = this.combatState?.phase;
    if (phase === 'victory' || phase === 'defeat' || phase === 'fled') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.continueAfterCombat();
      }
    }
  }

  getHpPercent(entity: { currentHp: number; maxHp: number }): number {
    return Math.round((entity.currentHp / entity.maxHp) * 100);
  }

  getHpColor(pct: number): string {
    if (pct > 60) return '#33ff33';
    if (pct > 30) return '#ffaa00';
    return '#ff4444';
  }
}
