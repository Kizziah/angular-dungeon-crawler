import {
  Component, Input, OnChanges, AfterViewInit, OnDestroy, SimpleChanges,
  ViewChild, ElementRef, NgZone, HostListener
} from '@angular/core';
import * as THREE from 'three';
import { DungeonFloor, Position } from '../../core/models/dungeon.model';
import { MonsterInstance } from '../../core/models/monster.model';
import { getMonsterSvg } from '../combat/monster-sprite.component';
import { Character, Equipment } from '../../core/models/character.model';
import { Item } from '../../core/models/item.model';
import { makeWeaponMesh, makeShieldMesh, wmesh } from './equipment-meshes';

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

  // Reusable camera vectors (avoid per-frame allocations)
  private readonly camTarget = new THREE.Vector3();

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.initThree();
    this.ready = true;
    if (this.floor && this.position) {
      this.snapToPosition();
      this.rebuildDungeonGeometry();
      this.buildEnemySprites();
    }
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
    this.renderer?.dispose();
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'z' || e.key === 'Z') {
      this.pendingAttack = true;
    }
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
    this.buildCharacterGeometry(g, this.character?.equipment ?? null);
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
    this.buildCharacterGeometry(this.playerGroup, this.character?.equipment ?? null);
    this.setupAnimationMixer(this.playerGroup);
  }

  /**
   * Builds a fully-jointed humanoid skeleton with CylinderGeometry limbs,
   * sphere joints, tapered torso, and equipment-specific armor/weapon meshes.
   * Joint Groups are stored as fields so the render loop can animate them.
   */
  private buildCharacterGeometry(g: THREE.Group, eq: Equipment | null): void {
    const lam = (hex: number, rough = 0.80, metal = 0.0, em = 0, emI = 0): THREE.MeshStandardMaterial => {
      const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
      if (em) { m.emissive.setHex(em); m.emissiveIntensity = emI; }
      return m;
    };
    const cyl = (rT: number, rB: number, h: number, s = 8) =>
      new THREE.CylinderGeometry(rT, rB, h, s);
    const sph = (r: number, ws = 8, hs = 6) =>
      new THREE.SphereGeometry(r, ws, hs);
    const box = (w: number, h: number, d: number) =>
      new THREE.BoxGeometry(w, h, d);

    // ── Armor / skin tones ───────────────────────────────────────────────
    const aTier   = armorTier(eq?.bodyArmor?.definitionId);
    const aColor  = eq?.bodyArmor?.cursed ? 0x220022 : ARMOR_COLORS[aTier];
    const hTier   = helmTier(eq?.helmet?.definitionId);
    const hColor  = eq?.helmet?.cursed   ? 0x220022 : HELM_COLORS[hTier];
    const skin    = 0xffcc99;
    const legCol  = eq?.bodyArmor?.cursed ? 0x220022
                  : aTier !== 'none'       ? aColor : 0x2a3040;
    const bootCol = eq?.boots?.cursed  ? 0x110011
                  : aTier === 'plate'  ? 0x667788
                  : aTier === 'chain'  ? 0x445566
                  : eq?.boots          ? 0x4a3a2a
                  :                     0x2a1a0a;

    // PBR roughness/metalness per armor tier
    const [aRough, aMetal] = aTier === 'plate'  ? [0.20, 0.85]
                           : aTier === 'chain'  ? [0.45, 0.60]
                           : aTier === 'leather'? [0.85, 0.05]
                           :                     [0.80, 0.00];
    const [hRough, hMetal] = hTier === 'great'  ? [0.20, 0.85]
                           : hTier === 'iron'   ? [0.25, 0.75]
                           : hTier === 'leather'? [0.85, 0.05]
                           :                     [0.80, 0.00];

    const bodyMat = lam(aColor, aRough, aMetal);
    const legMat  = lam(legCol, aRough, aMetal);
    const armMat  = lam(aTier === 'none' ? skin : aColor, aTier === 'none' ? 0.82 : aRough, aTier === 'none' ? 0.0 : aMetal);
    const skinMat = lam(skin, 0.82, 0.0);
    const bootMat = lam(bootCol, 0.75, aTier === 'plate' ? 0.50 : 0.05);
    const beltMat = lam(0x6a4a2a, 0.80, 0.0);
    const buckMat = lam(0xccaa44, 0.30, 0.70);
    const helmMat = lam(hColor, hRough, hMetal);

    // ── HIP GROUP — drives leg sway ──────────────────────────────────────
    this.hipPivot = new THREE.Group();
    this.hipPivot.name = 'hipPivot';
    this.hipPivot.position.set(0, 0.52, 0);
    g.add(this.hipPivot);
    this.hipPivot.add(wmesh(box(0.32, 0.10, 0.22), bodyMat, 0, 0, 0));

    // ── LEGS ─────────────────────────────────────────────────────────────
    for (const side of [-1, 1] as const) {
      const legPivot = new THREE.Group();
      legPivot.name = side === -1 ? 'legPivotL' : 'legPivotR';
      legPivot.position.set(side * 0.10, 0, 0);
      this.hipPivot.add(legPivot);
      if (side === -1) this.legPivotL = legPivot;
      else             this.legPivotR = legPivot;

      // Thigh (tapered cylinder, hangs from hip pivot)
      legPivot.add(wmesh(cyl(0.076, 0.062, 0.22), legMat, 0, -0.11, 0));

      // Knee joint sphere
      legPivot.add(wmesh(sph(0.055), legMat, 0, -0.22, 0));

      // Knee pivot
      const kneePivot = new THREE.Group();
      kneePivot.name = side === -1 ? 'kneePivotL' : 'kneePivotR';
      kneePivot.position.set(0, -0.22, 0);
      legPivot.add(kneePivot);
      if (side === -1) this.kneePivotL = kneePivot;
      else             this.kneePivotR = kneePivot;

      // Shin (tapered, narrower than thigh)
      kneePivot.add(wmesh(cyl(0.058, 0.046, 0.24), legMat, 0, -0.12, 0));

      // Plate knee guard
      if (aTier === 'plate') {
        const kCol = eq?.bodyArmor?.cursed ? 0x330033 : 0x9aaac0;
        kneePivot.add(wmesh(box(0.14, 0.08, 0.14), lam(kCol, 0.20, 0.85), 0, -0.01, 0.05));
      }

      // Boot (attached at ankle, toe extends forward)
      const bootGrp = new THREE.Group();
      bootGrp.position.set(0, -0.24, 0);
      kneePivot.add(bootGrp);
      bootGrp.add(wmesh(box(0.16, 0.09, 0.26), bootMat, 0, -0.045, 0.05));
    }

    // ── TORSO ────────────────────────────────────────────────────────────
    // Belt
    g.add(wmesh(box(0.38, 0.08, 0.23), beltMat, 0, 0.52, 0));
    g.add(wmesh(box(0.08, 0.06, 0.25), buckMat, 0, 0.52, 0));
    // Waist
    g.add(wmesh(box(0.36, 0.14, 0.23), bodyMat, 0, 0.61, 0));
    // Chest (wider, heroic V-shape via layering)
    g.add(wmesh(box(0.48, 0.18, 0.26), bodyMat, 0, 0.73, 0));
    // Plate chest & belly
    if (aTier === 'plate') {
      const pCol = eq?.bodyArmor?.cursed ? 0x330033 : 0x9aaac0;
      g.add(wmesh(box(0.28, 0.16, 0.28), lam(pCol, 0.20, 0.85), 0, 0.73, 0));
      g.add(wmesh(box(0.22, 0.10, 0.25), lam(pCol, 0.20, 0.85), 0, 0.61, 0));
    }

    // ── PAULDRONS ────────────────────────────────────────────────────────
    if (aTier !== 'none') {
      const pSz  = aTier === 'plate' ? 0.23 : aTier === 'chain' ? 0.17 : 0.12;
      const pCol = eq?.bodyArmor?.cursed ? 0x220022
                 : aTier === 'plate'      ? 0x9aaac0
                 : aColor;
      for (const sx of [-1, 1]) {
        g.add(wmesh(box(pSz, 0.10, pSz * 0.85), lam(pCol, aRough, aMetal), sx * 0.28, 0.80, 0));
      }
    }

    // ── NECK ─────────────────────────────────────────────────────────────
    g.add(wmesh(cyl(0.06, 0.055, 0.07, 6),
      lam(hTier === 'none' ? skin : aColor, hTier === 'none' ? 0.82 : aRough, hTier === 'none' ? 0.0 : aMetal), 0, 0.85, 0));

    // ── HEAD ─────────────────────────────────────────────────────────────
    const headGrp = new THREE.Group();
    headGrp.position.set(0, 0.96, 0);
    g.add(headGrp);

    headGrp.add(wmesh(box(0.30, 0.28, 0.27), helmMat, 0, 0, 0));

    // Facial features for unhelmed / leather-capped
    if (hTier === 'none' || hTier === 'leather') {
      headGrp.add(wmesh(box(0.07, 0.05, 0.02), lam(0x223344, 0.60, 0.0), -0.07, 0.03, 0.135));
      headGrp.add(wmesh(box(0.07, 0.05, 0.02), lam(0x223344, 0.60, 0.0),  0.07, 0.03, 0.135));
      headGrp.add(wmesh(box(0.04, 0.06, 0.04), lam(0xeebbaa, 0.82, 0.0), 0, -0.03, 0.145));
      if (hTier === 'none') {
        // Hair strip across top-back
        headGrp.add(wmesh(box(0.30, 0.06, 0.14), lam(0x3a2010, 0.90, 0.0), 0, 0.16, -0.06));
      }
    }
    if (hTier === 'iron' || hTier === 'great') {
      headGrp.add(wmesh(box(0.20, 0.06, 0.06), lam(0x111a22, 0.30, 0.70), 0, 0.02, 0.145));
      headGrp.add(wmesh(box(0.32, 0.05, 0.08), helmMat, 0, 0.08, 0.135));
    }
    if (hTier === 'great') {
      headGrp.add(wmesh(box(0.07, 0.20, 0.08), helmMat, -0.18, -0.05, 0.10));
      headGrp.add(wmesh(box(0.07, 0.20, 0.08), helmMat,  0.18, -0.05, 0.10));
      headGrp.add(wmesh(box(0.22, 0.07, 0.05), helmMat, 0, -0.14, 0.125));
    }
    if (hTier === 'leather') {
      headGrp.add(wmesh(box(0.34, 0.04, 0.30), helmMat, 0, 0.14, 0.02));
    }

    // ── ARMS (shoulder → elbow → hand with sphere joints) ────────────────
    for (const side of [-1, 1] as const) {
      const shoulder = new THREE.Group();
      shoulder.name = side === -1 ? 'shoulderL' : 'shoulderR';
      shoulder.position.set(side * 0.27, 0.79, 0);
      g.add(shoulder);
      if (side === -1) this.shoulderL = shoulder;
      else             this.shoulderR = shoulder;

      // Shoulder sphere
      shoulder.add(wmesh(sph(0.062, 8, 6), armMat, 0, 0, 0));
      // Upper arm (tapered cylinder)
      shoulder.add(wmesh(cyl(0.056, 0.046, 0.20), armMat, 0, -0.10, 0));
      // Bracer ring at mid-arm for armored characters
      if (aTier === 'plate' || aTier === 'chain') {
        const bCol = eq?.bodyArmor?.cursed ? 0x220022
                   : aTier === 'plate' ? 0x9aaac0 : 0x4a5a66;
        shoulder.add(wmesh(cyl(0.060, 0.056, 0.07), lam(bCol, aRough, aMetal), 0, -0.175, 0));
      }

      // Elbow pivot
      const elbow = new THREE.Group();
      elbow.name = side === -1 ? 'elbowL' : 'elbowR';
      elbow.position.set(0, -0.20, 0);
      shoulder.add(elbow);
      if (side === -1) this.elbowL = elbow;
      else             this.elbowR = elbow;

      // Elbow sphere
      elbow.add(wmesh(sph(0.048, 8, 6), armMat, 0, 0, 0));
      // Forearm
      elbow.add(wmesh(cyl(0.044, 0.036, 0.18), armMat, 0, -0.09, 0));
      // Wrist guard
      if (aTier !== 'none') {
        const wCol = eq?.bodyArmor?.cursed ? 0x220022
                   : aTier === 'plate' ? 0x9aaac0 : 0x4a5a66;
        elbow.add(wmesh(cyl(0.050, 0.048, 0.06), lam(wCol, aRough, aMetal), 0, -0.155, 0));
      }
      // Hand
      elbow.add(wmesh(box(0.08, 0.08, 0.07),
        aTier === 'none' ? skinMat : armMat, 0, -0.22, 0));
    }

    // ── WEAPON (right hand) ──────────────────────────────────────────────
    if (eq?.weapon) {
      const wm = makeWeaponMesh(eq.weapon);
      wm.position.set(0.02, -0.24, 0.03);
      this.elbowR.add(wm);
    }

    // ── SHIELD (left hand) ───────────────────────────────────────────────
    if (eq?.shield) {
      const sm = makeShieldMesh(eq.shield);
      sm.position.set(-0.02, -0.20, 0.08);
      sm.rotation.set(-Math.PI / 10, 0.12, 0);
      this.elbowL.add(sm);
    }

    // Enable shadow casting on all character meshes
    g.traverse(child => {
      if (child instanceof THREE.Mesh) child.castShadow = true;
    });
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

      // ── Third-person camera — pulls back & rises as run weight increases ──
      // Mirrors the skinning blending example's cinematic follow camera
      const camBehind = CAM_BEHIND_WALK + (CAM_BEHIND_RUN - CAM_BEHIND_WALK) * runWt;
      const camH      = CAM_HEIGHT_WALK + (CAM_HEIGHT_RUN  - CAM_HEIGHT_WALK) * runWt;
      const camBob    = isMoving ? Math.abs(Math.sin(t * (8.5 + runWt * 5.5))) * (0.020 + runWt * 0.012) : 0;
      const lookAhead = isMoving ? 0.20 + runWt * 0.25 : 0;
      const lookAtX   = this.vx - sinA * lookAhead;
      const lookAtZ   = this.vz - cosA * lookAhead;

      this.camTarget.set(
        this.vx + sinA * camBehind,
        camH + camBob,
        this.vz + cosA * camBehind,
      );
      const camLp = 1 - Math.pow(1 - (isMoving ? 0.18 : 0.10), delta * 60);
      this.camera.position.lerp(this.camTarget, camLp);
      this.camera.lookAt(lookAtX, 0.28 + runWt * 0.12, lookAtZ);

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

// ─── Armor / helm classification ─────────────────────────────────────────────

const ARMOR_COLORS: Record<'none' | 'leather' | 'chain' | 'plate', number> = {
  none:    0x3a2a1a,
  leather: 0x8b4513,
  chain:   0x556677,
  plate:   0x8899bb,
};
const HELM_COLORS: Record<'none' | 'leather' | 'iron' | 'great', number> = {
  none:    0xffcc99,
  leather: 0x8b4513,
  iron:    0x6677aa,
  great:   0x8899bb,
};

function armorTier(id: string | undefined): 'none' | 'leather' | 'chain' | 'plate' {
  if (!id) return 'none';
  if (id.includes('plate') || id === 'cursed-armor') return 'plate';
  if (id.includes('chain') || id.includes('mail')   || id.includes('elven')) return 'chain';
  if (id.includes('leather')) return 'leather';
  return 'none';
}

function helmTier(id: string | undefined): 'none' | 'leather' | 'iron' | 'great' {
  if (!id) return 'none';
  if (id.includes('great')) return 'great';
  if (id.includes('iron')  || id.includes('helm')) return 'iron';
  if (id.includes('cap')   || id.includes('leather')) return 'leather';
  return 'none';
}

function equipSig(eq: Equipment | null): string {
  if (!eq) return '';
  return [eq.weapon?.definitionId, eq.shield?.definitionId,
          eq.helmet?.definitionId, eq.bodyArmor?.definitionId, eq.boots?.definitionId]
    .join('|');
}


// ─── AnimationClip factories (keyframe-driven character animation) ────────────
//
// Inspired by threejs.org/examples/#webgl_animation_keyframes:
//   mixer = new THREE.AnimationMixer(model)
//   mixer.clipAction(clip).play()
//   mixer.update(delta)  ← called each frame

/** Returns one full walk-cycle AnimationClip using QuaternionKeyframeTracks. */
function buildWalkClip(): THREE.AnimationClip {
  const FREQ = 8.5;                      // radians / second (matches legacy walk speed)
  const T    = (2 * Math.PI) / FREQ;    // one full cycle ≈ 0.74 s
  const N    = 16;                       // samples per cycle
  const AX   = new THREE.Vector3(1, 0, 0);
  const AZ   = new THREE.Vector3(0, 0, 1);
  const q    = new THREE.Quaternion();

  const times: number[] = [];
  const legL: number[] = [], legR: number[] = [];
  const kneeL: number[] = [], kneeR: number[] = [];
  const hipZ: number[] = [];
  const shL: number[] = [], shR: number[] = [];
  const elL: number[] = [], elR: number[] = [];

  for (let i = 0; i <= N; i++) {
    const frac = i / N;
    const sw   = Math.sin(frac * 2 * Math.PI);
    times.push(frac * T);

    q.setFromAxisAngle(AX,  sw * 0.72);  legL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, -sw * 0.72);  legR.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, Math.max(0, -sw) * 0.60); kneeL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, Math.max(0,  sw) * 0.60); kneeR.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AZ, -sw * 0.04);  hipZ.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, -sw * 0.60);  shL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX,  sw * 0.60);  shR.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX,  0.10 + Math.max(0,  sw) * 0.45); elL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX,  0.10 + Math.max(0, -sw) * 0.45); elR.push(q.x, q.y, q.z, q.w);
  }

  const QKT = (name: string, vals: number[]) =>
    new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, vals);

  return new THREE.AnimationClip('walk', T, [
    QKT('legPivotL',  legL),  QKT('legPivotR',  legR),
    QKT('kneePivotL', kneeL), QKT('kneePivotR', kneeR),
    QKT('hipPivot',   hipZ),
    QKT('shoulderL',  shL),   QKT('shoulderR',  shR),
    QKT('elbowL',     elL),   QKT('elbowR',     elR),
  ]);
}

/** Gentle idle breathing AnimationClip. */
function buildIdleClip(): THREE.AnimationClip {
  const T  = (2 * Math.PI) / 1.8;   // breathing period ≈ 3.49 s
  const N  = 12;
  const AX = new THREE.Vector3(1, 0, 0);
  const q  = new THREE.Quaternion();

  const times: number[] = [];
  const shL: number[] = [], shR: number[] = [];
  const elL: number[] = [], elR: number[] = [];

  for (let i = 0; i <= N; i++) {
    const frac = i / N;
    const sway = Math.sin(frac * 2 * Math.PI) * 0.015;
    times.push(frac * T);
    q.setFromAxisAngle(AX, sway);          shL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, sway);          shR.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, 0.10 + sway);   elL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, 0.10 + sway);   elR.push(q.x, q.y, q.z, q.w);
  }

  const QKT = (name: string, vals: number[]) =>
    new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, vals);

  return new THREE.AnimationClip('idle', T, [
    QKT('shoulderL', shL), QKT('shoulderR', shR),
    QKT('elbowL',    elL), QKT('elbowR',    elR),
  ]);
}

/**
 * Run AnimationClip — faster cadence and greater amplitude than walk.
 * Uses the same joint/track layout as buildWalkClip() but tuned for sprinting:
 *   • FREQ 14 Hz (vs 8.5), period 0.45 s
 *   • Leg amplitude 0.90 (vs 0.72), knee bend 0.75 (vs 0.60)
 *   • Shoulder pump 0.80 (vs 0.60), elbow max 0.60 (vs 0.45)
 *   • Hip sway 0.06 (vs 0.04)
 */
function buildRunClip(): THREE.AnimationClip {
  const FREQ = 14;
  const T    = (2 * Math.PI) / FREQ;  // period ≈ 0.45 s
  const N    = 16;
  const AX   = new THREE.Vector3(1, 0, 0);
  const AZ   = new THREE.Vector3(0, 0, 1);
  const q    = new THREE.Quaternion();

  const times: number[] = [];
  const hipArr: number[] = [];
  const lgL: number[] = [], lgR: number[] = [];
  const knL: number[] = [], knR: number[] = [];
  const shL: number[] = [], shR: number[] = [];
  const elL: number[] = [], elR: number[] = [];

  for (let i = 0; i <= N; i++) {
    const ph   = (i / N) * 2 * Math.PI;
    const sinP = Math.sin(ph);
    const cosP = Math.cos(ph);
    times.push((i / N) * T);

    // Hip sway (Z)
    q.setFromAxisAngle(AZ, sinP * 0.06);      hipArr.push(q.x, q.y, q.z, q.w);
    // Legs (X) — opposite phase
    const legSwing = 0.90;
    q.setFromAxisAngle(AX,  sinP * legSwing); lgL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, -sinP * legSwing); lgR.push(q.x, q.y, q.z, q.w);
    // Knees — bend more on trailing leg
    const kneeBend = 0.75;
    q.setFromAxisAngle(AX, Math.max(0, -sinP) * kneeBend); knL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, Math.max(0,  sinP) * kneeBend); knR.push(q.x, q.y, q.z, q.w);
    // Arms pump opposite to legs
    const shPump = 0.80;
    q.setFromAxisAngle(AX, -cosP * shPump * 0.5 + sinP * shPump * 0.5); shL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX,  cosP * shPump * 0.5 - sinP * shPump * 0.5); shR.push(q.x, q.y, q.z, q.w);
    // Elbow bend
    const elMax = 0.60;
    q.setFromAxisAngle(AX, Math.max(0.20, Math.abs(sinP)) * elMax); elL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, Math.max(0.20, Math.abs(cosP)) * elMax); elR.push(q.x, q.y, q.z, q.w);
  }

  const QKT = (name: string, vals: number[]) =>
    new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, vals);

  return new THREE.AnimationClip('run', T, [
    QKT('hipPivot',   hipArr),
    QKT('legPivotL',  lgL),   QKT('legPivotR',  lgR),
    QKT('kneePivotL', knL),   QKT('kneePivotR', knR),
    QKT('shoulderL',  shL),   QKT('shoulderR',  shR),
    QKT('elbowL',     elL),   QKT('elbowR',     elR),
  ]);
}


/**
 * Builds a 3-D staircase mesh for a dungeon stair tile (1×1 world unit).
 *
 * Geometry:
 *   • 5 stone steps rising toward -Z (north wall of the tile)
 *   • Two stone pillars + lintel forming an arch at the top
 *   • A glowing portal plane inside the arch
 *     – stairs-up  → blue glow  (leads to previous / shallower floor)
 *     – stairs-down → orange/red glow  (leads to deeper floor)
 *
 * The Group is centered at (0,0,0) so the caller positions it at the tile's
 * world centre (wx, 0, wz).
 */
function buildStairsMesh(
  kind:     'up' | 'down',
  stepMat:  THREE.MeshStandardMaterial,
  stoneMat: THREE.MeshStandardMaterial,
): THREE.Group {
  const g = new THREE.Group();

  const STEPS  = 5;
  const stepH  = 1.0 / STEPS;   // total height = floor-to-ceiling
  const stepD  = 0.16;           // depth per step (Z direction)
  const stepW  = 0.88;           // width (X direction)
  const startZ = -0.44;          // first step's back edge (north end of tile)

  // ── Steps ───────────────────────────────────────────────────────────────
  for (let i = 0; i < STEPS; i++) {
    const riser = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, stepH, stepD),
      stepMat,
    );
    riser.position.set(0, i * stepH + stepH * 0.5, startZ + i * stepD);
    riser.castShadow = riser.receiveShadow = true;
    g.add(riser);

    // Tread (flat top surface, slightly wider than riser)
    const tread = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, 0.025, stepD + 0.01),
      stepMat,
    );
    tread.position.set(0, (i + 1) * stepH, startZ + i * stepD);
    tread.castShadow = tread.receiveShadow = true;
    g.add(tread);
  }

  // ── Arch at the top of the staircase ────────────────────────────────────
  const archZ  = startZ + STEPS * stepD;
  const archH  = 0.85;
  const pillarW = 0.075;

  // Left and right pillars
  for (const sx of [-stepW * 0.5 - pillarW * 0.5, stepW * 0.5 + pillarW * 0.5]) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(pillarW, archH, pillarW),
      stoneMat,
    );
    pillar.position.set(sx, archH * 0.5, archZ);
    pillar.castShadow = true;
    g.add(pillar);
  }

  // Lintel (horizontal beam across the top)
  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(stepW + pillarW * 2 + 0.02, 0.075, pillarW),
    stoneMat,
  );
  lintel.position.set(0, archH + 0.037, archZ);
  lintel.castShadow = true;
  g.add(lintel);

  // ── Glowing portal inside the arch ──────────────────────────────────────
  const glowColor = kind === 'up' ? 0x3366ff : 0xff5500;
  const glowMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: new THREE.Color(glowColor),
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.80,
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(stepW, archH),
    glowMat,
  );
  portal.position.set(0, archH * 0.5, archZ + 0.01);
  g.add(portal);

  // Matching point light to cast glow into the room
  const light = new THREE.PointLight(glowColor, 1.8, 3.5, 1.8);
  light.position.set(0, archH * 0.55, archZ);
  g.add(light);

  // ── Direction arrow painted on the floor ────────────────────────────────
  // Simple triangle mesh pointing toward the arch
  const arrowVerts = new Float32Array([
    0, 0.002,  0.10,    // tip (toward arch / -Z)
   -0.14, 0.002, 0.32,
    0.14, 0.002, 0.32,
  ]);
  const arrowGeo = new THREE.BufferGeometry();
  arrowGeo.setAttribute('position', new THREE.BufferAttribute(arrowVerts, 3));
  arrowGeo.computeVertexNormals();
  const arrowMat = new THREE.MeshStandardMaterial({
    color: glowColor, emissive: new THREE.Color(glowColor), emissiveIntensity: 0.8,
    roughness: 1.0, metalness: 0.0,
  });
  const arrow = new THREE.Mesh(arrowGeo, arrowMat);
  g.add(arrow);

  return g;
}

function makeStoneTexture(dark: boolean): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const ctx = cv.getContext('2d')!;

  // Mortar background
  ctx.fillStyle = dark ? '#0d0d0d' : '#181818';
  ctx.fillRect(0, 0, 128, 128);

  // 2×2 grid of bevelled stone blocks
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const bx = col * 64, by = row * 64;
      ctx.fillStyle = dark ? '#474747' : '#727272';
      ctx.fillRect(bx + 3, by + 3, 58, 58);
      // Top / left highlight
      ctx.fillStyle = dark ? '#5e5e5e' : '#989898';
      ctx.fillRect(bx + 3, by + 3, 58, 5);
      ctx.fillRect(bx + 3, by + 3, 5, 58);
      // Bottom / right shadow
      ctx.fillStyle = dark ? '#282828' : '#3e3e3e';
      ctx.fillRect(bx + 3, by + 56, 58, 5);
      ctx.fillRect(bx + 56, by + 3, 5, 58);
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeWoodTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const ctx = cv.getContext('2d')!;

  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#3a1c06' : '#2c1404';
    ctx.fillRect(0, i * 16, 128, 16);
    // Plank divider
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, i * 16 + 14, 128, 2);
    // Subtle wood grain
    ctx.fillStyle = 'rgba(80,30,0,0.2)';
    ctx.fillRect(0, i * 16 + 7, 128, 1);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeDoorTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const ctx = cv.getContext('2d')!;

  // Stone surround
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, 128, 128);
  // Outer door frame
  ctx.fillStyle = '#4e2310';
  ctx.fillRect(14, 0, 100, 128);
  // Door face
  ctx.fillStyle = '#7a3f2b';
  ctx.fillRect(20, 0, 88, 128);
  // Vertical plank grain lines
  ctx.strokeStyle = '#5a2a1a';
  ctx.lineWidth = 2.5;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(20 + i * 14, 0);
    ctx.lineTo(20 + i * 14, 128);
    ctx.stroke();
  }
  // Iron ring handle
  ctx.strokeStyle = '#c9b37a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(36, 68, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#c9b37a';
  ctx.beginPath();
  ctx.arc(36, 68, 3.5, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(cv);
}

// ─── Enemy billboard texture ──────────────────────────────────────────────────

const CANVAS_W = 220;
const CANVAS_H = 300;
const ART_H    = 210; // pixels reserved for monster art

/**
 * Draws a 220×300 canvas texture for an enemy billboard.
 * Immediately shows a placeholder, then redraws with the full SVG monster art
 * once the async image load completes (texture.needsUpdate is set).
 */
function makeEnemyTexture(enemy: MonsterInstance): THREE.CanvasTexture {
  const cv  = document.createElement('canvas');
  cv.width  = CANVAS_W;
  cv.height = CANVAS_H;
  const ctx = cv.getContext('2d')!;

  function drawBase() {
    // Background
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Colored border
    const borderColor = enemy.status === 'dead' ? '#555' : enemy.color;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
  }

  function drawStats() {
    const isDead = enemy.status === 'dead';

    // Name
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isDead ? '#555' : enemy.color;
    ctx.fillText(enemy.name, CANVAS_W / 2, ART_H + 6, CANVAS_W - 12);

    if (!isDead) {
      // HP bar background
      const barX = 10, barY = ART_H + 32, barW = CANVAS_W - 20, barH = 14;
      ctx.fillStyle = '#1a0a0a';
      ctx.fillRect(barX, barY, barW, barH);

      // HP fill
      const pct = enemy.maxHp > 0 ? enemy.currentHp / enemy.maxHp : 0;
      ctx.fillStyle = pct > 0.6 ? '#22cc44' : pct > 0.3 ? '#ccaa00' : '#cc2222';
      ctx.fillRect(barX, barY, Math.floor(barW * pct), barH);

      // HP text
      ctx.font = '13px monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText(`${enemy.currentHp} / ${enemy.maxHp}`, CANVAS_W / 2, ART_H + 52);
    } else {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#555';
      ctx.textAlign = 'center';
      ctx.fillText('[DEAD]', CANVAS_W / 2, ART_H + 34);
    }
  }

  // Immediate placeholder: coloured glow so billboard is visible right away
  drawBase();
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.ellipse(CANVAS_W / 2, ART_H / 2, 60, 80, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawStats();

  const texture = new THREE.CanvasTexture(cv);

  // Async: paint the real monster SVG art into the art area
  const svgStr = getMonsterSvg(enemy.definitionId, enemy.status === 'dead' ? '#555555' : enemy.color, ART_H);
  const blob   = new Blob([svgStr], { type: 'image/svg+xml' });
  const url    = URL.createObjectURL(blob);
  const img    = new Image();
  img.onload = () => {
    drawBase();
    // Centre the square SVG art in the art area
    const pad = 10;
    const side = ART_H - pad * 2;
    const offX = (CANVAS_W - side) / 2;
    ctx.drawImage(img, offX, pad, side, side);
    drawStats();
    URL.revokeObjectURL(url);
    texture.needsUpdate = true;
  };
  img.src = url;

  return texture;
}
