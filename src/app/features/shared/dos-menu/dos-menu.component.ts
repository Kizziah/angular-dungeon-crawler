import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MenuItem {
  key: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-dos-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dos-menu.component.html',
  styleUrls: ['./dos-menu.component.scss']
})
export class DosMenuComponent implements OnInit, OnDestroy {
  @Input() items: MenuItem[] = [];
  @Input() title: string = '';
  @Output() selected = new EventEmitter<MenuItem>();

  selectedIndex = 0;

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.moveUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.moveDown();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.selectCurrent();
    } else {
      // Check shortcut keys
      const item = this.items.find(i => i.key.toLowerCase() === e.key.toLowerCase());
      if (item && !item.disabled) {
        this.selected.emit(item);
      }
    }
  }

  moveUp(): void {
    do {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    } while (this.items[this.selectedIndex]?.disabled && this.items.some(i => !i.disabled));
  }

  moveDown(): void {
    do {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    } while (this.items[this.selectedIndex]?.disabled && this.items.some(i => !i.disabled));
  }

  selectCurrent(): void {
    const item = this.items[this.selectedIndex];
    if (item && !item.disabled) {
      this.selected.emit(item);
    }
  }

  selectItem(item: MenuItem): void {
    if (!item.disabled) {
      this.selected.emit(item);
    }
  }
}
