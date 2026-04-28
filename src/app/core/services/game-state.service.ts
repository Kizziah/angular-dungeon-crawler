import { Injectable, signal, computed, effect } from '@angular/core';
import { GuildState } from '../models/guild.model';
import { DungeonState } from '../models/dungeon.model';
import { CombatState } from '../models/combat.model';
import { OverworldState } from '../models/overworld.model';
import { SaveService } from './save.service';
import { MASON_CHARACTER } from '../data/demo-characters.data';

const DEFAULT_GUILD: GuildState = {
  characters: [MASON_CHARACTER],
  gold: 500,
  bankGold: 0,
  name: 'The Adventurers Guild',
  founded: Date.now()
};

@Injectable({ providedIn: 'root' })
export class GameStateService {
  guild = signal<GuildState>({ ...DEFAULT_GUILD, founded: Date.now() });
  dungeonState = signal<DungeonState | null>(null);
  combatState = signal<CombatState | null>(null);
  overworldState = signal<OverworldState | null>(null);
  currentSaveSlot = signal<number>(0);
  gamePhase = signal<'title' | 'guild' | 'overworld' | 'town' | 'dungeon' | 'combat'>('guild');

  activeParty = computed(() => this.guild().characters.filter(c => c.inParty));

  private autoSaveEnabled = false;

  constructor(private saveService: SaveService) {
    // Try to load autosave
    const autosave = this.saveService.load(0);
    if (autosave) {
      this.guild.set(autosave.guild || { ...DEFAULT_GUILD, founded: Date.now() });
      this.dungeonState.set(autosave.dungeonState || null);
      this.overworldState.set(autosave.overworldState || null);
    }

    // Enable auto-save after initial load
    setTimeout(() => {
      this.autoSaveEnabled = true;
    }, 100);

    // Auto-save on state changes
    effect(() => {
      const state = {
        guild: this.guild(),
        dungeonState: this.dungeonState(),
        overworldState: this.overworldState(),
        timestamp: Date.now(),
        version: '1.0.0'
      };
      if (this.autoSaveEnabled) {
        this.saveService.autoSave(state);
      }
    });
  }

  loadGame(slot: number): boolean {
    const save = this.saveService.load(slot);
    if (!save) return false;
    this.guild.set(save.guild || { ...DEFAULT_GUILD, founded: Date.now() });
    this.dungeonState.set(save.dungeonState || null);
    this.overworldState.set(save.overworldState || null);
    this.currentSaveSlot.set(slot);
    return true;
  }

  saveGame(slot: number): void {
    this.saveService.save(slot, {
      guild: this.guild(),
      dungeonState: this.dungeonState(),
      overworldState: this.overworldState(),
      timestamp: Date.now(),
      version: '1.0.0'
    });
    this.currentSaveSlot.set(slot);
  }

  resetGame(): void {
    this.guild.set({ ...DEFAULT_GUILD, founded: Date.now() });
    this.dungeonState.set(null);
    this.combatState.set(null);
    this.overworldState.set(null);
  }

  updateGuild(updater: (g: GuildState) => GuildState): void {
    this.guild.update(updater);
  }
}
