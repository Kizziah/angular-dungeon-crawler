import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MONSTERS } from '../../core/data/monsters.data';
import { MonsterDef } from '../../core/models/monster.model';
import { MonsterSpriteComponent } from '../combat/monster-sprite.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, MonsterSpriteComponent],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent {
  private router = inject(Router);

  // Low-level monsters: those that appear on floors 1–5
  monsters: MonsterDef[] = MONSTERS.filter(m => m.floorMin <= 5).sort((a, b) => a.floorMin - b.floorMin);

  selectedMonster: MonsterDef | null = null;

  select(m: MonsterDef): void {
    this.selectedMonster = m === this.selectedMonster ? null : m;
  }

  abilityLabel(ability: string): string {
    const labels: Record<string, string> = {
      'poison': 'Poison',
      'paralyze': 'Paralyze',
      'petrify': 'Petrify',
      'drain-level': 'Level Drain',
      'steal-gold': 'Steal Gold',
      'breathe-fire': 'Breathe Fire',
      'magic': 'Magic',
      'regenerate': 'Regenerate',
    };
    return labels[ability] ?? ability;
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
