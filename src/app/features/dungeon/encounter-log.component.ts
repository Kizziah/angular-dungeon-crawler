import { Component, Input, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-encounter-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './encounter-log.component.html',
  styleUrls: ['./encounter-log.component.scss']
})
export class EncounterLogComponent implements AfterViewChecked {
  @Input() messages: string[] = [];
  @ViewChild('logContainer') logContainer!: ElementRef;

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.logContainer) {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnChanges(): void {
    this.shouldScroll = true;
  }
}
