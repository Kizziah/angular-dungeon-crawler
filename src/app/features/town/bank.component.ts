import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { TownService } from '../../core/services/town.service';

@Component({
  selector: 'app-bank',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank.component.html',
  styleUrls: ['./bank.component.scss']
})
export class BankComponent {
  private gameState = inject(GameStateService);
  private townService = inject(TownService);
  private router = inject(Router);

  guild = this.gameState.guild;
  depositAmount = signal(0);
  withdrawAmount = signal(0);
  message = '';

  deposit(): void {
    const amount = this.depositAmount();
    if (amount <= 0 || amount > this.guild().gold) {
      this.message = 'Invalid deposit amount.';
      return;
    }
    this.gameState.updateGuild(g => this.townService.bankDeposit(amount, g));
    this.message = `Deposited ${amount} gp.`;
    this.depositAmount.set(0);
  }

  withdraw(): void {
    const amount = this.withdrawAmount();
    if (amount <= 0 || amount > this.guild().bankGold) {
      this.message = 'Invalid withdrawal amount.';
      return;
    }
    this.gameState.updateGuild(g => this.townService.bankWithdraw(amount, g));
    this.message = `Withdrew ${amount} gp.`;
    this.withdrawAmount.set(0);
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
