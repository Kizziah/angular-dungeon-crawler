import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MONSTERS } from '../../core/data/monsters.data';
import { ITEMS, ItemDef } from '../../core/data/items.data';
import { MonsterDef } from '../../core/models/monster.model';
import { ItemType } from '../../core/models/item.model';
import { MonsterSpriteComponent } from '../combat/monster-sprite.component';
import { AlefgardService } from '../../core/services/alefgard.service';
import { HyruleService } from '../../core/services/hyrule.service';
import { MystaraService } from '../../core/services/mystara.service';
import { OverworldService } from '../../core/services/overworld.service';
import { GameStateService } from '../../core/services/game-state.service';
import { TILE_RENDER, OverworldCell } from '../../core/models/overworld.model';
import { TORLAND_LOCATIONS } from '../../core/data/torland_map.data';

interface WorldInfo {
  name: string;
  emoji: string;
  subtitle: string;
  route: string;
  grid: string[][];
  locations: string[];
}

const MINI_STEP = 3;
const ALEFGARD_LOCS = ['Tantegel Castle', 'Brecconary', 'Kol', 'Garinham', 'Rimuldar', 'Hauksness', 'Cantlin', 'Charlock'];
const HYRULE_LOCS   = ['Hyrule Castle', 'Kakariko', 'Mido', 'Saria', 'Nabooru', 'Ruto', 'Death Mountain'];
const MYSTARA_LOCS  = ['Specularum', 'Kelvin', 'Threshold', 'Thyatis', 'Darokin', 'Glantri', 'Alfheim', 'Ylaruam'];

const ITEM_TYPE_ICONS: Record<string, string> = {
  Weapon: '⚔️', Shield: '🛡️', Helmet: '⛑️', BodyArmor: '🥋',
  Gloves: '🧤', Boots: '👢', Ring: '💍', Amulet: '📿',
  Potion: '🧪', Scroll: '📜', Wand: '🪄', Food: '🍞', Gold: '🪙',
};

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, MonsterSpriteComponent],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {
  private router = inject(Router);
  private alefgardService = inject(AlefgardService);
  private hyruleService   = inject(HyruleService);
  private mystaraService  = inject(MystaraService);
  private overworldService = inject(OverworldService);
  private gameState        = inject(GameStateService);

  tab: 'monsters' | 'items' | 'maps' = 'monsters';

  // World Maps
  worlds: WorldInfo[] = [];

  ngOnInit(): void {
    this.buildWorlds();
  }

  private buildMini(map: OverworldCell[][]): string[][] {
    const rows: string[][] = [];
    for (let y = 0; y < map.length; y += MINI_STEP) {
      const row: string[] = [];
      for (let x = 0; x < (map[y]?.length ?? 0); x += MINI_STEP) {
        const cell = map[y]?.[x];
        row.push(cell ? (TILE_RENDER[cell.type].bg ?? '#000') : '#000');
      }
      rows.push(row);
    }
    return rows;
  }

  private buildWorlds(): void {
    const torlandState = this.gameState.overworldState() ?? this.overworldService.initOverworld();
    this.worlds = [
      {
        name: 'Torland',
        emoji: '🗺️',
        subtitle: 'The Known World',
        route: '/worldmap',
        grid: this.buildMini(this.overworldService.getFullMap(torlandState)),
        locations: TORLAND_LOCATIONS
          .filter(l => l.type === 'town' || l.type === 'castle')
          .map(l => l.name),
      },
      {
        name: 'Alefgard',
        emoji: '🏰',
        subtitle: 'Dragon Warrior',
        route: '/alefgard-map',
        grid: this.buildMini(this.alefgardService.getFullMap()),
        locations: ALEFGARD_LOCS,
      },
      {
        name: 'Hyrule',
        emoji: '🗡️',
        subtitle: 'The Legend of Zelda',
        route: '/hyrule-map',
        grid: this.buildMini(this.hyruleService.getFullMap()),
        locations: HYRULE_LOCS,
      },
      {
        name: 'Mystara',
        emoji: '🌍',
        subtitle: 'D&D Known World',
        route: '/mystara-map',
        grid: this.buildMini(this.mystaraService.getFullMap()),
        locations: MYSTARA_LOCS,
      },
    ];
  }

  goToMap(route: string): void { this.router.navigate([route]); }

  trackByIdx(i: number): number { return i; }

  // Monsters
  allMonsters: MonsterDef[] = [...MONSTERS].sort((a, b) => a.floorMin - b.floorMin);
  selectedMonster: MonsterDef | null = null;
  monsterFilter = 'all';

  get filteredMonsters(): MonsterDef[] {
    if (this.monsterFilter === 'all') return this.allMonsters;
    const floor = parseInt(this.monsterFilter, 10);
    return this.allMonsters.filter(m => m.floorMin <= floor && m.floorMax >= floor);
  }

  // Items
  allItems: ItemDef[] = [...ITEMS].sort((a, b) => a.value - b.value);
  selectedItem: ItemDef | null = null;
  itemTypeFilter: ItemType | 'all' = 'all';

  readonly itemTypes: (ItemType | 'all')[] = [
    'all', 'Weapon', 'Shield', 'BodyArmor', 'Helmet',
    'Gloves', 'Boots', 'Ring', 'Amulet', 'Potion', 'Scroll', 'Food',
  ];

  get filteredItems(): ItemDef[] {
    if (this.itemTypeFilter === 'all') return this.allItems;
    return this.allItems.filter(i => i.type === this.itemTypeFilter);
  }

  itemIcon(type: string): string { return ITEM_TYPE_ICONS[type] ?? '?'; }

  statSummary(item: ItemDef): string {
    const s = item.stats;
    const parts: string[] = [];
    if (s.damage)     parts.push(`DMG ${s.damage}`);
    if (s.attack)     parts.push(`ATK ${s.attack > 0 ? '+' : ''}${s.attack}`);
    if (s.defense)    parts.push(`DEF +${s.defense}`);
    if (s.hpBonus)    parts.push(`HP +${s.hpBonus}`);
    if (s.strBonus)   parts.push(`STR +${s.strBonus}`);
    if (s.intBonus)   parts.push(`INT +${s.intBonus}`);
    if (s.agiBonus)   parts.push(`AGI +${s.agiBonus}`);
    if (s.vitBonus)   parts.push(`VIT +${s.vitBonus}`);
    if (s.luckBonus)  parts.push(`LCK +${s.luckBonus}`);
    return parts.join('  ') || '—';
  }

  selectMonster(m: MonsterDef): void { this.selectedMonster = m === this.selectedMonster ? null : m; }
  selectItem(i: ItemDef):     void { this.selectedItem    = i === this.selectedItem    ? null : i; }

  abilityLabel(ability: string): string {
    const labels: Record<string, string> = {
      'poison': 'Poison', 'paralyze': 'Paralyze', 'petrify': 'Petrify',
      'drain-level': 'Level Drain', 'steal-gold': 'Steal Gold',
      'breathe-fire': 'Breathe Fire', 'breathe-cold': 'Breathe Cold',
      'magic': 'Magic', 'regenerate': 'Regenerate', 'cast-spell': 'Cast Spell',
      'instant-kill': 'Instant Kill',
    };
    return labels[ability] ?? ability;
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') this.back();
  }

  back(): void { this.router.navigate(['/town']); }
}
