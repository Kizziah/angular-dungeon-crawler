import { Injectable, OnDestroy, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface OnlinePlayer {
  username: string;
  x: number;
  y: number;
  guild_name: string;
  is_online: boolean;
}

export interface ChatMessage {
  id: number;
  username: string;
  content: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private worldSocket: WebSocket | null = null;
  private chatSocket: WebSocket | null = null;

  onlinePlayers = signal<OnlinePlayer[]>([]);
  chatMessages = signal<ChatMessage[]>([]);
  currentChatRoom = signal<string>('global');

  constructor(private auth: AuthService) {}

  // ── World WebSocket ───────────────────────────────────────────────────────

  connectToWorld(world: string): void {
    if (this.worldSocket) this.disconnectWorld();

    const token = this.auth.getAccessToken();
    if (!token) return;

    const url = `${environment.wsUrl}/ws/world/${world}/?token=${token}`;
    this.worldSocket = new WebSocket(url);

    this.worldSocket.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.type === 'player_position') {
        this.onlinePlayers.update(players => {
          const filtered = players.filter(p => p.username !== data.username);
          return data.is_online ? [...filtered, data] : filtered;
        });
      }
    };

    this.worldSocket.onclose = () => this.onlinePlayers.set([]);
  }

  sendWorldPosition(x: number, y: number, guildName: string): void {
    if (this.worldSocket?.readyState === WebSocket.OPEN) {
      this.worldSocket.send(JSON.stringify({ type: 'move', x, y, guild_name: guildName }));
    }
  }

  disconnectWorld(): void {
    this.worldSocket?.close();
    this.worldSocket = null;
    this.onlinePlayers.set([]);
  }

  // ── Chat WebSocket ────────────────────────────────────────────────────────

  connectToChat(room: string): void {
    if (this.chatSocket) this.disconnectChat();

    const token = this.auth.getAccessToken();
    if (!token) return;

    this.currentChatRoom.set(room);
    this.chatMessages.set([]);

    const url = `${environment.wsUrl}/ws/chat/${room}/?token=${token}`;
    this.chatSocket = new WebSocket(url);

    this.chatSocket.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        this.chatMessages.set(data.messages);
      } else if (data.type === 'message') {
        this.chatMessages.update(msgs => [...msgs, data]);
      }
    };
  }

  sendChatMessage(content: string): void {
    if (this.chatSocket?.readyState === WebSocket.OPEN) {
      this.chatSocket.send(JSON.stringify({ type: 'message', content }));
    }
  }

  disconnectChat(): void {
    this.chatSocket?.close();
    this.chatSocket = null;
  }

  ngOnDestroy(): void {
    this.disconnectWorld();
    this.disconnectChat();
  }
}
