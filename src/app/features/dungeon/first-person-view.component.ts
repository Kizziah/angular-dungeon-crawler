import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DungeonFloor, Position } from '../../core/models/dungeon.model';

type CellKind = 'wall' | 'door' | 'open' | 'outside';

interface Slice { l: number; r: number; t: number; b: number; }

export interface SceneEl {
  kind: 'ceiling' | 'floor' | 'wall-front' | 'wall-left' | 'wall-right' | 'door';
  points?: string;
  x?: number; y?: number; w?: number; h?: number;
  fill?: string;
}

@Component({
  selector: 'app-first-person-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './first-person-view.component.html',
  styleUrls: ['./first-person-view.component.scss']
})
export class FirstPersonViewComponent implements OnChanges {
  @Input() floor!: DungeonFloor;
  @Input() position!: Position;
  @Input() direction: string = 'N';

  // Perspective slices for a 512×384 canvas with vanishing point at (256,192).
  // Each slice defines the inner rectangle of the corridor opening at that depth.
  // All corner lines converge correctly to (256,192).
  readonly SLICES: Slice[] = [
    { l: 0,   r: 512, t: 0,   b: 384 }, // depth 0 — player
    { l: 64,  r: 448, t: 48,  b: 336 }, // depth 1
    { l: 128, r: 384, t: 96,  b: 288 }, // depth 2
    { l: 176, r: 336, t: 128, b: 256 }, // depth 3
    { l: 208, r: 304, t: 152, b: 232 }, // depth 4
  ];

  scene: SceneEl[] = [];

  ngOnChanges(): void {
    if (this.floor && this.position) {
      this.scene = this.buildScene();
    }
  }

  private dir() {
    switch (this.direction) {
      case 'N': return { fwd:{x:0,y:-1}, lft:{x:-1,y:0}, rgt:{x:1,y:0} };
      case 'S': return { fwd:{x:0,y:1},  lft:{x:1,y:0},  rgt:{x:-1,y:0} };
      case 'E': return { fwd:{x:1,y:0},  lft:{x:0,y:-1}, rgt:{x:0,y:1} };
      case 'W': return { fwd:{x:-1,y:0}, lft:{x:0,y:1},  rgt:{x:0,y:-1} };
      default:  return { fwd:{x:0,y:-1}, lft:{x:-1,y:0}, rgt:{x:1,y:0} };
    }
  }

  private cellKind(x: number, y: number): CellKind {
    if (!this.floor) return 'outside';
    if (x < 0 || y < 0 || x >= this.floor.width || y >= this.floor.height) return 'outside';
    const c = this.floor.cells[y]?.[x];
    if (!c || c.type === 'wall') return 'wall';
    if (c.type === 'door') return 'door';
    return 'open';
  }

  private blocking(k: CellKind) { return k === 'wall' || k === 'outside'; }

  private pts(p: [number, number][]): string {
    return p.map(([x, y]) => `${x},${y}`).join(' ');
  }

  private wallFill(depth: number, face: 'front' | 'side'): string {
    // Farther = darker (distance fog). Near walls are brightest.
    const opacity = face === 'front'
      ? (depth - 1) * 0.10
      : 0.10 + (depth - 1) * 0.10;
    return `rgba(0,0,0,${Math.min(0.6, opacity).toFixed(2)})`;
  }

  private buildScene(): SceneEl[] {
    const els: SceneEl[] = [];
    const { fwd, lft, rgt } = this.dir();
    const px = this.position.x, py = this.position.y;

    const info = Array.from({ length: 4 }, (_, i) => {
      const d = i + 1;
      return {
        front: this.cellKind(px + fwd.x * d,           py + fwd.y * d),
        left:  this.cellKind(px + fwd.x * (d-1) + lft.x, py + fwd.y * (d-1) + lft.y),
        right: this.cellKind(px + fwd.x * (d-1) + rgt.x, py + fwd.y * (d-1) + rgt.y),
      };
    });

    // How far until we hit a blocking cell or door?
    let maxD = 4;
    for (let d = 1; d <= 4; d++) {
      if (this.blocking(info[d-1].front) || info[d-1].front === 'door') {
        maxD = d; break;
      }
    }

    // Corridor ceiling + floor trapezoids, back to front
    for (let d = maxD; d >= 1; d--) {
      const n = this.SLICES[d-1], f = this.SLICES[d];
      els.push({
        kind: 'ceiling',
        points: this.pts([[f.l,f.t],[f.r,f.t],[n.r,n.t],[n.l,n.t]]),
        // d=1 is nearest (lightest), d=maxD is farthest (darkest)
        fill: `rgba(0,0,0,${((d - 1) * 0.08).toFixed(2)})`,
      });
      els.push({
        kind: 'floor',
        points: this.pts([[f.l,f.b],[f.r,f.b],[n.r,n.b],[n.l,n.b]]),
        fill: `rgba(0,0,0,${((d - 1) * 0.07).toFixed(2)})`,
      });
    }

    // Front face at maxD
    const fs = this.SLICES[maxD];
    const fKind = info[maxD - 1].front;
    if (fKind === 'door') {
      els.push({ kind: 'door', x: fs.l, y: fs.t, w: fs.r - fs.l, h: fs.b - fs.t });
    } else if (this.blocking(fKind)) {
      els.push({ kind: 'wall-front', x: fs.l, y: fs.t, w: fs.r - fs.l, h: fs.b - fs.t, fill: this.wallFill(maxD, 'front') });
    }

    // Side walls back to front
    for (let d = maxD; d >= 1; d--) {
      const n = this.SLICES[d-1], f = this.SLICES[d];
      if (this.blocking(info[d-1].left)) {
        els.push({
          kind: 'wall-left',
          points: this.pts([[f.l,f.t],[n.l,n.t],[n.l,n.b],[f.l,f.b]]),
          fill: this.wallFill(d, 'side'),
        });
      }
      if (this.blocking(info[d-1].right)) {
        els.push({
          kind: 'wall-right',
          points: this.pts([[f.r,f.t],[n.r,n.t],[n.r,n.b],[f.r,f.b]]),
          fill: this.wallFill(d, 'side'),
        });
      }
    }

    return els;
  }

  isDoor(el: SceneEl)  { return el.kind === 'door'; }
  isFrontWall(el: SceneEl) { return el.kind === 'wall-front'; }
  isCeilingOrFloor(el: SceneEl) { return el.kind === 'ceiling' || el.kind === 'floor'; }
  isSideWall(el: SceneEl) { return el.kind === 'wall-left' || el.kind === 'wall-right'; }
}
