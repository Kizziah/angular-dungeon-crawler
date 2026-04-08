import { Component, Input, ViewChild, ElementRef, AfterViewChecked, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-combat-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combat-log.component.html',
  styleUrls: ['./combat-log.component.scss']
})
export class CombatLogComponent implements AfterViewChecked, OnChanges {
  @Input() messages: string[] = [];
  @ViewChild('logEl') logEl!: ElementRef;
  private needsScroll = false;

  ngAfterViewChecked(): void {
    if (this.needsScroll && this.logEl) {
      this.logEl.nativeElement.scrollTop = this.logEl.nativeElement.scrollHeight;
      this.needsScroll = false;
    }
  }

  ngOnChanges(): void {
    this.needsScroll = true;
  }
}
