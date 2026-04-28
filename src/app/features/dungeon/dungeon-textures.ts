/**
 * dungeon-textures.ts
 *
 * Procedural Canvas-based texture factories for dungeon surfaces and enemy billboards.
 * All functions are stateless — no Three.js scene or component dependencies.
 */

import * as THREE from 'three';
import { MonsterInstance } from '../../core/models/monster.model';
import { getMonsterSvg } from '../combat/monster-sprite.component';

export function makeStoneTexture(dark: boolean): THREE.CanvasTexture {
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

export function makeWoodTexture(): THREE.CanvasTexture {
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

export function makeDoorTexture(): THREE.CanvasTexture {
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
export function makeEnemyTexture(enemy: MonsterInstance): THREE.CanvasTexture {
  const cv  = document.createElement('canvas');
  cv.width  = CANVAS_W;
  cv.height = CANVAS_H;
  const ctx = cv.getContext('2d')!;

  function drawBase() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const borderColor = enemy.status === 'dead' ? '#555' : enemy.color;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
  }

  function drawStats() {
    const isDead = enemy.status === 'dead';

    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isDead ? '#555' : enemy.color;
    ctx.fillText(enemy.name, CANVAS_W / 2, ART_H + 6, CANVAS_W - 12);

    if (!isDead) {
      const barX = 10, barY = ART_H + 32, barW = CANVAS_W - 20, barH = 14;
      ctx.fillStyle = '#1a0a0a';
      ctx.fillRect(barX, barY, barW, barH);

      const pct = enemy.maxHp > 0 ? enemy.currentHp / enemy.maxHp : 0;
      ctx.fillStyle = pct > 0.6 ? '#22cc44' : pct > 0.3 ? '#ccaa00' : '#cc2222';
      ctx.fillRect(barX, barY, Math.floor(barW * pct), barH);

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
