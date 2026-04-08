import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dos-window',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dos-window.component.html',
  styleUrls: ['./dos-window.component.scss']
})
export class DosWindowComponent {
  @Input() title: string = '';
  @Input() width: string = '100%';
  @Input() height: string = 'auto';

  getLine(len: number): string {
    return '═'.repeat(Math.max(0, len));
  }
}
