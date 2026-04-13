import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { DungeonService } from '../../core/services/dungeon.service';
import { DungeonViewComponent } from './dungeon-view.component';
import { MinimapComponent } from './minimap.component';
import { EncounterLogComponent } from './encounter-log.component';
import { CombatComponent } from '../combat/combat.component';
import { InventoryComponent } from '../inventory/inventory.component';
import { DungeonState } from '../../core/models/dungeon.model';
import { Character } from '../../core/models/character.model';
import { Item } from '../../core/models/item.model';

@Component({
  selector: 'app-dungeon',
  standalone: true,
  imports: [CommonModule, DungeonViewComponent, MinimapComponent, EncounterLogComponent, CombatComponent, InventoryComponent],
  templateUrl: './dungeon.component.html',
  styleUrls: ['./dungeon.component.scss']
})
export class DungeonComponent implements OnInit, OnDestroy {
  private gameState = inject(GameStateService);
  private dungeonService = inject(DungeonService);
  private router = inject(Router);

  dungeonState: DungeonState | null = null;
  party: Character[] = [];
  eventLog: string[] = [];
  pendingChest: Item[] = [];
  showChest = false;
  showConfirmExit = false;
  inventoryCharId: string | null = null;

  get inCombat(): boolean {
    return !!this.gameState.combatState();
  }

  ngOnInit(): void {
    this.party = this.gameState.activeParty().filter(c => c.currentHp > 0 && c.status !== 'Dead');
    if (this.party.length === 0) {
      this.router.navigate(['/guild']);
      return;
    }
    this.inventoryCharId = this.party[0].id;
    let ds = this.gameState.dungeonState();
    if (!ds) {
      ds = this.dungeonService.initDungeonState();
      this.gameState.dungeonState.set(ds);
    }
    this.dungeonState = ds;
    this.addLog(`Entered floor ${ds.currentFloor} of Mordor.`);
  }

  ngOnDestroy(): void {}

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.showChest || this.showConfirmExit || this.inCombat) return;
    switch (e.key) {
      case 'w': case 'W': case 'ArrowUp':    e.preventDefault(); this.move(0, -1); break;
      case 's': case 'S': case 'ArrowDown':  e.preventDefault(); this.move(0, 1);  break;
      case 'a': case 'A': case 'ArrowLeft':  e.preventDefault(); this.move(-1, 0); break;
      case 'd': case 'D': case 'ArrowRight': e.preventDefault(); this.move(1, 0);  break;
      case '>': case '.': this.useStairsDown(); break;
      case '<': case ',': this.useStairsUp();   break;
      case 'Escape': this.showConfirmExit = true; break;
    }
  }

  move(dx: number, dy: number): void {
    if (!this.dungeonState) return;
    const { newState, event } = this.dungeonService.moveParty(this.dungeonState, dx, dy);
    this.dungeonState = newState;
    this.gameState.dungeonState.set(newState);

    switch (event.type) {
      case 'encounter': {
        const aliveParty = this.party.filter(c => c.currentHp > 0 && c.status !== 'Dead');
        if (aliveParty.length === 0) break;
        this.addLog(`⚔ An enemy appears!`);
        const enemies = event.data;
        this.gameState.combatState.set({
          active: true, round: 1,
          party: aliveParty.map(c => ({ ...c })),
          enemies: enemies.monsters.map((m: any) => ({ ...m })),
          log: ['Combat begins!'],
          currentActorIndex: 0,
          phase: 'player-input' as const,
          pendingActions: [],
          xpGained: 0, goldGained: 0, loot: []
        });
        break;
      }
      case 'chest':
        this.pendingChest = event.data;
        this.showChest = true;
        this.addLog(`📦 Found a chest!`);
        break;
      case 'trap':
        this.handleTrap(event.data);
        break;
      case 'stairs-down':
        this.addLog(`Going down to floor ${this.dungeonState.currentFloor + 1}...`);
        this.descend();
        break;
      case 'stairs-up':
        if (this.dungeonState.currentFloor === 1) {
          this.addLog('Returning to town...');
          this.returnToTown();
        } else {
          this.addLog(`Going up to floor ${this.dungeonState.currentFloor - 1}...`);
          this.ascend();
        }
        break;
      case 'entrance':
        this.addLog('You are at the dungeon entrance.');
        break;
      case 'door':
        this.addLog('🚪 You open a door.');
        break;
      case 'blocked':
        break;
    }
  }

  onCombatDone(result: 'victory' | 'defeat' | 'fled'): void {
    this.gameState.combatState.set(null);
    this.party = this.gameState.activeParty().filter(c => c.currentHp > 0 && c.status !== 'Dead');
    // Refresh inventory panel to show updated character state
    if (this.party.length > 0 && !this.party.find(c => c.id === this.inventoryCharId)) {
      this.inventoryCharId = this.party[0].id;
    }

    if (result === 'defeat') {
      this.addLog('💀 The party has been slain...');
      // Remove dungeon state so next entry restarts
      this.gameState.dungeonState.set(null);
      this.router.navigate(['/guild']);
      return;
    }

    if (result === 'fled') {
      this.addLog('You fled from combat!');
    } else {
      this.addLog('Victory! Continuing exploration.');
    }
  }

  handleTrap(trap: any): void {
    this.addLog(`🪤 ${trap.message}`);
    if (trap.damage) {
      this.addLog(`Took ${trap.damage} damage!`);
    }
  }

  collectChest(): void {
    this.pendingChest.forEach(item => {
      const firstChar = this.party[0];
      if (firstChar) {
        this.gameState.updateGuild(g => ({
          ...g,
          characters: g.characters.map(c =>
            c.id === firstChar.id ? { ...c, inventory: [...c.inventory, item] } : c
          )
        }));
        this.addLog(`Found: ${item.unidentifiedName}`);
      }
    });
    this.showChest = false;
    this.pendingChest = [];
  }

  leaveChest(): void {
    this.showChest = false;
    this.pendingChest = [];
  }

  descend(): void {
    if (!this.dungeonState) return;
    const newState = this.dungeonService.descendFloor(this.dungeonState);
    this.dungeonState = newState;
    this.gameState.dungeonState.set(newState);
    this.addLog(`You descend to floor ${newState.currentFloor}.`);
  }

  ascend(): void {
    if (!this.dungeonState) return;
    const newState = this.dungeonService.ascendFloor(this.dungeonState);
    this.dungeonState = newState;
    this.gameState.dungeonState.set(newState);
    this.addLog(`You ascend to floor ${newState.currentFloor}.`);
  }

  returnToTown(): void {
    this.router.navigate(['/town']);
  }

  confirmExit(): void {
    this.showConfirmExit = false;
    this.router.navigate(['/town']);
  }

  cancelExit(): void {
    this.showConfirmExit = false;
  }

  addLog(msg: string): void {
    this.eventLog = [...this.eventLog, msg].slice(-50);
  }

  getCurrentFloor() {
    return this.dungeonState?.floors[this.dungeonState.currentFloor];
  }

  getCurrentPosition() {
    return this.dungeonState?.partyPosition || { x: 0, y: 0 };
  }

  getCurrentDirection() {
    return this.dungeonState?.partyDirection || 'N';
  }

  getCurrentFloorLevel() {
    return this.dungeonState?.currentFloor || 1;
  }

  getCurrentTileType(): string {
    if (!this.dungeonState) return 'none';
    const floor = this.dungeonState.floors[this.dungeonState.currentFloor];
    const { x, y } = this.dungeonState.partyPosition;
    return floor?.cells[y]?.[x]?.type ?? 'none';
  }

  useStairsDown(): void {
    const tile = this.getCurrentTileType();
    if (tile === 'stairs-down') {
      this.addLog(`Going down to floor ${this.dungeonState!.currentFloor + 1}...`);
      this.descend();
    } else {
      this.addLog('No stairs leading down here.');
    }
  }

  useStairsUp(): void {
    const tile = this.getCurrentTileType();
    if (tile === 'stairs-up' || tile === 'entrance') {
      if (this.dungeonState!.currentFloor === 1) {
        this.addLog('Returning to town...');
        this.returnToTown();
      } else {
        this.addLog(`Going up to floor ${this.dungeonState!.currentFloor - 1}...`);
        this.ascend();
      }
    } else {
      this.addLog('No stairs leading up here.');
    }
  }

  selectInventoryChar(charId: string): void {
    this.inventoryCharId = charId;
  }

  closeInventory(): void {
    // Refresh party after any equip/drop changes
    this.party = this.gameState.activeParty().filter(c => c.currentHp > 0 && c.status !== 'Dead');
  }
}
