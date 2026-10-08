import {
  Component, Input, OnChanges, AfterViewInit, OnDestroy, SimpleChanges,
  ViewChild, ElementRef, NgZone, HostListener
} from '@angular/core';
import * as THREE from 'three';
import { OverworldCell, OverworldTileType } from '../../core/models/overworld.model';
import { Character } from '../../core/models/character.model';
import { buildCharacterGeometry, equipSig } from '../dungeon/character-mesh';
import { buildWalkClip, buildIdleClip, buildRunClip } from '../dungeon/animation-clips';

const RENDER_W = 960;
const RENDER_H = 600;
const VP_W     = 21;
const VP_H     = 15;

// Third-person camera constants (mirrors dungeon first-person-view values)
const CAM_BEHIND = 1.35;
const CAM_HEIGHT = 0.72;
const CAM_LERP   = 0.14;
const POS_LERP   = 0.18;

function tileH(t: OverworldTileType): number {
  const H: Partial<Record<OverworldTileType, number>> = {
    ocean: 0.08, river: 0.08, coast: 0.18, plains: 0.18, forest: 0.18,
    mountain: 0.88, snow: 0.46, swamp: 0.12, road: 0.20,
    town: 0.18, city: 0.18, castle: 0.18, dungeon: 0.18,
    ship: 0.10, bridge: 0.22, wall: 0.74,
    portal: 0.18, portal2: 0.18, portal3: 0.18,
  };
  return H[t] ?? 0.18;
}

@Component({
  selector: 'app-overworld-3d-view',
  standalone: true,
  imports: [],
  template: `<canvas #canvas></canvas>`,
  styles: [`:host { display: block; line-height: 0; } canvas { display: block; max-width: 100%; }`]
})
export class OverworldViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() cells: (OverworldCell | null)[][] = [];
  @Input() inShip = false;
  @Input() direction: string = 'N';
  @Input() character: Character | null = null;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private tileGroup!: THREE.Group;
  private playerGroup!: THREE.Group;

  private waterMeshes: { mesh: THREE.Mesh; baseY: number; ox: number; oz: number }[] = [];
  private portalRings: THREE.Mesh[] = [];
  private dungeonRings: THREE.Mesh[] = [];
  private geomPool: THREE.BufferGeometry[] = [];

  // All materials created once and reused across rebuilds
  private M!: Record<string, THREE.MeshStandardMaterial>;

  private playerBaseY = 0.18;
  private readonly clock = new THREE.Clock();
  private animId = 0;
  private ready = false;

  // Animation mixer (walk / idle / run — same blending as dungeon view)
  private mixer!: THREE.AnimationMixer;
  private idleAction: THREE.AnimationAction | null = null;
  private walkAction: THREE.AnimationAction | null = null;
  private runAction:  THREE.AnimationAction | null = null;
  private isMoving = false;
  private moveTimer = 0;
  private stepStopTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastEquipSig = '';

  // Smooth direction lerp (same angle-lerp pattern as dungeon first-person-view)
  private vAngle = 0;
  private tAngle = 0;

  // Camera orbit state
  private camYawOffset   = 0;
  private camPitchOffset = 0;
  private orbitActive    = false;
  private orbitLastX     = 0;
  private orbitLastY     = 0;

  // FOV zoom state (75° default, range 20°–100°)
  private readonly FOV_DEFAULT = 75;
  private readonly FOV_MIN     = 20;
  private readonly FOV_MAX     = 100;
  private camFov = 75;

  // Reusable camera target vector
  private readonly camTarget = new THREE.Vector3();

  // Bound event handlers (stored for removal in ngOnDestroy)
  private readonly _onPointerDown = (e: PointerEvent) => this.onOrbitPointerDown(e);
  private readonly _onPointerMove = (e: PointerEvent) => this.onOrbitPointerMove(e);
  private readonly _onPointerUp   = (e: PointerEvent) => this.onOrbitPointerUp(e);
  private readonly _onDblClick    = () => this.resetOrbit();
  private readonly _onWheel       = (e: WheelEvent)   => this.onZoomWheel(e);

  constructor(private ngZone: NgZone) {}

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === '+' || e.key === '=') this.applyZoom(-5);
    if (e.key === '-' || e.key === '_') this.applyZoom(+5);
  }

  // ── Mouse-orbit handlers ──────────────────────────────────────────────────

  private onOrbitPointerDown(e: PointerEvent): void {
    this.orbitActive = true;
    this.orbitLastX  = e.clientX;
    this.orbitLastY  = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    (e.target as HTMLElement).style.cursor = 'grabbing';
  }

  private onOrbitPointerMove(e: PointerEvent): void {
    if (!this.orbitActive) return;
    const dx = e.clientX - this.orbitLastX;
    const dy = e.clientY - this.orbitLastY;
    this.orbitLastX = e.clientX;
    this.orbitLastY = e.clientY;
    this.camYawOffset   += dx * 0.005;
    this.camPitchOffset  = Math.max(-0.6, Math.min(0.8, this.camPitchOffset - dy * 0.004));
  }

  private onOrbitPointerUp(e: PointerEvent): void {
    this.orbitActive = false;
    (e.target as HTMLElement).style.cursor = 'grab';
  }

  private resetOrbit(): void {
    this.camYawOffset   = 0;
    this.camPitchOffset = 0;
    this.applyZoom(0, true);
  }

  private onZoomWheel(e: WheelEvent): void {
    e.preventDefault();
    this.applyZoom(e.deltaY * 0.05);
  }

  private applyZoom(delta: number, reset = false): void {
    this.camFov = reset
      ? this.FOV_DEFAULT
      : Math.max(this.FOV_MIN, Math.min(this.FOV_MAX, this.camFov + delta));
    this.camera.fov = this.camFov;
    this.camera.updateProjectionMatrix();
  }

  // ── Direction helpers ─────────────────────────────────────────────────────

  // Three.js rotation.y: forward = (-sin θ, 0, -cos θ)
  private dirToAngle(dir: string): number {
    switch (dir) {
      case 'N': return 0;
      case 'S': return Math.PI;
      case 'E': return -Math.PI / 2;
      case 'W': return  Math.PI / 2;
      default:  return 0;
    }
  }

  /** Snap camera instantly to current vAngle (called once on init). */
  private snapCamera(): void {
    const sinA = Math.sin(this.vAngle), cosA = Math.cos(this.vAngle);
    this.camera.position.set(sinA * CAM_BEHIND, CAM_HEIGHT, cosA * CAM_BEHIND);
    this.camera.lookAt(0, this.playerBaseY * 0.5, 0);
  }

  // ── Step / animation helpers ──────────────────────────────────────────────

  /** Called whenever the player takes a step (cells input changed). */
  private onStep(): void {
    if (!this.walkAction || !this.idleAction) return;

    if (!this.isMoving) {
      this.isMoving = true;
      this.setWeight(this.walkAction, 1);
      this.idleAction.crossFadeTo(this.walkAction, 0.15, true);
    }
    this.moveTimer = 0;

    // Debounce: stop walking 600ms after the last step
    if (this.stepStopTimeout) clearTimeout(this.stepStopTimeout);
    this.stepStopTimeout = setTimeout(() => {
      this.isMoving = false;
      this.moveTimer = 0;
      if (this.walkAction && this.idleAction) {
        this.setWeight(this.idleAction, 1);
        this.walkAction.crossFadeTo(this.idleAction, 0.30, true);
      }
    }, 450);
  }

  /** Sets effective weight without disrupting time scale. */
  private setWeight(action: THREE.AnimationAction, weight: number): void {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }

  // ── Character mesh helpers ────────────────────────────────────────────────

  private buildCharacterMesh(): THREE.Group {
    const g = new THREE.Group();
    Object.assign(this, buildCharacterGeometry(g, this.character?.equipment ?? null));
    this.setupAnimationMixer(g);
    return g;
  }

  private refreshCharacterMesh(): void {
    if (!this.playerGroup) return;
    this.playerGroup.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material as THREE.Material | THREE.Material[];
        (Array.isArray(mat) ? mat : [mat]).forEach(m => m?.dispose());
      }
    });
    while (this.playerGroup.children.length) {
      this.playerGroup.remove(this.playerGroup.children[0]);
    }
    Object.assign(this, buildCharacterGeometry(this.playerGroup, this.character?.equipment ?? null));
    this.setupAnimationMixer(this.playerGroup);
  }

  private setupAnimationMixer(root: THREE.Group): void {
    if (this.mixer) this.mixer.stopAllAction();
    this.mixer      = new THREE.AnimationMixer(root);
    this.idleAction = this.mixer.clipAction(buildIdleClip());
    this.walkAction = this.mixer.clipAction(buildWalkClip());
    this.runAction  = this.mixer.clipAction(buildRunClip());

    this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
    this.walkAction.setLoop(THREE.LoopRepeat, Infinity);
    this.runAction.setLoop(THREE.LoopRepeat, Infinity);

    this.setWeight(this.idleAction, 1);
    this.setWeight(this.walkAction, 0);
    this.setWeight(this.runAction,  0);
    this.idleAction.play();
    this.walkAction.play();
    this.runAction.play();
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.ready = true;
    this.tAngle = this.vAngle = this.dirToAngle(this.direction);
    if (this.cells.length) this.rebuildTiles();
    this.snapCamera();

    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.addEventListener('pointermove', this._onPointerMove);
    canvas.addEventListener('pointerup',   this._onPointerUp);
    canvas.addEventListener('pointerleave', this._onPointerUp);
    canvas.addEventListener('dblclick',    this._onDblClick);
    canvas.addEventListener('wheel',       this._onWheel, { passive: false });
    canvas.style.cursor = 'grab';

    this.ngZone.runOutsideAngular(() => this.renderLoop());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) return;

    // Equipment change → rebuild character mesh
    if (changes['character']) {
      const sig = equipSig(this.character?.equipment ?? null);
      if (sig !== this.lastEquipSig) {
        this.lastEquipSig = sig;
        this.refreshCharacterMesh();
      }
    }

    // Direction change
    if (changes['direction']) {
      this.tAngle = this.dirToAngle(this.direction);
    }

    // Cells change = player took a step → trigger walk animation
    if (changes['cells']) {
      this.rebuildTiles();
      this.onStep();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    if (this.stepStopTimeout) clearTimeout(this.stepStopTimeout);
    this.mixer?.stopAllAction();
    this.clearGeomPool();
    Object.values(this.M ?? {}).forEach(m => m.dispose());
    this.renderer?.dispose();

    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this._onPointerDown);
      canvas.removeEventListener('pointermove', this._onPointerMove);
      canvas.removeEventListener('pointerup',   this._onPointerUp);
      canvas.removeEventListener('pointerleave', this._onPointerUp);
      canvas.removeEventListener('dblclick',    this._onDblClick);
      canvas.removeEventListener('wheel',       this._onWheel);
    }
  }

  private clearGeomPool(): void {
    for (const g of this.geomPool) g.dispose();
    this.geomPool = [];
  }

  /** Register a geometry for disposal on next rebuild. */
  private g<T extends THREE.BufferGeometry>(geo: T): T {
    this.geomPool.push(geo);
    return geo;
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(RENDER_W, RENDER_H, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060810);
    this.scene.fog = new THREE.FogExp2(0x060810, 0.055);

    // Third-person camera — positioned behind the player at near-eye level
    this.camera = new THREE.PerspectiveCamera(this.FOV_DEFAULT, RENDER_W / RENDER_H, 0.05, 50);
    this.camera.position.set(0, CAM_HEIGHT, CAM_BEHIND);
    this.camera.lookAt(0, 0, 0);

    // Sky + ambient warmth
    this.scene.add(new THREE.HemisphereLight(0x88aadd, 0x443322, 1.4));

    // Directional sunlight
    const sun = new THREE.DirectionalLight(0xffe0aa, 2.2);
    sun.position.set(6, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.near = 1; sc.far = 45;
    sc.left = -14; sc.right = 14; sc.top = 10; sc.bottom = -10;
    sc.updateProjectionMatrix();
    this.scene.add(sun);

    // Build all materials once
    const m = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
    this.M = {
      // ── Base terrain ──────────────────────────────────────────────────────
      ocean:      m({ color: 0x1155cc, roughness: 0.12, metalness: 0.3 }),
      coast:      m({ color: 0xc8a060, roughness: 0.9 }),
      plains:     m({ color: 0x3a9a3a, roughness: 0.9 }),
      forest:     m({ color: 0x1a6a1a, roughness: 1.0 }),
      mountain:   m({ color: 0x888888, roughness: 0.8 }),
      snow:       m({ color: 0xddeeff, roughness: 0.7 }),
      swamp:      m({ color: 0x3a5a3a, roughness: 1.0 }),
      road:       m({ color: 0x9a7a44, roughness: 0.9 }),
      town:       m({ color: 0x997711, roughness: 0.7 }),
      city:       m({ color: 0xaa6600, roughness: 0.6 }),
      castle:     m({ color: 0x7788aa, roughness: 0.5, metalness: 0.3 }),
      dungeon:    m({ color: 0x550000, roughness: 1.0 }),
      ship:       m({ color: 0x00aacc, roughness: 0.2, metalness: 0.5 }),
      river:      m({ color: 0x2266dd, roughness: 0.12, metalness: 0.3 }),
      bridge:     m({ color: 0x997755, roughness: 0.8 }),
      wall:       m({ color: 0x666666, roughness: 0.7 }),
      portal:     m({ color: 0x440033, emissive: 0xff44ff, emissiveIntensity: 0.6 }),
      portal2:    m({ color: 0x003344, emissive: 0x44ffff, emissiveIntensity: 0.6 }),
      portal3:    m({ color: 0x332200, emissive: 0xffcc44, emissiveIntensity: 0.6 }),
      // ── Unvisited ─────────────────────────────────────────────────────────
      dark:       m({ color: 0x050505, roughness: 1.0 }),
      // ── Decorations ───────────────────────────────────────────────────────
      tree:       m({ color: 0x226622, roughness: 0.9 }),
      trunk:      m({ color: 0x5a3a10, roughness: 1.0 }),
      townWall:   m({ color: 0xddbb88, roughness: 0.8 }),
      townRoof:   m({ color: 0xcc5522, roughness: 0.9 }),
      cityWall:   m({ color: 0xddbbaa, roughness: 0.7 }),
      castleStone:m({ color: 0xaabbcc, roughness: 0.6, metalness: 0.1 }),
      dungRing:   m({ color: 0xaa0000, emissive: 0xff1100, emissiveIntensity: 0.6 }),
      snowPeak:   m({ color: 0xffffff, roughness: 0.7 }),
      bridgeRail: m({ color: 0x887755, roughness: 0.8 }),
      shipHull:   m({ color: 0x884400, roughness: 0.7 }),
      shipMast:   m({ color: 0x663300, roughness: 0.9 }),
      portRing1:  m({ color: 0xff44ff, emissive: 0xff44ff, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 }),
      portRing2:  m({ color: 0x44ffff, emissive: 0x44ffff, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 }),
      portRing3:  m({ color: 0xffcc44, emissive: 0xffcc44, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 }),
      // ── Player ────────────────────────────────────────────────────────────
      player:     m({ color: 0xffee44, emissive: 0xffcc00, emissiveIntensity: 0.5, roughness: 0.5 }),
    };

    this.tileGroup = new THREE.Group();
    this.scene.add(this.tileGroup);

    this.lastEquipSig = equipSig(this.character?.equipment ?? null);
    this.playerGroup = this.buildCharacterMesh();
    this.playerGroup.scale.setScalar(0.45);
    this.scene.add(this.playerGroup);
  }

  private mk(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, shadow = true): THREE.Mesh {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (shadow) { mesh.castShadow = true; mesh.receiveShadow = true; }
    return mesh;
  }

  private rebuildTiles(): void {
    this.tileGroup.clear();
    this.clearGeomPool();
    this.waterMeshes = [];
    this.portalRings = [];
    this.dungeonRings = [];

    const cx = Math.floor(VP_W / 2);
    const cy = Math.floor(VP_H / 2);

    for (let vy = 0; vy < VP_H; vy++) {
      for (let vx = 0; vx < VP_W; vx++) {
        const cell = this.cells[vy]?.[vx];
        const wx = vx - cx;
        const wz = vy - cy;

        if (!cell || !cell.visited) {
          this.tileGroup.add(this.mk(this.g(new THREE.BoxGeometry(0.999, 0.06, 0.999)), this.M['dark'], wx, 0.03, wz, false));
          continue;
        }

        const h  = tileH(cell.type);
        const mat = this.M[cell.type] ?? this.M['plains'];
        const tile = this.mk(this.g(new THREE.BoxGeometry(0.999, h, 0.999)), mat, wx, h / 2, wz);
        this.tileGroup.add(tile);

        if (cell.type === 'ocean' || cell.type === 'river')
          this.waterMeshes.push({ mesh: tile, baseY: h / 2, ox: wx, oz: wz });

        this.decorate(cell.type, wx, h, wz);
      }
    }

    // Player height over center tile
    const center = this.cells[cy]?.[cx];
    this.playerBaseY = (center?.visited ? tileH(center.type) : 0.18);
    this.playerGroup.position.y = this.playerBaseY;
  }

  private decorate(type: OverworldTileType, wx: number, topY: number, wz: number): void {
    switch (type) {

      case 'forest':
        for (const [ox, oz] of [[-0.22, -0.18], [0.22, 0.20]]) {
          this.tileGroup.add(
            this.mk(this.g(new THREE.CylinderGeometry(0.055, 0.07, 0.32, 6)), this.M['trunk'], wx + ox, topY + 0.16, wz + oz),
            this.mk(this.g(new THREE.ConeGeometry(0.20, 0.44, 7)),             this.M['tree'],  wx + ox, topY + 0.55, wz + oz),
          );
        }
        break;

      case 'mountain':
        this.tileGroup.add(this.mk(this.g(new THREE.ConeGeometry(0.38, 0.55, 6)), this.M['mountain'], wx, topY + 0.275, wz));
        break;

      case 'snow':
        this.tileGroup.add(this.mk(this.g(new THREE.ConeGeometry(0.36, 0.40, 6)), this.M['snowPeak'], wx, topY + 0.20, wz));
        break;

      case 'town': {
        const walls = this.mk(this.g(new THREE.BoxGeometry(0.44, 0.34, 0.44)), this.M['townWall'], wx, topY + 0.17, wz);
        const roof  = this.mk(this.g(new THREE.ConeGeometry(0.34, 0.24, 4)),   this.M['townRoof'], wx, topY + 0.46, wz);
        roof.rotation.y = Math.PI / 4;
        this.tileGroup.add(walls, roof);
        break;
      }

      case 'city':
        for (const [ox, oz, h] of [[-0.17, -0.17, 0.50], [0.17, 0.17, 0.42], [0, 0, 0.72]]) {
          this.tileGroup.add(this.mk(
            this.g(new THREE.BoxGeometry(0.17, h as number, 0.17)), this.M['cityWall'],
            wx + (ox as number), topY + (h as number) / 2, wz + (oz as number)
          ));
        }
        break;

      case 'castle': {
        this.tileGroup.add(this.mk(this.g(new THREE.BoxGeometry(0.50, 0.62, 0.50)), this.M['castleStone'], wx, topY + 0.31, wz));
        for (const [ox, oz] of [[-0.23, 0], [0.23, 0], [0, -0.23], [0, 0.23]])
          this.tileGroup.add(this.mk(this.g(new THREE.BoxGeometry(0.13, 0.20, 0.13)), this.M['castleStone'], wx + ox, topY + 0.72, wz + oz));
        break;
      }

      case 'dungeon': {
        const ring = this.mk(this.g(new THREE.TorusGeometry(0.30, 0.055, 6, 12)), this.M['dungRing'], wx, topY + 0.06, wz, false);
        ring.rotation.x = Math.PI / 2;
        this.tileGroup.add(ring);
        this.dungeonRings.push(ring);
        break;
      }

      case 'portal':
      case 'portal2':
      case 'portal3': {
        const rMat = type === 'portal' ? this.M['portRing1'] : type === 'portal2' ? this.M['portRing2'] : this.M['portRing3'];
        const ring = this.mk(this.g(new THREE.TorusGeometry(0.34, 0.065, 8, 20)), rMat, wx, topY + 0.44, wz, false);
        this.tileGroup.add(ring);
        this.portalRings.push(ring);
        break;
      }

      case 'wall':
        for (const [ox, oz] of [[-0.30, 0], [0.30, 0], [0, -0.30], [0, 0.30], [0, 0]])
          this.tileGroup.add(this.mk(this.g(new THREE.BoxGeometry(0.20, 0.18, 0.20)), this.M['wall'], wx + (ox as number), topY + 0.09, wz + (oz as number)));
        break;

      case 'bridge':
        for (const ox of [-0.42, 0.42])
          this.tileGroup.add(this.mk(this.g(new THREE.BoxGeometry(0.06, 0.18, 0.96)), this.M['bridgeRail'], wx + ox, topY + 0.09, wz));
        break;

      case 'ship': {
        const hull = this.mk(this.g(new THREE.BoxGeometry(0.50, 0.22, 0.30)), this.M['shipHull'], wx, topY + 0.11, wz);
        const mast = this.mk(this.g(new THREE.CylinderGeometry(0.03, 0.03, 0.60, 6)), this.M['shipMast'], wx, topY + 0.50, wz);
        this.tileGroup.add(hull, mast);
        break;
      }
    }
  }

  private renderLoop(): void {
    this.animId = requestAnimationFrame(() => this.renderLoop());
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const t     = this.clock.elapsedTime;

    // ── Animation mixer ──────────────────────────────────────────────────────
    if (this.mixer) {
      if (this.isMoving) this.moveTimer += delta;
      this.mixer.update(delta);
    }

    // ── Direction lerp with π wrap-around ───────────────────────────────────
    const lp = 1 - Math.pow(1 - POS_LERP, delta * 60);
    let dA = this.tAngle - this.vAngle;
    while (dA >  Math.PI) dA -= 2 * Math.PI;
    while (dA < -Math.PI) dA += 2 * Math.PI;
    this.vAngle += dA * lp;

    // ── Animated decorations ─────────────────────────────────────────────────
    for (const w of this.waterMeshes)
      w.mesh.position.y = w.baseY + Math.sin(t * 1.6 + w.ox * 0.7 + w.oz * 0.5) * 0.012;

    for (const r of this.portalRings) {
      r.rotation.y = t * 1.8;
      (r.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9 + Math.sin(t * 3.0) * 0.4;
    }

    for (const r of this.dungeonRings)
      (r.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + Math.sin(t * 2.0) * 0.3;

    // ── Player bob & rotation ────────────────────────────────────────────────
    const walkBob = this.isMoving ? Math.abs(Math.sin(t * 8.5)) * 0.02 : 0;
    this.playerGroup.position.y = this.playerBaseY + walkBob;
    this.playerGroup.rotation.y = this.vAngle;

    // ── Third-person camera ──────────────────────────────────────────────────
    const orbitAngle = this.vAngle + this.camYawOffset;
    const sinO = Math.sin(orbitAngle);
    const cosO = Math.cos(orbitAngle);
    const hasOrbit = Math.abs(this.camYawOffset) > 0.01 || Math.abs(this.camPitchOffset) > 0.01;
    const camBob = this.isMoving ? Math.abs(Math.sin(t * 8.5)) * 0.018 : 0;

    this.camTarget.set(
      sinO * CAM_BEHIND,
      CAM_HEIGHT + camBob + this.camPitchOffset,
      cosO * CAM_BEHIND,
    );
    const camLp = 1 - Math.pow(1 - CAM_LERP, delta * 60);
    this.camera.position.lerp(this.camTarget, camLp);

    const lookAheadX = hasOrbit ? 0 : -Math.sin(this.vAngle) * 0.20;
    const lookAheadZ = hasOrbit ? 0 : -Math.cos(this.vAngle) * 0.20;
    this.camera.lookAt(lookAheadX, this.playerBaseY * 0.4, lookAheadZ);

    this.renderer.render(this.scene, this.camera);
  }
}
