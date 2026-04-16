import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-chat-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-overlay.component.html',
  styleUrl: './chat-overlay.component.scss',
})
export class ChatOverlayComponent implements OnInit, OnDestroy {
  @ViewChild('messageList') messageList!: ElementRef;

  draft = '';
  isOpen = signal(true);
  currentRoom = signal('global');

  readonly rooms = [
    { id: 'global', label: 'Global' },
    { id: 'dungeon', label: 'Dungeon' },
  ];

  constructor(public ws: WebSocketService) {}

  ngOnInit(): void {
    this.ws.connectToChat('global');
  }

  ngOnDestroy(): void {
    this.ws.disconnectChat();
  }

  switchRoom(room: string): void {
    this.ws.connectToChat(room);
    this.currentRoom.set(room);
  }

  send(): void {
    const msg = this.draft.trim();
    if (!msg) return;
    this.ws.sendChatMessage(msg);
    this.draft = '';
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }
}
