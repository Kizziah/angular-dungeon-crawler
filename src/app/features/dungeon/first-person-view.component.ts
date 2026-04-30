import {
  Component, Input, OnChanges, AfterViewInit, OnDestroy, SimpleChanges,
  ViewChild, ElementRef, NgZone, HostListener
} from '@angular/core';
import * as THREE from 'three';
import { DungeonFloor, Position } from '../../core/models/dungeon.model';
import { MonsterInstance } from '../../core/models/monster.model';
import { Character, Equipment } from '../../core/models/character.model';
import { Item } from '../../core/models/item.model';
import { makeWeaponMesh, makeShieldMesh, wmesh } from './equipment-meshes';
import { buildWalkClip, buildIdleClip, buildRunClip } from './animation-clips';
import { makeStoneTexture, makeWoodTexture, makeDoorTexture, makeEnemyTexture } from './dungeon-textures';
import { buildStairsMesh } from './dungeon-geometry';
import { buildCharacterGeometry, CharacterJoints, equipSig } from './character-mesh';
import { SpellParticleSystem } from './spell-particles';

const RENDER_W    = 960;
const RENDER_H    = 720;
const RENDER_RANGE = 10;   // tiles around the player
const ENEMY_DIST  = 1.6;   // world units ahead for enemy sprites
const CAM_BEHIND_WALK = 1.35;  // camera pull-back during walk
const CAM_BEHIND_RUN  = 1.85;  // camera pulls further back during run
const CAM_HEIGHT_WALK = 0.72;  // camera height during walk
const CAM_HEIGHT_RUN  = 0.90;  // camera rises during run
const CAM_LERP    = 0.14;  // camera smooth-follow factor
const POS_LERP    = 0.20;  // character position lerp factor
type CellKind = 'wall' | 'open' | 'door';

@Component({
  selector: 'app-first-person-view',
  standalone: true,
  imports: [],
  templateUrl: './first-person-view.component.html',
  styleUrls: ['./first-person-view.component.scss']
})
export class FirstPersonViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() floor!: DungeonFloor;
  @Input() position!: Position;
  @Input() direction: string = 'N';
  @Input() enemies: MonsterInstance[] = [];
  @Input() character: Character | null = null;
  /** Increment to trigger a weapon-swing / punch animation on the character. */
  @Input() attackCount: number = 0;
  /** Increment to trigger a spell animation. */
  @Input() spellCount: number = 0;
  /** Spell name or id for the most recent cast — read when spellCount increments. */
  @Input() spellId: string = '';

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private torchLight!: THREE.PointLight;
  private dungeonGroup!: THREE.Group;
  private enemyGroup!: THREE.Group;
  private enemySprites: THREE.Sprite[] = [];  // tracked for per-frame position update

  // Character skeleton (joint groups drive animation)
  private playerGroup!: THREE.Group;
  private hipPivot!: THREE.Group;
  private legPivotL!: THREE.Group;  private legPivotR!: THREE.Group;
  private kneePivotL!: THREE.Group; private kneePivotR!: THREE.Group;
  private shoulderL!: THREE.Group;  private shoulderR!: THREE.Group;
  private elbowL!: THREE.Group;     private elbowR!: THREE.Group;

  private readonly clock = new THREE.Clock();
  private lastEquipSig = '';
  private animId = 0;
  private ready = false;
  private lastFloorLevel = -1;
  private prevMoveDist = 0;  // for detecting tile landing
  private impactTime   = -1; // timestamp of last tile arrival

  // Smooth movement: visual (lerped) vs target (grid-snapped)
  private vx = 0; private vz = 0; private vAngle = 0;
  private tx = 0; private tz = 0; private tAngle = 0;

  // Shared GPU resources
  private planeGeo!: THREE.PlaneGeometry;
  private stoneMat!: THREE.MeshStandardMaterial;
  private ceilMat!: THREE.MeshStandardMaterial;
  private floorMat!: THREE.MeshStandardMaterial;
  private doorMat!: THREE.MeshStandardMaterial;
  private stairUpMat!: THREE.MeshStandardMaterial;
  private stairDownMat!: THREE.MeshStandardMaterial;
  private readonly dummy = new THREE.Object3D();

  // Animation mixer — all three actions play simultaneously, weights blend
  // (technique from threejs.org/examples/#webgl_animation_skinning_blending)
  private mixer!: THREE.AnimationMixer;
  private idleAction: THREE.AnimationAction | null = null;
  private walkAction: THREE.AnimationAction | null = null;
  private runAction:  THREE.AnimationAction | null = null;
  private wasMoving  = false;
  private moveTimer  = 0;   // seconds spent continuously moving → triggers walk→run blend

  // Attack animation overlay (procedural, applied after mixer.update each frame)
  private attackTimer   = -1;   // < 0 = no attack in progress
  private pendingAttack = false; // set by ngOnChanges, consumed by render loop
  private lastAttackCount = 0;

  // Dog companion joint refs (populated when pet is equipped)
  private dogFrontLegL?: THREE.Group;
  private dogFrontLegR?: THREE.Group;
  private dogBackLegL?:  THREE.Group;
  private dogBackLegR?:  THREE.Group;
  private dogTailPivot?: THREE.Group;

  // Spell particle system
  private spellParticles!: SpellParticleSystem;
  private pendingSpellId = '';
  private lastSpellCount = 0;

  // Reusable camera vectors (avoid per-frame allocations)
  private readonly camTarget = new THREE.Vector3();

  // Mouse-orbit state — lets the player look around the character
  private camYawOffset   = 0;   // extra horizontal angle added to camera position
  private camPitchOffset = 0;   // extra vertical offset for camera position
  private orbitActive    = false;
  private orbitLastX     = 0;
  private orbitLastY     = 0;
  // Bound handlers stored so they can be removed in ngOnDestroy
  private readonly _onPointerDown = (e: PointerEvent) => this.onOrbitPointerDown(e);
  private readonly _onPointerMove = (e: PointerEvent) => this.onOrbitPointerMove(e);
  private readonly _onPointerUp   = (e: PointerEvent) => this.onOrbitPointerUp(e);
  private readonly _onDblClick    = () => this.resetOrbit();

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.initThree();
    this.ready = true;
    if (this.floor && this.position) {
      this.snapToPosition();
      this.rebuildDungeonGeometry();
      this.buildEnemySprites();
    }

    // Register mouse-orbit listeners on the canvas
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.addEventListener('pointermove', this._onPointerMove);
    canvas.addEventListener('pointerup',   this._onPointerUp);
    canvas.addEventListener('pointerleave', this._onPointerUp);
    canvas.addEventListener('dblclick',    this._onDblClick);
    canvas.style.cursor = 'grab';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready || !this.floor || !this.position) return;

    if (changes['character']) {
      const sig = equipSig(this.character?.equipment ?? null);
      if (sig !== this.lastEquipSig) {
        this.lastEquipSig = sig;
        this.refreshCharacterMesh();
      }
    }

    // Trigger attack animation whenever attackCount increments
    if (changes['attackCount'] && this.attackCount !== this.lastAttackCount) {
      this.lastAttackCount = this.attackCount;
      this.pendingAttack   = true;
    }

    // Queue spell particle burst whenever spellCount increments
    if (changes['spellCount'] && this.spellCount !== this.lastSpellCount) {
      this.lastSpellCount  = this.spellCount;
      this.pendingSpellId  = this.spellId;
    }

    const floorChanged = changes['floor'] && this.floor.level !== this.lastFloorLevel;
    if (floorChanged) {
      this.snapToPosition();
      this.rebuildDungeonGeometry();
      this.buildEnemySprites();
    } else {
      this.updateTargets();
      this.rebuildDungeonGeometry();
      if (changes['enemies']) this.buildEnemySprites();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    this.mixer?.stopAllAction();

    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this._onPointerDown);
      canvas.removeEventListener('pointermove', this._onPointerMove);
      canvas.removeEventListener('pointerup',   this._onPointerUp);
      canvas.removeEventListener('pointerleave', this._onPointerUp);
      canvas.removeEventListener('dblclick',    this._onDblClick);
    }

    for (let i = (this.enemyGroup?.children.length ?? 0) - 1; i >= 0; i--) {
      const s = this.enemyGroup.children[i] as THREE.Sprite;
      (s.material as THREE.SpriteMaterial).map?.dispose();
      (s.material as THREE.SpriteMaterial).dispose();
    }
    [this.stoneMat, this.ceilMat, this.floorMat, this.doorMat,
     this.stairUpMat, this.stairDownMat].forEach(m => {
      m?.map?.dispose(); m?.dispose();
    });
    this.planeGeo?.dispose();
    this.spellParticles?.dispose();
    this.renderer?.dispose();
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'z' || e.key === 'Z') {
      this.pendingAttack = true;
    }
  }

  // ─── Mouse-orbit handlers ─────────────────────────────────────────────────

  private onOrbitPointerDown(e: PointerEvent): void {
    this.orbitActive = true;
    this.orbitLastX  = e.clientX;
    this.orbitLastY  = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
  }

  private onOrbitPointerMove(e: PointerEvent): void {
    if (!this.orbitActive) return;
    const dx = e.clientX - this.orbitLastX;
    const dy = e.clientY - this.orbitLastY;
    this.orbitLastX = e.clientX;
    this.orbitLastY = e.clientY;

    const YAW_SENS   = 0.006;  // radians per pixel
    const PITCH_SENS = 0.004;  // world units per pixel (applied to camera Y)
    const MAX_YAW    = Math.PI * 0.80;  // ±144°
    const MAX_PITCH  = 0.55;

    this.camYawOffset   = Math.max(-MAX_YAW,   Math.min(MAX_YAW,   this.camYawOffset   + dx * YAW_SENS));
    this.camPitchOffset = Math.max(-MAX_PITCH,  Math.min(MAX_PITCH, this.camPitchOffset - dy * PITCH_SENS));
  }

  private onOrbitPointerUp(e: PointerEvent): void {
    if (!this.orbitActive) return;
    this.orbitActive = false;
    (e.currentTarget as HTMLElement).style.cursor = 'grab';
  }

  /** Double-click resets the orbit back to the default behind-player view. */
  resetOrbit(): void {
    this.camYawOffset   = 0;
    this.camPitchOffset = 0;
  }

  // ─── Three.js setup ───────────────────────────────────────────────────────

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(RENDER_W, RENDER_H, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // ACESFilmic tone mapping (from threejs.org/examples/#webgl_animation_keyframes)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.85;
    // Soft shadow maps for the torch
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 6, 16);

    this.camera = new THREE.PerspectiveCamera(75, RENDER_W / RENDER_H, 0.05, 22);

    // Hemisphere: cool cave-blue from above, warm ember from below
    this.scene.add(new THREE.HemisphereLight(0x4466aa, 0x331a00, 3.0));

    // Warm torch PointLight — follows the player's hand in the render loop
    this.torchLight = new THREE.PointLight(0xffbb55, 8, 12, 1.2);
    this.torchLight.castShadow = true;
    this.torchLight.shadow.mapSize.set(512, 512);
    this.torchLight.shadow.camera.near = 0.1;
    this.torchLight.shadow.camera.far = 10;
    this.scene.add(this.torchLight);

    this.dungeonGroup = new THREE.Group();
    this.scene.add(this.dungeonGroup);

    this.enemyGroup = new THREE.Group();
    this.scene.add(this.enemyGroup);

    this.playerGroup = this.buildPlayerMesh();
    this.lastEquipSig = equipSig(this.character?.equipment ?? null);
    this.playerGroup.scale.setScalar(0.45);
    this.scene.add(this.playerGroup);

    this.spellParticles = new SpellParticleSystem(this.scene);

    this.planeGeo = new THREE.PlaneGeometry(1, 1);
    this.stoneMat    = new THREE.MeshStandardMaterial({ map: makeStoneTexture(false), roughness: 0.85, metalness: 0.05 });
    this.ceilMat     = new THREE.MeshStandardMaterial({ map: makeStoneTexture(true),  roughness: 0.92, metalness: 0.05 });
    this.floorMat    = new THREE.MeshStandardMaterial({ map: makeWoodTexture(),        roughness: 0.78, metalness: 0.00 });
    this.doorMat     = new THREE.MeshStandardMaterial({ map: makeDoorTexture(),        roughness: 0.70, metalness: 0.10 });
    // Stair materials — slightly lighter stone so steps read clearly in torchlight
    this.stairUpMat   = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.70, metalness: 0.05 });
    this.stairDownMat = new THREE.MeshStandardMaterial({ color: 0x997755, roughness: 0.75, metalness: 0.00 });

    this.clock.start();
    this.startRenderLoop();
  }

  private buildPlayerMesh(): THREE.Group {
    const g = new THREE.Group();
    Object.assign(this, buildCharacterGeometry(g, this.character?.equipment ?? null));
    this.setupAnimationMixer(g);
    return g;
  }

  /** Dispose all meshes in playerGroup, then repopulate with current equipment. */
  private refreshCharacterMesh(): void {
    if (!this.playerGroup) return;
    this.playerGroup.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat?.dispose();
      }
    });
    while (this.playerGroup.children.length) {
      this.playerGroup.remove(this.playerGroup.children[0]);
    }
    Object.assign(this, buildCharacterGeometry(this.playerGroup, this.character?.equipment ?? null));
    this.setupAnimationMixer(this.playerGroup);
  }

  // ─── AnimationMixer setup (keyframe-driven walk / idle / run) ───────────────
  //
  // Mirrors the pattern from threejs.org/examples/#webgl_animation_skinning_blending:
  //   • All three actions play simultaneously from the start
  //   • Blend weights (1,0,0) / (0,1,0) / (0,0,1) select the active state
  //   • setWeight() re-enables an action and resets its time scale after a crossFadeTo()
  //   • synchronizeCrossFade() waits for the current loop boundary so feet land cleanly

  /**
   * Creates a THREE.AnimationMixer on the playerGroup and wires up walk/idle/run
   * AnimationClips. All three actions play simultaneously — blend weights decide which
   * one is visible, just like the skinning blending example.
   */
  private setupAnimationMixer(root: THREE.Group): void {
    if (this.mixer) this.mixer.stopAllAction();
    this.mixer      = new THREE.AnimationMixer(root);
    this.idleAction = this.mixer.clipAction(buildIdleClip());
    this.walkAction = this.mixer.clipAction(buildWalkClip());
    this.runAction  = this.mixer.clipAction(buildRunClip());

    this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
    this.walkAction.setLoop(THREE.LoopRepeat, Infinity);
    this.runAction.setLoop(THREE.LoopRepeat, Infinity);

    // Start with idle fully on; walk & run at zero weight (but still playing,
    // so crossFadeTo() can blend into them without a pop)
    this.setWeight(this.idleAction, 1);
    this.setWeight(this.walkAction, 0);
    this.setWeight(this.runAction,  0);
    this.idleAction.play();
    this.walkAction.play();
    this.runAction.play();

    this.wasMoving = false;
    this.moveTimer = 0;
  }

  /** setWeight: re-enable an action and fix its time scale after crossFadeTo() resets it. */
  private setWeight(action: THREE.AnimationAction, weight: number): void {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }

  /** Immediate crossfade (used for responsive start of movement). */
  private executeCrossFade(
    from: THREE.AnimationAction,
    to: THREE.AnimationAction,
    duration: number
  ): void {
    this.setWeight(to, 1);
    to.time = 0;
    from.crossFadeTo(to, duration, true); // warping = true keeps timing smooth
  }

  /**
   * Synchronized crossfade — waits for `from` to finish its current loop before
   * blending. Produces clean foot-plant transitions (the "synchronizeCrossFade"
   * pattern from the skinning blending example).
   */
  private synchronizeCrossFade(
    from: THREE.AnimationAction,
    to: THREE.AnimationAction,
    duration: number
  ): void {
    const onLoop = (e: THREE.Event & { action?: THREE.AnimationAction }) => {
      if (e.action === from) {
        this.mixer.removeEventListener('loop', onLoop);
        this.executeCrossFade(from, to, duration);
      }
    };
    this.mixer.addEventListener('loop', onLoop);
  }

  private startRenderLoop(): void {
    const tick = () => {
      this.animId = requestAnimationFrame(tick);
      const delta = Math.min(this.clock.getDelta(), 0.05); // clamp against tab-refocus spikes
      const t     = this.clock.elapsedTime;

      // ── Smooth position & angle lerp (frame-rate independent) ────────
      const lp = 1 - Math.pow(1 - POS_LERP, delta * 60);
      this.vx += (this.tx - this.vx) * lp;
      this.vz += (this.tz - this.vz) * lp;

      // Angle lerp with π wrap-around to avoid spinning the long way round
      let dA = this.tAngle - this.vAngle;
      while (dA >  Math.PI) dA -= 2 * Math.PI;
      while (dA < -Math.PI) dA += 2 * Math.PI;
      this.vAngle += dA * lp;

      // ── Movement state ────────────────────────────────────────────────
      const moveDist = Math.abs(this.tx - this.vx) + Math.abs(this.tz - this.vz);
      const isMoving = moveDist > 0.04;


      // Detect tile arrival for landing impact squash
      if (this.prevMoveDist > 0.08 && moveDist < 0.08) {
        this.impactTime = t;
      }
      this.prevMoveDist = moveDist;

      // ── AnimationMixer: weight-based blending (skinning blending pattern) ─
      if (this.mixer && this.idleAction && this.walkAction && this.runAction) {
        const runW  = this.runAction.getEffectiveWeight();
        const walkW = this.walkAction.getEffectiveWeight();

        if (isMoving && !this.wasMoving) {
          // Start: immediate idle→walk (responsive to player input)
          this.executeCrossFade(this.idleAction, this.walkAction, 0.20);
          this.moveTimer = 0;
        } else if (!isMoving && this.wasMoving) {
          // Stop: synchronized — wait for current loop boundary before fading to idle
          // so the character's foot lands cleanly before standing still
          const fromAction = runW > walkW ? this.runAction : this.walkAction;
          this.synchronizeCrossFade(fromAction, this.idleAction, 0.35);
          this.moveTimer = 0;
        }

        if (isMoving) {
          this.moveTimer += delta;
          // After 1.2 s of continuous movement, synchronize blend walk→run
          if (this.moveTimer > 1.2 && walkW > 0.5 && runW < 0.5) {
            this.synchronizeCrossFade(this.walkAction, this.runAction, 0.60);
          }
        }

        this.wasMoving = isMoving;
        this.mixer.update(delta);
      }

      // ── Attack animation overlay (applied after mixer, overrides arm joints) ──
      // Procedural swing/punch — positive shoulderR.rotation.x = arm forward
      if (this.pendingAttack && this.attackTimer < 0) {
        this.pendingAttack = false;
        this.attackTimer   = 0;
      }
      if (this.attackTimer >= 0 && this.shoulderR && this.elbowR) {
        this.attackTimer += delta;
        const hasWeapon = !!this.character?.equipment?.weapon;
        const DURATION  = hasWeapon ? 0.65 : 0.52;

        if (this.attackTimer >= DURATION) {
          this.attackTimer = -1;
          // Joints return to mixer control on next tick
        } else {
          const t = this.attackTimer / DURATION;  // 0 → 1
          const ss = (p: number) => p * p * (3 - 2 * p); // smoothstep

          if (hasWeapon) {
            // Sword / weapon swing: wind-up → powerful arc → return
            let shX: number, shZ: number, elX: number;
            if (t < 0.18) {
              const p = t / 0.18;
              shX = -0.40 * ss(p);   // arm pulls back
              shZ = -0.22 * ss(p);   // slight inward rotation (chambers swing)
              elX =  0.18 * ss(p);   // elbow bends more
            } else if (t < 0.60) {
              const p = (t - 0.18) / 0.42;
              shX = -0.40 + ss(p) * 1.90;  // sweeps -0.40 → 1.50
              shZ = -0.22 + ss(p) * 0.47;  // arc  -0.22 → 0.25
              elX =  0.18 - ss(p) * 0.28;  // extends 0.18 → -0.10
            } else {
              const p = (t - 0.60) / 0.40;
              shX = 1.50 * (1 - ss(p));    // return to 0
              shZ = 0.25 * (1 - ss(p));
              elX = -0.10 * (1 - p);
            }
            this.shoulderR.rotation.x = shX;
            this.shoulderR.rotation.z = shZ;
            this.elbowR.rotation.x    = elX;
          } else {
            // Unarmed punch: quick forward jab with bell curve
            const bell = Math.sin(t * Math.PI);
            this.shoulderR.rotation.x =  bell * 1.15;   // forward jab
            this.elbowR.rotation.x    = -bell * 0.30;   // elbow extends
          }
        }
      }

      // ── Player root: position bob + lean + sway scaled by run weight ────
      const runWt = this.runAction?.getEffectiveWeight() ?? 0;
      if (isMoving) {
        const walkFreq = 8.5 + runWt * 5.5;   // run cadence faster than walk
        const walkPh   = t * walkFreq;
        const lean     = -(0.08 + runWt * 0.06);  // lean more when running
        this.playerGroup.rotation.x = lean;
        const stepBob = Math.abs(Math.sin(walkPh)) * (0.062 + runWt * 0.040);
        const sway    = Math.sin(walkPh * 0.5) * (0.013 + runWt * 0.008);
        const swayX   =  sway * Math.cos(this.vAngle);
        const swayZ   = -sway * Math.sin(this.vAngle);
        this.playerGroup.position.set(this.vx + swayX, stepBob, this.vz + swayZ);
        this.playerGroup.rotation.z = sway * 3.5;
      } else {
        this.playerGroup.rotation.x *= 0.80;
        this.playerGroup.rotation.z *= 0.80;
        this.playerGroup.position.set(this.vx, Math.sin(t * 1.8) * 0.006, this.vz);
      }

      // Landing impact: tiny downward squash on tile arrival (foot-plant feel)
      const tsi = t - this.impactTime;
      if (this.impactTime > 0 && tsi < 0.30) {
        this.playerGroup.position.y -= Math.exp(-tsi * 22) * 0.035;
      }

      this.playerGroup.rotation.y = this.vAngle;

      // ── Dog companion animation ───────────────────────────────────────
      if (this.dogTailPivot) {
        const wagSpeed = isMoving ? 9.0 : 4.0;
        const wagAmp   = isMoving ? 0.55 : 0.28;
        this.dogTailPivot.rotation.z = Math.sin(t * wagSpeed) * wagAmp;
      }
      if (this.dogFrontLegL && this.dogFrontLegR && this.dogBackLegL && this.dogBackLegR) {
        if (isMoving) {
          const freq = 9.0 + runWt * 6.0;
          const amp  = 0.42 + runWt * 0.22;
          const ph   = t * freq;
          // Diagonal gait: front-left & back-right swing together
          this.dogFrontLegL.rotation.x =  Math.sin(ph) * amp;
          this.dogFrontLegR.rotation.x = -Math.sin(ph) * amp;
          this.dogBackLegL.rotation.x  = -Math.sin(ph) * amp;
          this.dogBackLegR.rotation.x  =  Math.sin(ph) * amp;
        } else {
          this.dogFrontLegL.rotation.x *= 0.82;
          this.dogFrontLegR.rotation.x *= 0.82;
          this.dogBackLegL.rotation.x  *= 0.82;
          this.dogBackLegR.rotation.x  *= 0.82;
        }
      }

      // ── Torch flicker ─────────────────────────────────────────────────
      this.torchLight.intensity = 7.5
        + Math.sin(t * 11.3) * 0.6
        + Math.sin(t * 7.1 + 1.2) * 0.4;

      // Torch in the player's forward hand
      // forward = (-sin(θ), 0, -cos(θ)) in Three.js convention
      const sinA = Math.sin(this.vAngle);
      const cosA = Math.cos(this.vAngle);
      this.torchLight.position.set(
        this.vx - sinA * 0.45 + cosA * 0.22,
        0.78,
        this.vz - cosA * 0.45 - sinA * 0.22,
      );

      // ── Spell particles ───────────────────────────────────────────────
      if (this.pendingSpellId && this.spellParticles) {
        // Hand position (mirror of torch position, opposite side)
        const hx = this.vx - sinA * 0.40 - cosA * 0.22;
        const hz = this.vz - cosA * 0.40 + sinA * 0.22;
        this.spellParticles.trigger(
          this.pendingSpellId,
          hx, 0.75, hz,
          this.vx - sinA * ENEMY_DIST, 0.55, this.vz - cosA * ENEMY_DIST,
        );
        this.pendingSpellId = '';
      }
      if (this.spellParticles) {
        this.spellParticles.update(delta);
        const flash = this.spellParticles.flash;
        if (flash) {
          const envelope = Math.pow(1 - flash.time / flash.duration, 2);
          this.torchLight.color.setRGB(
            0.98 + (flash.r - 0.98) * envelope,
            0.73 + (flash.g - 0.73) * envelope,
            0.33 + (flash.b - 0.33) * envelope,
          );
          this.torchLight.intensity += envelope * 14;
        } else {
          this.torchLight.color.setHex(0xffbb55);
        }
      }

      // ── Third-person camera — pulls back & rises as run weight increases ──
      // Mirrors the skinning blending example's cinematic follow camera
      const camBehind = CAM_BEHIND_WALK + (CAM_BEHIND_RUN - CAM_BEHIND_WALK) * runWt;
      const camH      = CAM_HEIGHT_WALK + (CAM_HEIGHT_RUN  - CAM_HEIGHT_WALK) * runWt;
      const camBob    = isMoving ? Math.abs(Math.sin(t * (8.5 + runWt * 5.5))) * (0.020 + runWt * 0.012) : 0;
      const lookAhead = isMoving ? 0.20 + runWt * 0.25 : 0;
      const lookAtX   = this.vx - sinA * lookAhead;
      const lookAtZ   = this.vz - cosA * lookAhead;

      // Apply mouse-orbit offset: rotate the camera around the player
      const orbitAngle = this.vAngle + this.camYawOffset;
      const sinOrbit   = Math.sin(orbitAngle);
      const cosOrbit   = Math.cos(orbitAngle);
      const hasOrbit   = Math.abs(this.camYawOffset) > 0.01 || Math.abs(this.camPitchOffset) > 0.01;

      this.camTarget.set(
        this.vx + sinOrbit * camBehind,
        camH + camBob + this.camPitchOffset,
        this.vz + cosOrbit * camBehind,
      );
      const camLp = 1 - Math.pow(1 - (isMoving ? 0.18 : 0.10), delta * 60);
      this.camera.position.lerp(this.camTarget, camLp);
      // When orbiting, look at the player center; otherwise use normal look-ahead
      this.camera.lookAt(
        hasOrbit ? this.vx : lookAtX,
        0.28 + runWt * 0.12,
        hasOrbit ? this.vz : lookAtZ,
      );

      // ── Enemy sprites: track smooth position every frame ─────────────
      this.updateEnemyPositions();

      this.renderer.render(this.scene, this.camera);
    };
    this.ngZone.runOutsideAngular(tick);
  }

  // ─── Scene / position helpers ─────────────────────────────────────────────

  /** Instantly snap visual state (used on first load and floor transitions). */
  private snapToPosition(): void {
    const { x, z, angle } = this.getTargetXZA();
    this.vx = this.tx = x;
    this.vz = this.tz = z;
    this.vAngle = this.tAngle = angle;
    this.lastFloorLevel = this.floor?.level ?? -1;

    if (this.playerGroup) {
      this.playerGroup.position.set(x, 0, z);
      this.playerGroup.rotation.set(0, angle, 0);
      this.prevMoveDist = 0;
      this.impactTime   = -1;
    }
    if (this.camera) {
      const sinA = Math.sin(angle), cosA = Math.cos(angle);
      this.camera.position.set(x + sinA * CAM_BEHIND_WALK, CAM_HEIGHT_WALK, z + cosA * CAM_BEHIND_WALK);
      this.camera.lookAt(x, 0.25, z);
    }
    if (this.torchLight) this.torchLight.position.set(x, 0.78, z);
  }

  /** Update movement targets (every step). */
  private updateTargets(): void {
    const { x, z, angle } = this.getTargetXZA();
    this.tx = x; this.tz = z; this.tAngle = angle;
  }

  private getTargetXZA(): { x: number; z: number; angle: number } {
    return {
      x:     this.position.x + 0.5,
      z:     this.position.y + 0.5,
      angle: this.dirToAngle(this.direction),
    };
  }

  // Three.js rotation.y convention: forward = (-sin(θ), 0, -cos(θ))
  private dirToAngle(dir: string): number {
    switch (dir) {
      case 'N': return 0;
      case 'S': return Math.PI;
      case 'E': return -Math.PI / 2;
      case 'W': return  Math.PI / 2;
      default:  return 0;
    }
  }

  // ─── Scene building ───────────────────────────────────────────────────────

  private rebuildDungeonGeometry(): void {
    const prev = [...this.dungeonGroup.children];
    prev.forEach(c => this.dungeonGroup.remove(c));

    type Inst = { x: number; y: number; z: number; rx: number; ry: number };
    const stone: Inst[] = [], ceil: Inst[] = [], floor: Inst[] = [], door: Inst[] = [];
    // Stair tile positions for 3-D staircase meshes
    const stairsUp:   Array<{ wx: number; wz: number }> = [];
    const stairsDown: Array<{ wx: number; wz: number }> = [];

    for (let dy = -RENDER_RANGE; dy <= RENDER_RANGE; dy++) {
      for (let dx = -RENDER_RANGE; dx <= RENDER_RANGE; dx++) {
        const cx = this.position.x + dx;
        const cy = this.position.y + dy;
        if (this.cellKind(cx, cy) === 'wall') continue;

        const wx = cx + 0.5, wz = cy + 0.5;
        floor.push({ x: wx, y: 0,   z: wz, rx: -Math.PI / 2, ry: 0 });
        ceil.push(  { x: wx, y: 1.0, z: wz, rx:  Math.PI / 2, ry: 0 });

        // Detect stair tiles for 3-D mesh
        const cell = this.floor?.cells[cy]?.[cx];
        if (cell?.type === 'stairs-up')   stairsUp.push({ wx, wz });
        if (cell?.type === 'stairs-down') stairsDown.push({ wx, wz });

        const sides: Array<{ kind: CellKind; x: number; z: number; ry: number }> = [
          { kind: this.cellKind(cx,     cy - 1), x: wx,     z: cy,     ry: 0           },
          { kind: this.cellKind(cx,     cy + 1), x: wx,     z: cy + 1, ry: Math.PI     },
          { kind: this.cellKind(cx - 1, cy    ), x: cx,     z: wz,     ry:  Math.PI/2  },
          { kind: this.cellKind(cx + 1, cy    ), x: cx + 1, z: wz,     ry: -Math.PI/2  },
        ];
        for (const s of sides) {
          const inst = { x: s.x, y: 0.5, z: s.z, rx: 0, ry: s.ry };
          if (s.kind === 'wall')       stone.push(inst);
          else if (s.kind === 'door')  door.push(inst);
        }
      }
    }

    this.spawnInstances(stone, this.stoneMat);
    this.spawnInstances(ceil,  this.ceilMat);
    this.spawnInstances(floor, this.floorMat);
    this.spawnInstances(door,  this.doorMat);

    // Add 3-D staircase meshes on top of stair tiles
    for (const { wx, wz } of stairsUp) {
      const sm = buildStairsMesh('up', this.stairUpMat, this.stoneMat);
      sm.position.set(wx, 0, wz);
      this.dungeonGroup.add(sm);
    }
    for (const { wx, wz } of stairsDown) {
      const sm = buildStairsMesh('down', this.stairDownMat, this.stoneMat);
      sm.position.set(wx, 0, wz);
      this.dungeonGroup.add(sm);
    }
  }

  /** Rebuilds enemy billboard sprites. Positions are updated per-frame in the render loop. */
  private buildEnemySprites(): void {
    for (let i = this.enemyGroup.children.length - 1; i >= 0; i--) {
      const s = this.enemyGroup.children[i] as THREE.Sprite;
      this.enemyGroup.remove(s);
      (s.material as THREE.SpriteMaterial).map?.dispose();
      (s.material as THREE.SpriteMaterial).dispose();
    }
    this.enemySprites = [];
    if (!this.enemies?.length) return;

    this.enemies.forEach((enemy) => {
      const isDead = enemy.status === 'dead';
      const mat = new THREE.SpriteMaterial({
        map: makeEnemyTexture(enemy),
        transparent: true,
        opacity: isDead ? 0.22 : 1.0,
        fog: true,
        depthWrite: false,
        depthTest: false,  // always render on top of walls/doors
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.7, 0.9, 1);
      sprite.renderOrder = 10;
      this.enemyGroup.add(sprite);
      this.enemySprites.push(sprite);
    });
  }

  /** Update enemy sprite world positions based on current smooth player pos/angle. */
  private updateEnemyPositions(): void {
    if (!this.enemySprites.length) return;
    const fwd  = this.forwardVecFromAngle(this.vAngle);
    const perpX = -fwd.z, perpZ = fwd.x;
    const n = this.enemySprites.length;
    const spacing = n > 1 ? Math.min(0.52, 0.9 / (n - 1)) : 0;
    this.enemySprites.forEach((sprite, i) => {
      const isDead = this.enemies[i]?.status === 'dead';
      const offset = (i - (n - 1) / 2) * spacing;
      const dist   = ENEMY_DIST + (isDead ? 0.4 : 0);
      sprite.position.set(
        this.vx + fwd.x * dist + perpX * offset,
        0.5,
        this.vz + fwd.z * dist + perpZ * offset,
      );
    });
  }

  private spawnInstances(
    instances: Array<{ x: number; y: number; z: number; rx: number; ry: number }>,
    mat: THREE.MeshStandardMaterial
  ): void {
    if (instances.length === 0) return;
    const im = new THREE.InstancedMesh(this.planeGeo, mat, instances.length);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.receiveShadow = true;
    instances.forEach(({ x, y, z, rx, ry }, i) => {
      this.dummy.position.set(x, y, z);
      this.dummy.rotation.set(rx, ry, 0);
      this.dummy.updateMatrix();
      im.setMatrixAt(i, this.dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    this.dungeonGroup.add(im);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private dirVec(): { x: number; z: number } {
    switch (this.direction) {
      case 'N': return { x:  0, z: -1 };
      case 'S': return { x:  0, z:  1 };
      case 'E': return { x:  1, z:  0 };
      case 'W': return { x: -1, z:  0 };
      default:  return { x:  0, z: -1 };
    }
  }

  /** Forward vector from a continuous angle (used in render loop for smooth sprite tracking). */
  private forwardVecFromAngle(angle: number): { x: number; z: number } {
    // Three.js convention: forward = (-sin(θ), 0, -cos(θ))
    return { x: -Math.sin(angle), z: -Math.cos(angle) };
  }

  private cellKind(x: number, y: number): CellKind {
    if (!this.floor) return 'wall';
    if (x < 0 || y < 0 || x >= this.floor.width || y >= this.floor.height) return 'wall';
    const c = this.floor.cells[y]?.[x];
    if (!c || c.type === 'wall') return 'wall';
    if (c.type === 'door') return 'door';
    return 'open';
  }
}
