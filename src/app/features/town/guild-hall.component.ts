import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { CharacterService } from '../../core/services/character.service';
import { CLASSES, ClassDef } from '../../core/data/classes.data';
import { Character, CharacterClass } from '../../core/models/character.model';

interface GuildDef {
  id: string;
  name: string;
  icon: string;
  flavor: string;
  master: string;
  classes: CharacterClass[];
  classChangeCost: number;   // gold per level
  minLevelForChange: number;
}

const GUILDS: Record<string, GuildDef> = {
  fighters: {
    id: 'fighters',
    name: "Fighters Guild",
    icon: '⚔️',
    flavor: 'The clang of steel fills the hall. Warriors of every stripe train here, forging bodies and blades into instruments of war.',
    master: 'Ser Rodrik, Guildmaster',
    classes: ['Fighter', 'Valkyrie', 'Samurai', 'Ranger'],
    classChangeCost: 200,
    minLevelForChange: 3,
  },
  mages: {
    id: 'mages',
    name: "Mages Guild",
    icon: '🔮',
    flavor: 'Arcane tomes line the walls. The smell of parchment and spell reagents hangs in the air. Knowledge is power — and power has a price.',
    master: 'Archmagus Elara',
    classes: ['Wizard', 'Ranger'],
    classChangeCost: 300,
    minLevelForChange: 3,
  },
  thieves: {
    id: 'thieves',
    name: "Thieves Guild",
    icon: '🗝️',
    flavor: 'A dimly lit back room. Patrons speak in hushed tones. The guild deals in secrets, shadows, and a cut of every heist.',
    master: '"The Shadow", Guild Contact',
    classes: ['Thief', 'Ninja'],
    classChangeCost: 250,
    minLevelForChange: 3,
  },
  temple: {
    id: 'temple',
    name: "Priests Guild",
    icon: '✝️',
    flavor: 'Candles flicker in the nave. The priests offer counsel, healing, and the divine arts to the faithful.',
    master: 'High Priest Aldric',
    classes: ['Priest', 'Valkyrie'],
    classChangeCost: 200,
    minLevelForChange: 3,
  },
};

@Component({
  selector: 'app-guild-hall',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guild-hall.component.html',
  styleUrls: ['./guild-hall.component.scss'],
})
export class GuildHallComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private gameState  = inject(GameStateService);
  private charSvc    = inject(CharacterService);

  guild!: GuildDef;
  guildClasses: ClassDef[] = [];

  party        = this.gameState.activeParty;
  selectedChar: Character | null = null;
  message      = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? 'fighters';
    this.guild = GUILDS[id] ?? GUILDS['fighters'];
    this.guildClasses = CLASSES.filter(c => this.guild.classes.includes(c.name));
  }

  selectChar(char: Character): void {
    this.selectedChar = char === this.selectedChar ? null : char;
    this.message = '';
  }

  canChange(char: Character, cls: ClassDef): boolean {
    if (char.class === cls.name) return false;
    if (char.level < this.guild.minLevelForChange) return false;
    if (!cls.allowedAlignments.includes(char.alignment)) return false;
    const cost = this.changeCost(char);
    return char.gold >= cost;
  }

  changeCost(char: Character): number {
    return char.level * this.guild.classChangeCost;
  }

  changeClass(char: Character, cls: ClassDef): void {
    if (!this.canChange(char, cls)) return;
    const cost = this.changeCost(char);
    const updated: Character = {
      ...char,
      class: cls.name,
      gold: char.gold - cost,
      level: 1,
      experience: 0,
      experienceToNext: 1000,
    };
    this.gameState.updateGuild(g => ({
      ...g,
      characters: g.characters.map(c => c.id === updated.id ? updated : c),
    }));
    this.selectedChar = updated;
    this.message = `${char.name} has joined the ${cls.name} class! (Cost: ${cost} gp)`;
  }

  classFor(char: Character): ClassDef | undefined {
    return CLASSES.find(c => c.name === char.class);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (e.key === 'Escape') this.back();
  }

  back(): void { this.router.navigate(['/town']); }
}
