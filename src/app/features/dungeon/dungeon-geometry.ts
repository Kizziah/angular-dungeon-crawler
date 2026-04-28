/**
 * dungeon-geometry.ts
 *
 * Procedural Three.js mesh factories for dungeon tile geometry.
 * All functions are stateless — they receive materials and return Groups.
 */

import * as THREE from 'three';

/**
 * Builds a 3-D staircase mesh for a dungeon stair tile (1×1 world unit).
 *
 * Geometry:
 *   • 5 stone steps rising toward -Z (north wall of the tile)
 *   • Two stone pillars + lintel forming an arch at the top
 *   • A glowing portal plane inside the arch
 *     – stairs-up   → blue glow  (leads to previous / shallower floor)
 *     – stairs-down → orange/red glow  (leads to deeper floor)
 *
 * The Group is centered at (0,0,0) so the caller positions it at the tile's
 * world centre (wx, 0, wz).
 */
export function buildStairsMesh(
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

  // ── Steps ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < STEPS; i++) {
    const riser = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), stepMat);
    riser.position.set(0, i * stepH + stepH * 0.5, startZ + i * stepD);
    riser.castShadow = riser.receiveShadow = true;
    g.add(riser);

    const tread = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.025, stepD + 0.01), stepMat);
    tread.position.set(0, (i + 1) * stepH, startZ + i * stepD);
    tread.castShadow = tread.receiveShadow = true;
    g.add(tread);
  }

  // ── Arch at the top of the staircase ──────────────────────────────────────
  const archZ   = startZ + STEPS * stepD;
  const archH   = 0.85;
  const pillarW = 0.075;

  for (const sx of [-stepW * 0.5 - pillarW * 0.5, stepW * 0.5 + pillarW * 0.5]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(pillarW, archH, pillarW), stoneMat);
    pillar.position.set(sx, archH * 0.5, archZ);
    pillar.castShadow = true;
    g.add(pillar);
  }

  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(stepW + pillarW * 2 + 0.02, 0.075, pillarW),
    stoneMat,
  );
  lintel.position.set(0, archH + 0.037, archZ);
  lintel.castShadow = true;
  g.add(lintel);

  // ── Glowing portal inside the arch ────────────────────────────────────────
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
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(stepW, archH), glowMat);
  portal.position.set(0, archH * 0.5, archZ + 0.01);
  g.add(portal);

  const light = new THREE.PointLight(glowColor, 1.8, 3.5, 1.8);
  light.position.set(0, archH * 0.55, archZ);
  g.add(light);

  // ── Direction arrow painted on the floor ──────────────────────────────────
  const arrowVerts = new Float32Array([
    0, 0.002,  0.10,
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
  g.add(new THREE.Mesh(arrowGeo, arrowMat));

  return g;
}
