import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Race, CharacterClass, Alignment, Stats } from '../../core/models/character.model';
import { CharacterService } from '../../core/services/character.service';
import { GameStateService } from '../../core/services/game-state.service';
import { RACES } from '../../core/data/races.data';
import { CLASSES } from '../../core/data/classes.data';

type CreationStep = 'name' | 'race' | 'class' | 'alignment' | 'stats' | 'confirm';

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-creation.component.html',
  styleUrls: ['./character-creation.component.scss']
})
export class CharacterCreationComponent {
  private charService = inject(CharacterService);
  private gameState = inject(GameStateService);
  private router = inject(Router);

  step = signal<CreationStep>('name');
  name = signal('');
  selectedRace = signal<Race>('Human');
  selectedClass = signal<CharacterClass>('Fighter');
  selectedAlignment = signal<Alignment>('Good');
  rolledStats = signal<Stats | null>(null);
  rerollCount = signal(0);
  nameModel = '';

  races = RACES;
  classes = CLASSES;
  alignments: Alignment[] = ['Good', 'Neutral', 'Evil'];

  availableClasses = computed(() => {
    const race = RACES.find(r => r.name === this.selectedRace());
    return CLASSES.filter(c => race?.allowedClasses.includes(c.name));
  });

  availableAlignments = computed(() => {
    const cls = CLASSES.find(c => c.name === this.selectedClass());
    const race = RACES.find(r => r.name === this.selectedRace());
    const clsAligns = new Set(cls?.allowedAlignments || []);
    const raceAligns = new Set(race?.allowedAlignments || []);
    return this.alignments.filter(a => clsAligns.has(a) && raceAligns.has(a));
  });

  isNameValid = computed(() => this.name().trim().length >= 2 && this.name().trim().length <= 20);

  nextStep(): void {
    const steps: CreationStep[] = ['name', 'race', 'class', 'alignment', 'stats', 'confirm'];
    const idx = steps.indexOf(this.step());
    if (idx < steps.length - 1) {
      if (this.step() === 'alignment') {
        this.rollStats();
      }
      this.step.set(steps[idx + 1]);
    }
  }

  prevStep(): void {
    const steps: CreationStep[] = ['name', 'race', 'class', 'alignment', 'stats', 'confirm'];
    const idx = steps.indexOf(this.step());
    if (idx > 0) this.step.set(steps[idx - 1]);
    else this.router.navigate(['/guild']);
  }

  selectRace(race: Race): void {
    this.selectedRace.set(race);
    const available = CLASSES.filter(c => {
      const r = RACES.find(r => r.name === race);
      return r?.allowedClasses.includes(c.name);
    });
    if (!available.find(c => c.name === this.selectedClass())) {
      this.selectedClass.set(available[0].name);
    }
  }

  selectClass(cls: CharacterClass): void {
    this.selectedClass.set(cls);
    const aligns = this.availableAlignments();
    if (!aligns.includes(this.selectedAlignment())) {
      this.selectedAlignment.set(aligns[0]);
    }
  }

  rollStats(): void {
    const stats = this.charService.rollStats(this.selectedRace(), this.selectedClass());
    this.rolledStats.set(stats);
    this.rerollCount.update(c => c + 1);
  }

  reroll(): void {
    if (this.rerollCount() < 10) {
      this.rollStats();
    }
  }

  confirmCreate(): void {
    if (!this.isNameValid() || !this.rolledStats()) return;
    const char = this.charService.createCharacter(
      this.name().trim(),
      this.selectedRace(),
      this.selectedClass(),
      this.selectedAlignment()
    );
    // Override the auto-rolled stats with our rolled stats
    const finalChar = { ...char, stats: this.rolledStats()! };
    this.gameState.updateGuild(g => ({
      ...g,
      characters: [...g.characters, finalChar]
    }));
    this.router.navigate(['/guild']);
  }

  getRaceDesc(): string {
    return RACES.find(r => r.name === this.selectedRace())?.description || '';
  }

  getClassDesc(): string {
    return CLASSES.find(c => c.name === this.selectedClass())?.description || '';
  }

  statKeys(): (keyof Stats)[] {
    return ['strength', 'intelligence', 'piety', 'vitality', 'agility', 'luck'];
  }

  statLabel(key: keyof Stats): string {
    const map: Record<string, string> = {
      strength: 'STR', intelligence: 'INT', piety: 'PIE',
      vitality: 'VIT', agility: 'AGI', luck: 'LCK'
    };
    return map[key] || key.toUpperCase().slice(0, 3);
  }

  statColor(val: number): string {
    if (val >= 16) return '#ffff00';
    if (val >= 13) return '#33ff33';
    if (val >= 10) return '#cccccc';
    if (val >= 7) return '#ffaa00';
    return '#ff4444';
  }
}
