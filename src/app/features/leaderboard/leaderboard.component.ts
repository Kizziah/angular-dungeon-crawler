import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MmoService } from '../../core/services/mmo.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  activeTab = signal<'characters' | 'guilds'>('characters');
  characters = signal<any[]>([]);
  guilds = signal<any[]>([]);
  loading = signal(true);

  constructor(private mmo: MmoService) {}

  ngOnInit(): void {
    this.loadBoth();
  }

  loadBoth(): void {
    this.loading.set(true);
    this.mmo.getTopCharacters().subscribe({ next: data => this.characters.set(data), error: () => {} });
    this.mmo.getTopGuilds().subscribe({
      next: data => { this.guilds.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: 'characters' | 'guilds'): void {
    this.activeTab.set(tab);
  }
}
