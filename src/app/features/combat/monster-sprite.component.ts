import { Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

// ── color helpers ─────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const f = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  return [parseInt(f.slice(0,2),16), parseInt(f.slice(2,4),16), parseInt(f.slice(4,6),16)];
}
function shade(hex: string, amt: number): string {
  const [r,g,b] = hexToRgb(hex);
  const cl = (v: number) => Math.min(255, Math.max(0, v + amt));
  return `rgb(${cl(r)},${cl(g)},${cl(b)})`;
}

// ── palette constants ─────────────────────────────────────────────────────────
const K = '#0a0a0a';   // outline
const R = '#dd3333';   // red / eyes
const Y = '#ddaa00';   // gold
const W = '#eeeeee';   // white
const B = '#c8a870';   // bone

type SvgFn = (p: string) => string;

// ── per-archetype SVG draw functions (viewBox 0 0 64 64) ──────────────────────
const DRAW_FNS: Record<string, SvgFn> = {

  rat: p => { const dk = shade(p,-60);
    return `
      <ellipse cx="37" cy="42" rx="20" ry="12" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="17" cy="36" rx="12" ry="11" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="10" cy="23" rx="5" ry="6" fill="${p}" stroke="${K}" stroke-width="1"/>
      <ellipse cx="22" cy="22" rx="5" ry="6" fill="${p}" stroke="${K}" stroke-width="1"/>
      <circle  cx="11" cy="35" r="3" fill="${R}"/>
      <ellipse cx="7"  cy="40" rx="5" ry="3.5" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <path d="M57 40 Q65 30 60 18" stroke="${dk}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <line x1="22" y1="52" x2="16" y2="63" stroke="${p}" stroke-width="4" stroke-linecap="round"/>
      <line x1="32" y1="53" x2="29" y2="63" stroke="${p}" stroke-width="4" stroke-linecap="round"/>
      <line x1="43" y1="53" x2="44" y2="63" stroke="${p}" stroke-width="4" stroke-linecap="round"/>
      <line x1="52" y1="52" x2="55" y2="62" stroke="${p}" stroke-width="4" stroke-linecap="round"/>`;
  },

  goblin: p => { const dk = shade(p,-50); const li = shade(p,60);
    return `
      <polygon points="22,6 17,20 27,20" fill="${p}" stroke="${K}" stroke-width="1"/>
      <polygon points="42,6 37,20 47,20" fill="${p}" stroke="${K}" stroke-width="1"/>
      <ellipse cx="32" cy="23" rx="13" ry="12" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <circle cx="27" cy="21" r="4" fill="${R}"/><circle cx="27" cy="21" r="1.5" fill="${K}"/>
      <circle cx="37" cy="21" r="4" fill="${R}"/><circle cx="37" cy="21" r="1.5" fill="${K}"/>
      <path d="M27,29 Q32,34 37,29" stroke="${K}" stroke-width="1.5" fill="none"/>
      <rect x="22" y="34" width="20" height="18" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="10" y="33" width="12" height="14" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="42" y="33" width="12" height="14" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="22" y="50" width="9"  height="14" rx="3" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <rect x="33" y="50" width="9"  height="14" rx="3" fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
  },

  skeleton: _ => `
      <ellipse cx="32" cy="11" rx="11" ry="12" fill="${B}" stroke="${K}" stroke-width="1.5"/>
      <rect x="27" y="13" width="5" height="5" rx="1" fill="${K}"/>
      <rect x="34" y="13" width="5" height="5" rx="1" fill="${K}"/>
      <rect x="30" y="22" width="3" height="8" fill="${B}" stroke="${K}" stroke-width="1"/>
      <path d="M33,26 Q20,23 18,30" stroke="${B}" stroke-width="2.5" fill="none"/>
      <path d="M33,30 Q19,28 17,35" stroke="${B}" stroke-width="2.5" fill="none"/>
      <path d="M31,26 Q44,23 46,30" stroke="${B}" stroke-width="2.5" fill="none"/>
      <path d="M31,30 Q45,28 47,35" stroke="${B}" stroke-width="2.5" fill="none"/>
      <path d="M21,36 Q32,42 43,36" fill="${B}" stroke="${K}" stroke-width="1.5"/>
      <line x1="25" y1="21" x2="11" y2="37" stroke="${B}" stroke-width="5" stroke-linecap="round"/>
      <line x1="39" y1="21" x2="53" y2="37" stroke="${B}" stroke-width="5" stroke-linecap="round"/>
      <line x1="26" y1="40" x2="22" y2="58" stroke="${B}" stroke-width="5" stroke-linecap="round"/>
      <line x1="38" y1="40" x2="42" y2="58" stroke="${B}" stroke-width="5" stroke-linecap="round"/>
      <line x1="22" y1="58" x2="18" y2="64" stroke="${B}" stroke-width="4" stroke-linecap="round"/>
      <line x1="42" y1="58" x2="46" y2="64" stroke="${B}" stroke-width="4" stroke-linecap="round"/>`,

  orc: p => { const dk = shade(p,-50);
    return `
      <ellipse cx="32" cy="16" rx="16" ry="15" fill="${p}" stroke="${K}" stroke-width="2"/>
      <circle  cx="25" cy="14" r="4" fill="${R}"/><circle cx="25" cy="14" r="2" fill="${K}"/>
      <circle  cx="39" cy="14" r="4" fill="${R}"/><circle cx="39" cy="14" r="2" fill="${K}"/>
      <path d="M25,22 Q32,26 39,22" stroke="${K}" stroke-width="1.5" fill="none"/>
      <polygon points="26,26 24,34 28,34" fill="${Y}" stroke="${K}" stroke-width="1"/>
      <polygon points="38,26 36,34 40,34" fill="${Y}" stroke="${K}" stroke-width="1"/>
      <rect x="14" y="30" width="36" height="22" rx="3" fill="${p}" stroke="${K}" stroke-width="2"/>
      <rect x="2"  y="29" width="12" height="22" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="50" y="29" width="12" height="22" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="15" y="50" width="13" height="14" rx="3" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <rect x="36" y="50" width="13" height="14" rx="3" fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
  },

  zombie: p => { const dk = shade(p,-50);
    return `
      <ellipse cx="32" cy="13" rx="12" ry="11" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="28" y="11" width="4" height="4" rx="1" fill="${dk}"/>
      <rect x="36" y="11" width="4" height="4" rx="1" fill="${dk}"/>
      <path d="M27,20 Q32,18 37,20" stroke="${K}" stroke-width="1.5" fill="none"/>
      <rect x="22" y="23" width="20" height="22" rx="2" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <line x1="22" y1="27" x2="2"  y2="22" stroke="${p}" stroke-width="8"  stroke-linecap="round"/>
      <line x1="42" y1="27" x2="62" y2="22" stroke="${p}" stroke-width="8"  stroke-linecap="round"/>
      <line x1="22" y1="27" x2="2"  y2="22" stroke="${K}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <line x1="42" y1="27" x2="62" y2="22" stroke="${K}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <rect x="22" y="44" width="9"  height="18" rx="2" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <rect x="33" y="44" width="9"  height="18" rx="2" fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
  },

  spider: p => { const dk = shade(p,-50);
    return `
      <ellipse cx="32" cy="34" rx="16" ry="14" fill="${p}"  stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="32" cy="22" rx="11" ry="10" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <circle  cx="27" cy="20" r="3" fill="${R}"/>
      <circle  cx="32" cy="19" r="3" fill="${R}"/>
      <circle  cx="37" cy="20" r="3" fill="${R}"/>
      <line x1="18" y1="26" x2="2"  y2="16" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="32" x2="2"  y2="28" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="38" x2="2"  y2="40" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="18" y1="44" x2="4"  y2="52" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="46" y1="26" x2="62" y2="16" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="48" y1="32" x2="62" y2="28" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="48" y1="38" x2="62" y2="40" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="46" y1="44" x2="60" y2="52" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="29" y1="30" x2="27" y2="35" stroke="${Y}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="35" y1="30" x2="37" y2="35" stroke="${Y}" stroke-width="2.5" stroke-linecap="round"/>`;
  },

  wolf: p => { const dk = shade(p,-50);
    return `
      <ellipse cx="35" cy="36" rx="20" ry="13" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="16" cy="28" rx="12" ry="11" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <polygon points="10,18 6,6  16,16" fill="${p}" stroke="${K}" stroke-width="1"/>
      <polygon points="20,17 22,5 28,16" fill="${p}" stroke="${K}" stroke-width="1"/>
      <circle  cx="12" cy="27" r="3" fill="${R}"/>
      <ellipse cx="9"  cy="33" rx="5" ry="4" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <path d="M54 32 Q62 24 60 16 Q58 14 56 16 Q58 22 52 30" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <line x1="20" y1="47" x2="16" y2="60" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
      <line x1="30" y1="48" x2="28" y2="60" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
      <line x1="41" y1="48" x2="42" y2="60" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
      <line x1="51" y1="47" x2="54" y2="60" stroke="${p}" stroke-width="6" stroke-linecap="round"/>`;
  },

  bat: p => { const dk = shade(p,-60);
    return `
      <path d="M32,20 Q12,10 2,22 Q8,34 18,30 Q22,36 32,36 Q42,36 46,30 Q56,34 62,22 Q52,10 32,20 Z"
            fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="32" cy="32" rx="10" ry="11" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <polygon points="28,4  24,16 32,14" fill="${p}" stroke="${K}" stroke-width="1"/>
      <polygon points="36,4  40,16 32,14" fill="${p}" stroke="${K}" stroke-width="1"/>
      <circle  cx="28" cy="30" r="3" fill="${R}"/>
      <circle  cx="36" cy="30" r="3" fill="${R}"/>
      <path d="M28,38 Q32,42 36,38" stroke="${K}" stroke-width="1.5" fill="none"/>
      <line x1="30" y1="42" x2="28" y2="50" stroke="${dk}" stroke-width="2" stroke-linecap="round"/>
      <line x1="34" y1="42" x2="36" y2="50" stroke="${dk}" stroke-width="2" stroke-linecap="round"/>`;
  },

  ghost: p => { const li = shade(p,80);
    return `
      <ellipse cx="32" cy="24" rx="18" ry="20" fill="${li}" stroke="${K}" stroke-width="1.5"/>
      <rect x="14" y="24" width="36" height="22" fill="${li}"/>
      <path d="M14,46 Q18,54 22,46 Q26,54 30,46 Q34,54 38,46 Q42,54 46,46 L50,46 L50,24 L14,24 Z"
            fill="${li}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="26" cy="22" rx="5" ry="6" fill="${K}"/>
      <ellipse cx="38" cy="22" rx="5" ry="6" fill="${K}"/>
      <line x1="14" y1="24" x2="50" y2="24" stroke="${K}" stroke-width="1.5"/>`;
  },

  lizardman: p => { const dk = shade(p,-50);
    return `
      <path d="M46,22 Q54,24 58,32 Q54,36 48,30" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <ellipse cx="28" cy="16" rx="13" ry="13" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <circle  cx="22" cy="14" r="3.5" fill="${R}"/><circle cx="22" cy="14" r="1.5" fill="${K}"/>
      <path d="M22,22 Q28,26 34,22" stroke="${K}" stroke-width="1.5" fill="none"/>
      <rect x="18" y="28" width="22" height="22" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="6"  y="30" width="12" height="14" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="40" y="30" width="12" height="14" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <path d="M36,34 Q48,40 58,52 Q55,55 52,52 Q44,42 36,38" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <rect x="18" y="48" width="9"  height="14" rx="3" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <rect x="31" y="48" width="9"  height="14" rx="3" fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
  },

  large: p => { const dk = shade(p,-50);
    return `
      <ellipse cx="32" cy="16" rx="18" ry="16" fill="${p}" stroke="${K}" stroke-width="2"/>
      <circle  cx="24" cy="14" r="5" fill="${R}"/><circle cx="24" cy="14" r="2" fill="${K}"/>
      <circle  cx="40" cy="14" r="5" fill="${R}"/><circle cx="40" cy="14" r="2" fill="${K}"/>
      <path d="M22,23 Q32,30 42,23" stroke="${K}" stroke-width="2" fill="none"/>
      <rect x="8"  y="30" width="48" height="26" rx="4" fill="${p}" stroke="${K}" stroke-width="2"/>
      <rect x="0"  y="29" width="10" height="26" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="54" y="29" width="10" height="26" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="11" y="54" width="16" height="10" rx="3" fill="${dk}" stroke="${K}" stroke-width="2"/>
      <rect x="37" y="54" width="16" height="10" rx="3" fill="${dk}" stroke="${K}" stroke-width="2"/>`;
  },

  medusa: p => { const dk = shade(p,-40);
    return `
      <path d="M10,8 Q8,4  13,6  Q11,2  16,5  Q18,1  20,6  Q24,2  24,7  Q28,3  28,8
               Q36,3  36,8  Q40,2  40,7  Q44,1  44,6  Q49,2  48,5  Q53,4  51,8
               Q54,4  55,8  Q48,8  44,12 Q36,10 32,12 Q28,10 20,12 Q16,8 10,8 Z"
            fill="${shade(p,-20)}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="32" cy="22" rx="13" ry="12" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="26" cy="20" rx="4" ry="4" fill="${Y}"/><circle cx="26" cy="20" r="2" fill="${K}"/>
      <ellipse cx="38" cy="20" rx="4" ry="4" fill="${Y}"/><circle cx="38" cy="20" r="2" fill="${K}"/>
      <path d="M26,28 Q32,32 38,28" stroke="${K}" stroke-width="1.5" fill="none"/>
      <rect x="22" y="33" width="20" height="18" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <path d="M32,50 Q22,56 18,64 Q24,66 28,60 Q32,56 36,60 Q40,66 46,64 Q42,56 32,50 Z"
            fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
  },

  harpy: p => { const dk = shade(p,-50);
    return `
      <path d="M32,18 Q10,8 2,24 Q8,30 20,26 Q24,32 32,32 Z"
            fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <path d="M32,18 Q54,8 62,24 Q56,30 44,26 Q40,32 32,32 Z"
            fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="32" cy="12" rx="11" ry="10" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <circle  cx="28" cy="10" r="3" fill="${R}"/>
      <circle  cx="36" cy="10" r="3" fill="${R}"/>
      <rect x="25" y="30" width="14" height="20" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="25" y="48" width="6"  height="14" rx="2" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <rect x="33" y="48" width="6"  height="14" rx="2" fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
  },

  vampire: p => { const dk = shade(p,-50);
    return `
      <ellipse cx="32" cy="12" rx="11" ry="11" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <circle  cx="27" cy="10" r="3" fill="${R}"/>
      <circle  cx="37" cy="10" r="3" fill="${R}"/>
      <line x1="30" y1="17" x2="28" y2="22" stroke="${W}" stroke-width="2" stroke-linecap="round"/>
      <line x1="34" y1="17" x2="36" y2="22" stroke="${W}" stroke-width="2" stroke-linecap="round"/>
      <rect x="26" y="22" width="12" height="2" rx="1" fill="${Y}"/>
      <path d="M14,24 Q20,22 32,23 Q44,22 50,24
               L58,64 Q50,60 42,58 Q36,62 32,60 Q28,62 22,58 Q14,60 6,64 Z"
            fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <line x1="32" y1="23" x2="32" y2="60" stroke="${dk}" stroke-width="1"/>`;
  },

  golem: _ => `
      <rect x="18" y="2"  width="28" height="24" rx="2" fill="${shade('#888888',0)}" stroke="${K}" stroke-width="2"/>
      <rect x="22" y="12" width="6"  height="5"  rx="1" fill="${K}"/>
      <rect x="36" y="12" width="6"  height="5"  rx="1" fill="${K}"/>
      <path d="M22,20 L42,20" stroke="${K}" stroke-width="2"/>
      <rect x="12" y="26" width="40" height="26" rx="2" fill="${shade('#888888',-20)}" stroke="${K}" stroke-width="2"/>
      <rect x="4"  y="24" width="10" height="26" rx="2" fill="${shade('#888888',-10)}" stroke="${K}" stroke-width="1.5"/>
      <rect x="50" y="24" width="10" height="26" rx="2" fill="${shade('#888888',-10)}" stroke="${K}" stroke-width="1.5"/>
      <rect x="14" y="50" width="14" height="14" rx="2" fill="${shade('#888888',-30)}" stroke="${K}" stroke-width="2"/>
      <rect x="36" y="50" width="14" height="14" rx="2" fill="${shade('#888888',-30)}" stroke="${K}" stroke-width="2"/>`,

  beast: p => { const dk = shade(p,-50);
    return `
      <path d="M2,28 Q4,16 18,18 Q16,24 10,26 Q18,22 24,24" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="14" cy="28" rx="13" ry="12" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <circle  cx="8"  cy="24" r="4" fill="${R}"/><circle cx="8" cy="24" r="2" fill="${K}"/>
      <path d="M6,32 Q14,36 22,32" stroke="${K}" stroke-width="1.5" fill="none"/>
      <ellipse cx="38" cy="38" rx="20" ry="14" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <path d="M54,32 Q64,26 62,16 Q59,14 58,16 Q60,24 54,34" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <line x1="18" y1="50" x2="14" y2="62" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
      <line x1="28" y1="51" x2="26" y2="62" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
      <line x1="42" y1="51" x2="42" y2="62" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
      <line x1="52" y1="50" x2="54" y2="62" stroke="${p}" stroke-width="6" stroke-linecap="round"/>`;
  },

  demon: p => { const dk = shade(p,-50);
    return `
      <polygon points="22,2 18,16 26,14" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <polygon points="42,2 38,14 46,16" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <ellipse cx="32" cy="18" rx="13" ry="12" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="26" cy="16" rx="4" ry="5" fill="${R}"/><circle cx="26" cy="16" r="2" fill="${K}"/>
      <ellipse cx="38" cy="16" rx="4" ry="5" fill="${R}"/><circle cx="38" cy="16" r="2" fill="${K}"/>
      <path d="M28,24 Q32,28 36,24" stroke="${K}" stroke-width="1.5" fill="none"/>
      <path d="M32,28 Q6,22 2,40 Q10,44 18,34 Q22,40 32,40 Z"
            fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <path d="M32,28 Q58,22 62,40 Q54,44 46,34 Q42,40 32,40 Z"
            fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <rect x="22" y="38" width="20" height="18" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="22" y="54" width="8"  height="10" rx="2" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <rect x="34" y="54" width="8"  height="10" rx="2" fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
  },

  dragon: p => { const dk = shade(p,-50); const li = shade(p,50);
    return `
      <path d="M4,12 Q2,4 10,6 Q14,8 16,18 Q12,16 4,12 Z"
            fill="${p}" stroke="${K}" stroke-width="1"/>
      <path d="M18,10 Q16,2 24,4 Q28,8 26,20 Q22,16 18,10 Z"
            fill="${p}" stroke="${K}" stroke-width="1"/>
      <path d="M10,14 Q24,8 36,14 Q44,20 44,36 Q38,42 26,40 Q12,40 8,30 Q4,22 10,14 Z"
            fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <path d="M4,24 Q0,18 4,14 Q10,18 12,28 Z" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <circle cx="16" cy="18" r="4" fill="${R}"/><circle cx="16" cy="18" r="2" fill="${K}"/>
      <path d="M4,28 Q2,26 6,24 Q10,30 8,32 Z" fill="${Y}"/>
      <path d="M36,20 Q56,10 62,20 Q56,30 44,26 Z" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <path d="M36,30 Q54,24 60,34 Q52,42 42,36 Z" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <path d="M30,38 Q40,44 52,60 Q46,62 40,56 Q36,52 30,54 Q26,62 20,58 Q24,44 30,38 Z"
            fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <line x1="16" y1="44" x2="12" y2="58" stroke="${p}" stroke-width="5" stroke-linecap="round"/>
      <line x1="26" y1="46" x2="24" y2="60" stroke="${p}" stroke-width="5" stroke-linecap="round"/>`;
  },

  lich: p => { const dk = shade(p,-60);
    return `
      <rect x="24" y="2" width="16" height="4" fill="${Y}" stroke="${K}" stroke-width="1"/>
      <polygon points="26,2 28,6 24,6" fill="${Y}" stroke="${K}" stroke-width="1"/>
      <polygon points="32,1 34,6 30,6" fill="${Y}" stroke="${K}" stroke-width="1"/>
      <polygon points="38,2 36,6 40,6" fill="${Y}" stroke="${K}" stroke-width="1"/>
      <ellipse cx="32" cy="14" rx="12" ry="12" fill="${B}" stroke="${K}" stroke-width="1.5"/>
      <rect x="26" y="12" width="5" height="6" rx="1" fill="${K}"/>
      <rect x="33" y="12" width="5" height="6" rx="1" fill="${K}"/>
      <path d="M26,22 Q32,20 38,22" stroke="${K}" stroke-width="1" fill="none"/>
      <path d="M14,26 Q20,24 32,25 Q44,24 50,26 L46,64 Q38,58 32,60 Q26,58 18,64 Z"
            fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <line x1="14" y1="26" x2="6"  y2="48" stroke="${B}" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="26" x2="58" y2="30" stroke="${B}" stroke-width="4" stroke-linecap="round"/>
      <line x1="58" y1="4"  x2="58" y2="48" stroke="${Y}" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="58" cy="6" rx="5" ry="5" fill="${p}" stroke="${Y}" stroke-width="1.5"/>`;
  },

  beholder: p => { const dk = shade(p,-50);
    return `
      <ellipse cx="32" cy="36" rx="22" ry="20" fill="${p}" stroke="${K}" stroke-width="2"/>
      <ellipse cx="32" cy="34" rx="14" ry="10" fill="${W}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="32" cy="34" rx="8"  rx2="8" ry="8" fill="${R}"/>
      <circle  cx="32" cy="34" r="5" fill="${K}"/>
      <circle  cx="30" cy="32" r="2" fill="${W}"/>
      <line x1="18" y1="18" x2="14" y2="8"  stroke="${p}" stroke-width="3" stroke-linecap="round"/>
      <line x1="26" y1="16" x2="24" y2="4"  stroke="${p}" stroke-width="3" stroke-linecap="round"/>
      <line x1="34" y1="16" x2="34" y2="2"  stroke="${p}" stroke-width="3" stroke-linecap="round"/>
      <line x1="42" y1="18" x2="46" y2="6"  stroke="${p}" stroke-width="3" stroke-linecap="round"/>
      <line x1="48" y1="24" x2="54" y2="14" stroke="${p}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="14" cy="8"  r="4" fill="${R}" stroke="${K}" stroke-width="1"/>
      <circle cx="24" cy="4"  r="4" fill="${R}" stroke="${K}" stroke-width="1"/>
      <circle cx="34" cy="2"  r="4" fill="${R}" stroke="${K}" stroke-width="1"/>
      <circle cx="46" cy="6"  r="4" fill="${R}" stroke="${K}" stroke-width="1"/>
      <circle cx="54" cy="14" r="4" fill="${R}" stroke="${K}" stroke-width="1"/>`;
  },

  elemental: p => { const li = shade(p,80); const dk = shade(p,-40);
    return `
      <ellipse cx="32" cy="52" rx="16" ry="8" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <path d="M20,52 Q16,38 20,26 Q22,14 32,8 Q42,14 44,26 Q48,38 44,52 Z"
            fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <path d="M26,48 Q22,38 28,26 Q30,16 32,12 Q34,16 36,26 Q42,38 38,48 Z"
            fill="${li}" stroke="none"/>
      <path d="M16,42 Q10,32 16,20 Q18,14 22,10 Q18,20 20,32 Q22,38 16,42 Z"
            fill="${li}" stroke="${K}" stroke-width="1" opacity="0.6"/>
      <path d="M48,42 Q54,32 48,20 Q46,14 42,10 Q46,20 44,32 Q42,38 48,42 Z"
            fill="${li}" stroke="${K}" stroke-width="1" opacity="0.6"/>
      <ellipse cx="32" cy="30" rx="6" ry="8" fill="${W}" opacity="0.4"/>`;
  },

  werewolf: p => { const dk = shade(p,-50);
    return `
      <polygon points="22,2 19,16 26,14" fill="${p}" stroke="${K}" stroke-width="1"/>
      <polygon points="34,1 40,14 46,16" fill="${p}" stroke="${K}" stroke-width="1"/>
      <ellipse cx="32" cy="16" rx="13" ry="13" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <ellipse cx="24" cy="20" rx="5" ry="3" fill="${dk}" stroke="${K}" stroke-width="1"/>
      <circle  cx="26" cy="13" r="4" fill="${R}"/><circle cx="26" cy="13" r="2" fill="${K}"/>
      <circle  cx="38" cy="13" r="4" fill="${R}"/><circle cx="38" cy="13" r="2" fill="${K}"/>
      <path d="M26,22 Q32,26 38,22" stroke="${K}" stroke-width="1.5" fill="none"/>
      <rect x="18" y="28" width="28" height="20" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="6"  y="26" width="14" height="18" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <rect x="44" y="26" width="14" height="18" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
      <path d="M6,40 Q2,46 4,50 L8,44 Z" fill="${K}"/>
      <path d="M54,40 Q62,46 60,50 L56,44 Z" fill="${K}"/>
      <rect x="20" y="46" width="10" height="16" rx="3" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
      <rect x="34" y="46" width="10" height="16" rx="3" fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
  },
};

DRAW_FNS['soldier'] = p => { const dk = shade(p,-50); const li = shade(p,60);
  return `
    <line x1="47" y1="4" x2="47" y2="48" stroke="#8b4513" stroke-width="2" stroke-linecap="round"/>
    <polygon points="47,4 43,12 51,12" fill="#aaaaaa"/>
    <ellipse cx="24" cy="42" rx="12" ry="15" fill="${R}" stroke="#8b0000" stroke-width="2"/>
    <circle cx="24" cy="42" r="3" fill="${Y}"/>
    <rect x="26" y="28" width="16" height="18" fill="${li}" stroke="${dk}" stroke-width="1.5" rx="2"/>
    <circle cx="34" cy="18" r="8" fill="#f1c27d" stroke="${K}" stroke-width="1.5"/>
    <path d="M26,18 Q34,6 42,18 Z" fill="${p}" stroke="${dk}" stroke-width="1.5"/>
    <rect x="30" y="8" width="8" height="6" fill="${R}"/>
    <circle cx="31" cy="18" r="1.5" fill="${K}"/>
    <circle cx="37" cy="18" r="1.5" fill="${K}"/>
    <line x1="26" y1="31" x2="18" y2="42" stroke="#f1c27d" stroke-width="4" stroke-linecap="round"/>
    <line x1="42" y1="31" x2="47" y2="40" stroke="#f1c27d" stroke-width="4" stroke-linecap="round"/>
    <line x1="31" y1="46" x2="28" y2="58" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>
    <line x1="37" y1="46" x2="40" y2="58" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>
    <rect x="24" y="58" width="7" height="3" fill="#654321" rx="1"/>
    <rect x="37" y="58" width="7" height="3" fill="#654321" rx="1"/>`;
};

DRAW_FNS['default'] = p => { const dk = shade(p,-50);
  return `
    <ellipse cx="32" cy="32" rx="20" ry="26" fill="${p}" stroke="${K}" stroke-width="2"/>
    <circle cx="25" cy="26" r="5" fill="${R}"/><circle cx="25" cy="26" r="2" fill="${K}"/>
    <circle cx="39" cy="26" r="5" fill="${R}"/><circle cx="39" cy="26" r="2" fill="${K}"/>
    <path d="M24,40 Q32,46 40,40" stroke="${K}" stroke-width="2" fill="none"/>`;
};

DRAW_FNS['slime'] = p => { const li = shade(p,60); const dk = shade(p,-40);
  return `
    <ellipse cx="32" cy="38" rx="22" ry="18" fill="${p}" stroke="${K}" stroke-width="2"/>
    <ellipse cx="32" cy="32" rx="18" ry="22" fill="${p}" stroke="${K}" stroke-width="2"/>
    <ellipse cx="22" cy="24" rx="6" ry="8" fill="${li}" stroke="${K}" stroke-width="1" opacity="0.5"/>
    <circle  cx="26" cy="31" r="5" fill="${W}"/><circle cx="26" cy="31" r="3" fill="${K}"/><circle cx="25" cy="30" r="1" fill="${W}"/>
    <circle  cx="38" cy="31" r="5" fill="${W}"/><circle cx="38" cy="31" r="3" fill="${K}"/><circle cx="37" cy="30" r="1" fill="${W}"/>
    <path d="M27,42 Q32,47 37,42" stroke="${K}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M14,34 Q10,24 16,18" stroke="${dk}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M50,34 Q54,24 48,18" stroke="${dk}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="32" cy="52" rx="18" ry="5" fill="${dk}" opacity="0.35"/>`;
};

DRAW_FNS['drakee'] = p => { const dk = shade(p,-50); const li = shade(p,50);
  return `
    <path d="M32,28 Q10,14 2,26 Q6,36 16,32 Q20,38 32,38 Z"
          fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <path d="M32,28 Q54,14 62,26 Q58,36 48,32 Q44,38 32,38 Z"
          fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <ellipse cx="32" cy="34" rx="11" ry="12" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <polygon points="27,22 24,14 30,22" fill="${dk}" stroke="${K}" stroke-width="1"/>
    <polygon points="37,22 40,14 34,22" fill="${dk}" stroke="${K}" stroke-width="1"/>
    <circle  cx="27" cy="32" r="4" fill="${W}"/><circle cx="27" cy="32" r="2.5" fill="${K}"/><circle cx="26" cy="31" r="1" fill="${W}"/>
    <circle  cx="37" cy="32" r="4" fill="${W}"/><circle cx="37" cy="32" r="2.5" fill="${K}"/><circle cx="36" cy="31" r="1" fill="${W}"/>
    <path d="M28,42 Q32,46 36,42" stroke="${K}" stroke-width="1.5" fill="none"/>
    <line x1="28" y1="46" x2="24" y2="56" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>
    <line x1="36" y1="46" x2="40" y2="56" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`;
};

DRAW_FNS['direwolf'] = p => { const dk = shade(p,-60); const li = shade(p,40);
  return `
    <ellipse cx="36" cy="38" rx="22" ry="16" fill="${p}" stroke="${K}" stroke-width="2"/>
    <ellipse cx="16" cy="28" rx="14" ry="14" fill="${p}" stroke="${K}" stroke-width="2"/>
    <polygon points="8,14 4,2 15,14" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <polygon points="20,13 24,2 30,14" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <circle  cx="11" cy="26" r="4" fill="${R}"/><circle cx="11" cy="26" r="2" fill="${K}"/>
    <ellipse cx="8"  cy="34" rx="6" ry="5" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
    <path d="M6,34 Q4,38 8,40" stroke="${K}" stroke-width="1.5" fill="none"/>
    <path d="M10,34 Q8,38 12,40" stroke="${K}" stroke-width="1.5" fill="none"/>
    <path d="M56,32 Q64,22 62,12 Q59,10 57,12 Q60,20 54,30" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
    <line x1="20" y1="52" x2="16" y2="64" stroke="${p}" stroke-width="7" stroke-linecap="round"/>
    <line x1="31" y1="53" x2="28" y2="64" stroke="${p}" stroke-width="7" stroke-linecap="round"/>
    <line x1="43" y1="53" x2="44" y2="64" stroke="${p}" stroke-width="7" stroke-linecap="round"/>
    <line x1="54" y1="52" x2="58" y2="64" stroke="${p}" stroke-width="7" stroke-linecap="round"/>`;
};

DRAW_FNS['bokoblin'] = p => { const dk = shade(p,-50); const li = shade(p,60);
  return `
    <ellipse cx="32" cy="18" rx="13" ry="13" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <ellipse cx="22" cy="12" rx="5" ry="6" fill="${p}" stroke="${K}" stroke-width="1"/>
    <ellipse cx="42" cy="12" rx="5" ry="6" fill="${p}" stroke="${K}" stroke-width="1"/>
    <circle  cx="27" cy="17" r="3.5" fill="${R}"/><circle cx="27" cy="17" r="2" fill="${K}"/>
    <circle  cx="37" cy="17" r="3.5" fill="${R}"/><circle cx="37" cy="17" r="2" fill="${K}"/>
    <ellipse cx="32" cy="23" rx="4" ry="3" fill="${dk}" stroke="${K}" stroke-width="1"/>
    <path d="M28,26 Q32,30 36,26" stroke="${K}" stroke-width="1.5" fill="none"/>
    <rect x="24" y="30" width="16" height="18" rx="3" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <rect x="12" y="29" width="12" height="13" rx="2" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <rect x="40" y="29" width="12" height="13" rx="2" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <line x1="52" y1="30" x2="52" y2="56" stroke="${dk}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="52" cy="28" rx="5" ry="4" fill="${B}" stroke="${K}" stroke-width="1"/>
    <rect x="24" y="46" width="7" height="14" rx="2" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
    <rect x="33" y="46" width="7" height="14" rx="2" fill="${dk}" stroke="${K}" stroke-width="1.5"/>`;
};

DRAW_FNS['darknut'] = p => { const dk = shade(p,-50); const li = shade(p,50);
  return `
    <ellipse cx="32" cy="11" rx="11" ry="10" fill="${li}" stroke="${K}" stroke-width="2"/>
    <rect    x="21" y="6" width="22" height="14" rx="2" fill="${dk}" stroke="${K}" stroke-width="2" opacity="0.7"/>
    <circle  cx="26" cy="12" r="2.5" fill="${R}"/>
    <circle  cx="38" cy="12" r="2.5" fill="${R}"/>
    <rect x="12" y="20" width="40" height="30" rx="3" fill="${dk}" stroke="${K}" stroke-width="2"/>
    <rect x="22" y="22" width="20" height="26" rx="2" fill="${li}" stroke="${dk}" stroke-width="1"/>
    <rect x="2"  y="19" width="12" height="26" rx="2" fill="${dk}" stroke="${K}" stroke-width="2"/>
    <rect x="50" y="19" width="12" height="26" rx="2" fill="${dk}" stroke="${K}" stroke-width="2"/>
    <rect x="2"  y="15" width="16" height="22" rx="4" fill="${p}" stroke="${K}" stroke-width="2"/>
    <circle cx="10" cy="24" r="4" fill="${Y}" stroke="${K}" stroke-width="1"/>
    <line x1="54" y1="2" x2="54" y2="34" stroke="${li}" stroke-width="3" stroke-linecap="round"/>
    <polygon points="54,2 51,10 57,10" fill="${li}" stroke="${K}" stroke-width="1"/>
    <rect x="14" y="48" width="16" height="16" rx="2" fill="${dk}" stroke="${K}" stroke-width="2"/>
    <rect x="34" y="48" width="16" height="16" rx="2" fill="${dk}" stroke="${K}" stroke-width="2"/>`;
};

DRAW_FNS['lynel'] = p => { const dk = shade(p,-50); const li = shade(p,40);
  return `
    <ellipse cx="36" cy="40" rx="22" ry="14" fill="${p}" stroke="${K}" stroke-width="2"/>
    <ellipse cx="16" cy="42" rx="8" ry="10" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
    <ellipse cx="52" cy="42" rx="8" ry="10" fill="${dk}" stroke="${K}" stroke-width="1.5"/>
    <line x1="20" y1="52" x2="16" y2="62" stroke="${p}" stroke-width="7" stroke-linecap="round"/>
    <line x1="30" y1="53" x2="28" y2="62" stroke="${p}" stroke-width="7" stroke-linecap="round"/>
    <line x1="42" y1="53" x2="42" y2="62" stroke="${p}" stroke-width="7" stroke-linecap="round"/>
    <line x1="52" y1="52" x2="54" y2="62" stroke="${p}" stroke-width="7" stroke-linecap="round"/>
    <rect x="24" y="16" width="20" height="26" rx="3" fill="${p}" stroke="${K}" stroke-width="2"/>
    <ellipse cx="34" cy="12" rx="12" ry="12" fill="${p}" stroke="${K}" stroke-width="2"/>
    <polygon points="28,2 25,12 31,10" fill="${dk}" stroke="${K}" stroke-width="1"/>
    <polygon points="40,2 43,12 37,10" fill="${dk}" stroke="${K}" stroke-width="1"/>
    <circle  cx="29" cy="11" r="3.5" fill="${R}"/><circle cx="29" cy="11" r="2" fill="${K}"/>
    <circle  cx="39" cy="11" r="3.5" fill="${R}"/><circle cx="39" cy="11" r="2" fill="${K}"/>
    <rect x="22" y="18" width="4" height="18" rx="1" fill="${li}" stroke="${K}" stroke-width="1"/>
    <line x1="46" y1="4" x2="54" y2="28" stroke="${li}" stroke-width="3" stroke-linecap="round"/>
    <polygon points="46,4 42,12 50,14" fill="${li}" stroke="${K}" stroke-width="1"/>`;
};

DRAW_FNS['mind-flayer'] = p => { const dk = shade(p,-50); const li = shade(p,60);
  return `
    <ellipse cx="32" cy="13" rx="13" ry="12" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <circle  cx="26" cy="11" r="4" fill="${Y}"/><circle cx="26" cy="11" r="2.5" fill="${K}"/><circle cx="25" cy="10" r="1" fill="${W}"/>
    <circle  cx="38" cy="11" r="4" fill="${Y}"/><circle cx="38" cy="11" r="2.5" fill="${K}"/><circle cx="37" cy="10" r="1" fill="${W}"/>
    <path d="M27,20 Q29,28 26,34" stroke="${p}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M31,21 Q30,30 28,36" stroke="${p}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M33,21 Q34,30 36,36" stroke="${p}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M37,20 Q39,28 38,34" stroke="${p}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M27,20 Q29,28 26,34" stroke="${dk}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M37,20 Q39,28 38,34" stroke="${dk}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M14,26 Q20,24 32,25 Q44,24 50,26 L46,64 Q38,58 32,60 Q26,58 18,64 Z"
          fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <line x1="14" y1="26" x2="4"  y2="46" stroke="${p}" stroke-width="5" stroke-linecap="round"/>
    <line x1="50" y1="26" x2="60" y2="46" stroke="${p}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="8"  cy="48" r="4" fill="${Y}" stroke="${K}" stroke-width="1"/>
    <circle cx="56" cy="48" r="4" fill="${Y}" stroke="${K}" stroke-width="1"/>`;
};

DRAW_FNS['wizzrobe'] = p => { const dk = shade(p,-50); const li = shade(p,70);
  return `
    <polygon points="32,2 20,22 44,22" fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <ellipse cx="32" cy="24" rx="12" ry="11" fill="${li}" stroke="${K}" stroke-width="1.5"/>
    <circle  cx="27" cy="22" r="3.5" fill="${R}"/><circle cx="27" cy="22" r="2" fill="${K}"/>
    <circle  cx="37" cy="22" r="3.5" fill="${R}"/><circle cx="37" cy="22" r="2" fill="${K}"/>
    <path d="M27,30 Q32,34 37,30" stroke="${K}" stroke-width="1.5" fill="none"/>
    <path d="M14,34 Q20,32 32,33 Q44,32 50,34 L46,64 Q38,60 32,62 Q26,60 18,64 Z"
          fill="${p}" stroke="${K}" stroke-width="1.5"/>
    <line x1="14" y1="34" x2="4"  y2="54" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
    <line x1="50" y1="34" x2="60" y2="30" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
    <line x1="60" y1="6"  x2="60" y2="44" stroke="${dk}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="60" cy="6" rx="5" ry="5" fill="${li}" stroke="${Y}" stroke-width="1.5"/>
    <ellipse cx="60" cy="6" rx="3" ry="3" fill="${Y}"/>
    <circle cx="10" cy="56" r="5" fill="${Y}" opacity="0.7" stroke="${K}" stroke-width="1"/>
    <circle cx="6"  cy="48" r="3" fill="${Y}" opacity="0.5"/>`;
};


// ── monster ID → archetype ────────────────────────────────────────────────────
const SPRITE_KEY_MAP: Record<string, string> = {
  'rat':'rat','giant-rat':'rat',
  'kobold':'goblin','goblin':'goblin','hobgoblin':'goblin',
  'skeleton':'skeleton',
  'orc':'orc','orc-chief':'orc','gnoll':'orc',
  'zombie':'zombie','ghoul':'zombie',
  'giant-spider':'spider',
  'wolf':'wolf',
  'vampire-bat':'bat',
  'wight':'ghost','wraith':'ghost','shadow':'ghost','spectral-knight':'ghost',
  'lizardman':'lizardman',
  'ogre':'large','troll':'large','giant':'large','frost-giant':'large',
  'cyclops':'large','minotaur':'large',
  'medusa':'medusa',
  'harpy':'harpy',
  'vampire':'vampire',
  'golem':'golem','ice-golem':'golem',
  'basilisk':'beast','gorgon':'beast','manticore':'beast',
  'demon':'demon','greater-demon':'demon','demon-lord':'demon',
  'balrog':'demon','pit-fiend':'demon',
  'dragon':'dragon','ancient-dragon':'dragon','chimera':'dragon',
  'lich':'lich','arch-lich':'lich','lich-apprentice':'lich','death-knight':'lich',
  'beholder-kin':'beholder',
  'elemental-fire':'elemental','djinn':'elemental',
  'werewolf':'werewolf',
  'soldier':'soldier','guard':'soldier','town-guard':'soldier','royal-guard':'soldier',
  // Westeros
  'direwolf':'direwolf',
  'wildling':'orc','dothraki-rider':'orc',
  'white-walker':'ghost','wight-walker':'ghost','faceless-assassin':'ghost',
  'mountain-clansman':'large',
  'maester':'lich',
  'kingsguard':'soldier',
  'shadowcat':'wolf',
  // Alefgard
  'slime':'slime','metal-slime':'slime',
  'drakee':'drakee',
  'ghost-dq':'ghost',
  'magician-dq':'lich',
  'scorpion':'spider',
  'wyvern':'dragon',
  'golem-dq':'golem','stoneman':'golem',
  'dragonlord-knight':'large',
  // Mystara
  'gnome':'goblin',
  'bugbear':'large','centaur':'large','treant':'large',
  'blink-dog':'wolf',
  'rust-monster':'beast','displacer-beast':'beast','owlbear':'beast',
  'rakshasa':'demon',
  'mind-flayer':'mind-flayer',
  'naga':'lizardman',
  'gargoyle':'ghost',
  // Hyrule
  'bokoblin':'bokoblin',
  'moblin':'orc',
  'keese':'bat',
  'lizalfos':'lizardman',
  'stalfos':'skeleton',
  'peahat':'spider',
  'wizzrobe':'wizzrobe',
  'darknut':'darknut',
  'lynel':'lynel',
  'poe':'ghost',
};

// ── component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-monster-sprite',
  standalone: true,
  imports: [CommonModule],
  template: `<div [style.width.px]="size" [style.height.px]="size" [innerHTML]="svg"></div>`,
})
export class MonsterSpriteComponent implements OnChanges {
  @Input() monsterId = '';
  @Input() color = '#888888';
  @Input() size = 64;

  svg: SafeHtml = '';

  private sanitizer = inject(DomSanitizer);

  ngOnChanges() {
    const key = SPRITE_KEY_MAP[this.monsterId] ?? 'default';
    const fn  = DRAW_FNS[key] ?? DRAW_FNS['default'];
    const s   = this.size;
    const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64">${fn(this.color)}</svg>`;
    this.svg  = this.sanitizer.bypassSecurityTrustHtml(raw);
  }
}
