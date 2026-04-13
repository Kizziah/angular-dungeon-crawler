import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { GameStateService } from './core/services/game-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private gameState = inject(GameStateService);
  private router = inject(Router);

  title = 'MORDOR';
  currentRoute = '';

  guild = this.gameState.guild;
  party = this.gameState.activeParty;

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentRoute = e.urlAfterRedirects;
    });
  }

  getRouteLabel(): string {
    if (this.currentRoute.includes('/guild')) return 'GUILD';
    if (this.currentRoute.includes('/create')) return 'CHARACTER CREATION';
    if (this.currentRoute.includes('/town/inn')) return 'INN';
    if (this.currentRoute.includes('/town/shop')) return 'SHOP';
    if (this.currentRoute.includes('/town/temple')) return 'TEMPLE';
    if (this.currentRoute.includes('/town/training')) return 'TRAINING HALL';
    if (this.currentRoute.includes('/town/bank')) return 'BANK';
    if (this.currentRoute.includes('/town')) return 'TOWN';
    if (this.currentRoute.includes('/dungeon')) return 'DUNGEON';
    if (this.currentRoute.includes('/combat')) return 'COMBAT';
    if (this.currentRoute.includes('/inventory')) return 'INVENTORY';
    return 'MORDOR';
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString();
  }
}
