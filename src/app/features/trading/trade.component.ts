import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MmoService } from '../../core/services/mmo.service';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-trade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trade.component.html',
  styleUrl: './trade.component.scss',
})
export class TradeComponent implements OnInit {
  pendingTrades = signal<any[]>([]);
  newOffer = {
    receiverUsername: '',
    message: '',
    senderGold: 0,
    receiverGold: 0,
  };
  successMsg = signal('');
  errorMsg = signal('');

  constructor(
    private mmo: MmoService,
    private gameState: GameStateService,
  ) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.mmo.getPendingTrades().subscribe({ next: t => this.pendingTrades.set(t), error: () => {} });
  }

  sendOffer(): void {
    this.errorMsg.set('');
    if (!this.newOffer.receiverUsername) {
      this.errorMsg.set('Enter a player username to trade with.');
      return;
    }
    // TODO: resolve username → id via a /api/auth/lookup/ endpoint or pass username directly
    this.errorMsg.set('Feature coming soon: enter player ID directly for now.');
  }

  accept(tradeId: number): void {
    this.mmo.respondToTrade(tradeId, 'accept').subscribe({
      next: () => { this.successMsg.set('Trade accepted!'); this.loadPending(); },
      error: () => this.errorMsg.set('Failed to accept trade.'),
    });
  }

  decline(tradeId: number): void {
    this.mmo.respondToTrade(tradeId, 'decline').subscribe({
      next: () => this.loadPending(),
      error: () => {},
    });
  }
}
