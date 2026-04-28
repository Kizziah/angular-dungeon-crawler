import * as THREE from 'three';

interface SpellConfig {
  color: number;
  colorAlt: number;
  spread: number;
  speed: number;
  count: number;
  life: number;
  size: number;
  floatUp: boolean;      // heal-like: particles rise instead of flying forward
  torchColor: number;
}

const CONFIGS: Record<string, SpellConfig> = {
  fire:      { color: 0xff3300, colorAlt: 0xff9900, spread: 0.50, speed: 4.5, count: 70, life: 0.70, size: 0.10, floatUp: false, torchColor: 0xff2200 },
  ice:       { color: 0x44aaff, colorAlt: 0xbbddff, spread: 0.30, speed: 3.5, count: 60, life: 0.85, size: 0.08, floatUp: false, torchColor: 0x2266ff },
  lightning: { color: 0xffee22, colorAlt: 0xffffff, spread: 0.12, speed: 8.0, count: 55, life: 0.40, size: 0.09, floatUp: false, torchColor: 0xffff88 },
  heal:      { color: 0x22ffcc, colorAlt: 0x44aaff, spread: 0.90, speed: 1.8, count: 65, life: 1.00, size: 0.08, floatUp: true,  torchColor: 0x22ccff },
  holy:      { color: 0xffffaa, colorAlt: 0xffffff, spread: 0.80, speed: 2.5, count: 60, life: 0.85, size: 0.09, floatUp: false, torchColor: 0xffffcc },
  arcane:    { color: 0xaa22ff, colorAlt: 0x5544ff, spread: 0.25, speed: 5.0, count: 55, life: 0.65, size: 0.08, floatUp: false, torchColor: 0x8822ff },
};

// Maps both spell IDs and spell names to a visual type key
const SPELL_TYPE_MAP: Record<string, string> = {
  // by ID
  'fireball': 'fire', 'sword-of-fire': 'fire', 'smite': 'fire',
  'ice-storm': 'ice', 'blade-of-ice': 'ice',
  'lightning': 'lightning',
  'heal': 'heal', 'mass-heal': 'heal', 'cure-poison': 'heal',
  'holy-light': 'holy', 'bless': 'holy', 'protection': 'holy',
  'resurrect': 'holy', 'turn-undead': 'holy',
  'magic-missile': 'arcane', 'sleep': 'arcane', 'charm': 'arcane',
  'web': 'arcane', 'detect-magic': 'arcane', 'identify': 'arcane', 'teleport': 'arcane',
  // by display name (from action-menu)
  'Fireball': 'fire', 'Smite': 'fire',
  'Ice Storm': 'ice',
  'Lightning Bolt': 'lightning',
  'Heal': 'heal', 'Mass Heal': 'heal', 'Cure Poison': 'heal',
  'Holy Light': 'holy', 'Bless': 'holy', 'Protection': 'holy',
  'Resurrect': 'holy', 'Turn Undead': 'holy',
  'Magic Missile': 'arcane', 'Sleep': 'arcane', 'Charm': 'arcane',
  'Web': 'arcane', 'Detect Magic': 'arcane', 'Identify': 'arcane', 'Teleport': 'arcane',
};

const MAX_PARTICLES = 120;

interface Particle {
  active: boolean;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
  maxLife: number;
  r: number; g: number; b: number;
  r2: number; g2: number; b2: number;
}

export class SpellParticleSystem {
  private geometry!: THREE.BufferGeometry;
  private positions!: Float32Array;
  private colors!: Float32Array;
  private points!: THREE.Points;
  private particles: Particle[] = [];

  /** Active flash: call site reads this to tint the torch. */
  flash: { r: number; g: number; b: number; time: number; duration: number } | null = null;

  constructor(private scene: THREE.Scene) {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors    = new Float32Array(MAX_PARTICLES * 3);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.positions[i * 3 + 1] = -100; // hide off-screen
      this.particles.push({
        active: false, x: 0, y: -100, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1,
        r: 1, g: 1, b: 1, r2: 1, g2: 1, b2: 1,
      });
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color',    new THREE.BufferAttribute(this.colors,    3));

    const mat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // additive so overlapping particles glow
    });

    this.points = new THREE.Points(this.geometry, mat);
    this.points.renderOrder = 15;
    this.scene.add(this.points);
  }

  /** Spawn a spell burst from (fx,fy,fz) aimed toward (tx,ty,tz). */
  trigger(spellId: string, fx: number, fy: number, fz: number, tx: number, ty: number, tz: number): void {
    const key = SPELL_TYPE_MAP[spellId] ?? 'arcane';
    const cfg = CONFIGS[key];

    const dx = tx - fx, dy = ty - fy, dz = tz - fz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const ndx = dx / len, ndy = dy / len, ndz = dz / len;

    // Set torch flash
    const fc = new THREE.Color(cfg.torchColor);
    this.flash = { r: fc.r, g: fc.g, b: fc.b, time: 0, duration: 0.75 };

    const c1 = new THREE.Color(cfg.color);
    const c2 = new THREE.Color(cfg.colorAlt);

    let spawned = 0;
    for (let i = 0; i < MAX_PARTICLES && spawned < cfg.count; i++) {
      const p = this.particles[i];
      if (p.active) continue;
      spawned++;

      const spd = cfg.speed * (0.65 + Math.random() * 0.70);
      let pvx: number, pvy: number, pvz: number;

      if (cfg.floatUp) {
        // Heal: burst upward + radially outward
        const angle = Math.random() * Math.PI * 2;
        const radius = (0.3 + Math.random() * 0.7) * cfg.spread;
        pvx = Math.cos(angle) * radius * spd;
        pvy = (0.5 + Math.random() * 1.0) * spd;
        pvz = Math.sin(angle) * radius * spd;
      } else {
        // Offensive: fly toward enemy with cone spread
        pvx = (ndx + (Math.random() - 0.5) * cfg.spread) * spd;
        pvy = (ndy + (Math.random() - 0.5) * cfg.spread * 0.6) * spd;
        pvz = (ndz + (Math.random() - 0.5) * cfg.spread) * spd;
      }

      p.active  = true;
      p.x       = fx + (Math.random() - 0.5) * 0.10;
      p.y       = fy + (Math.random() - 0.5) * 0.10;
      p.z       = fz + (Math.random() - 0.5) * 0.10;
      p.vx      = pvx; p.vy = pvy; p.vz = pvz;
      p.life    = cfg.life * (0.55 + Math.random() * 0.90);
      p.maxLife = p.life;
      p.r  = c1.r; p.g  = c1.g; p.b  = c1.b;
      p.r2 = c2.r; p.g2 = c2.g; p.b2 = c2.b;
    }
  }

  update(delta: number): void {
    let anyActive = false;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p   = this.particles[i];
      const idx = i * 3;

      if (!p.active) {
        this.positions[idx + 1] = -100;
        continue;
      }
      anyActive = true;

      p.life -= delta;
      if (p.life <= 0) {
        p.active = false;
        this.positions[idx + 1] = -100;
        this.colors[idx] = 0; this.colors[idx + 1] = 0; this.colors[idx + 2] = 0;
        continue;
      }

      // Gentle drag
      p.vx *= 0.97; p.vy *= 0.97; p.vz *= 0.97;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      // Fade: bright at start, dims toward end; mix primary↔alt for flicker
      const t   = p.life / p.maxLife; // 1 → 0
      const mix = Math.sin(t * Math.PI); // peaks mid-life
      const r   = Math.min(p.r * t + p.r2 * mix * 0.5, 1);
      const g   = Math.min(p.g * t + p.g2 * mix * 0.5, 1);
      const b   = Math.min(p.b * t + p.b2 * mix * 0.5, 1);

      this.positions[idx]     = p.x;
      this.positions[idx + 1] = p.y;
      this.positions[idx + 2] = p.z;
      this.colors[idx]        = r;
      this.colors[idx + 1]    = g;
      this.colors[idx + 2]    = b;
    }

    if (this.flash) {
      this.flash.time += delta;
      if (this.flash.time >= this.flash.duration) this.flash = null;
    }

    if (anyActive) {
      (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (this.geometry.getAttribute('color')    as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
