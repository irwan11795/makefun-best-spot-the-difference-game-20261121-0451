// The workshop itself, drawn in code — no borrowed art. drawScene paints one picture of
// the clockmaker's workshop into a 600x460 panel. `applied` is the set of difference ids
// whose changed version to draw: the left panel draws with an empty set, the right panel
// with every difference of the scene. `time` (seconds) drives the gentle motion (gears turn,
// the pendulum swings, the lamp glows) so the game feels alive without moving a difference.

import { PANEL } from './config.js';

const W = PANEL.width;
const H = PANEL.height;

// One palette per scene, so each reads as a different time of day: a warm bright
// morning, a sage-green daylight wall, and a dark blue midnight. The workshop props
// stay the same; the wall, floor, window sky and vignette carry the time of day.
const THEMES = {
  'morning-bench': {
    wall: '#8a6238', wallBand: '#9c7040', floor: '#75573a',
    sky: '#7ba3c4', star: 'rgba(245, 234, 214, 0.5)',
    vignette: 0.10, lampGlow: 0.8,
  },
  'clock-wall': {
    wall: '#5d6b4a', wallBand: '#6d7d58', floor: '#4f5a40',
    sky: '#4a6a86', star: '#f5ead6',
    vignette: 0.14, lampGlow: 1.0,
  },
  'midnight-tinkering': {
    wall: '#33241a', wallBand: '#40301f', floor: '#261c12',
    sky: '#0d1526', star: '#f5ead6',
    vignette: 0.30, lampGlow: 1.4,
  },
};
const WOOD_LINE = '#4a3018';
const BRASS = '#c9a227';
const BRASS_DARK = '#8f6f14';
const IRON = '#3d4450';
const PAPER = '#f5ead6';

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function gear(ctx, x, y, r, teeth, color, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  for (let i = 0; i < teeth; i += 1) {
    const a = (i / teeth) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(-3, -r - 5, 6, 10);
    ctx.restore();
  }
  circle(ctx, 0, 0, r);
  ctx.fillStyle = '#2a2118';
  circle(ctx, 0, 0, r * 0.32);
  ctx.restore();
}

function drawClockFace(ctx, x, y, r, hourAngle, minuteAngle, dialTwelveChanged) {
  ctx.fillStyle = '#f7f0dd';
  circle(ctx, x, y, r);
  ctx.strokeStyle = '#5d4526';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#2a2118';
  ctx.font = `bold ${Math.round(r * 0.42)}px ${'system-ui, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // The twelve sits at the top; one scene swaps it for a six.
  ctx.fillText(dialTwelveChanged ? '6' : '12', x, y - r * 0.62);
  ctx.fillText('3', x + r * 0.62, y);
  ctx.fillText('6', x, y + r * 0.62);
  ctx.fillText('9', x - r * 0.62, y);
  ctx.strokeStyle = '#2a2118';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(hourAngle) * r * 0.5, y - Math.cos(hourAngle) * r * 0.5);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(minuteAngle) * r * 0.78, y - Math.cos(minuteAngle) * r * 0.78);
  ctx.stroke();
  ctx.fillStyle = BRASS_DARK;
  circle(ctx, x, y, 3);
}

function drawCat(ctx, x, y, tailUp, earFolded) {
  // A ginger cat asleep on the bench, curled in a loaf.
  ctx.fillStyle = '#d98a3d';
  ellipse(ctx, x, y, 42, 20);
  circle(ctx, x - 34, y - 14, 15);
  // Ears; one scene folds the left ear.
  ctx.fillStyle = '#d98a3d';
  ctx.beginPath();
  if (earFolded) {
    ctx.moveTo(x - 46, y - 24);
    ctx.lineTo(x - 38, y - 30);
    ctx.lineTo(x - 34, y - 20);
  } else {
    ctx.moveTo(x - 46, y - 24);
    ctx.lineTo(x - 44, y - 36);
    ctx.lineTo(x - 34, y - 26);
  }
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 26, y - 26);
  ctx.lineTo(x - 24, y - 38);
  ctx.lineTo(x - 16, y - 26);
  ctx.closePath();
  ctx.fill();
  // Stripes and a closed eye.
  ctx.strokeStyle = '#a8641f';
  ctx.lineWidth = 2;
  for (const dx of [-8, 2, 12]) {
    ctx.beginPath();
    ctx.moveTo(x + dx - 22, y - 24);
    ctx.lineTo(x + dx - 22, y - 6);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x - 36, y - 12, 3, Math.PI, 0);
  ctx.stroke();
  // Tail: curled up against the body, or lying flat along the bench.
  ctx.strokeStyle = '#d98a3d';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (tailUp) {
    ctx.moveTo(x + 38, y + 6);
    ctx.quadraticCurveTo(x + 58, y - 6, x + 52, y - 26);
  } else {
    ctx.moveTo(x + 38, y + 8);
    ctx.quadraticCurveTo(x + 62, y + 12, x + 78, y + 8);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawTeapot(ctx, x, y, hasLid) {
  ctx.fillStyle = '#4a7a8c';
  ellipse(ctx, x, y, 26, 18);
  ctx.fillStyle = '#3d6a7a';
  ctx.beginPath();
  ctx.moveTo(x - 24, y - 4);
  ctx.quadraticCurveTo(x - 40, y - 12, x - 34, y + 4);
  ctx.quadraticCurveTo(x - 28, y + 8, x - 24, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a7a8c';
  ctx.fillRect(x + 22, y - 10, 12, 5);
  if (hasLid) {
    ctx.fillStyle = '#5d8fa3';
    ellipse(ctx, x, y - 18, 14, 6);
    ctx.fillStyle = BRASS;
    circle(ctx, x, y - 24, 3);
  }
}

function drawBooks(ctx, x, y, spineChanged, stackCount) {
  // A row of upright books on the shelf.
  const colors = ['#a63a3a', '#3a6ea6', '#4a8c5d', '#8c6a3a', '#6a4a8c'];
  for (let i = 0; i < 5; i += 1) {
    let color = colors[i];
    if (spineChanged && i === 1) color = '#a63a3a';
    if (!spineChanged && i === 1) color = '#3a6ea6';
    ctx.fillStyle = color;
    ctx.fillRect(x + i * 13, y - 30 - (i % 2) * 3, 11, 30 + (i % 2) * 3);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + i * 13 + 2, y - 30 - (i % 2) * 3, 2, 30 + (i % 2) * 3);
  }
  // A small stack lying flat beside them.
  const n = stackCount;
  for (let i = 0; i < n; i += 1) {
    ctx.fillStyle = ['#8c4a2a', '#2a5d8c', '#5d8c3a'][i];
    ctx.fillRect(x + 78, y - 8 - i * 9, 46, 8);
  }
}

function drawBirdcage(ctx, x, y, hasBird) {
  ctx.strokeStyle = BRASS_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 26, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 26, y);
  ctx.lineTo(x - 26, y + 34);
  ctx.moveTo(x + 26, y);
  ctx.lineTo(x + 26, y + 34);
  ctx.moveTo(x - 26, y + 34);
  ctx.lineTo(x + 26, y + 34);
  ctx.stroke();
  for (const dx of [-13, 0, 13]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y - 24);
    ctx.lineTo(x + dx, y + 34);
    ctx.stroke();
  }
  ctx.fillStyle = BRASS;
  ctx.fillRect(x - 4, y - 34, 8, 10);
  if (hasBird) {
    ctx.fillStyle = '#e5534b';
    ellipse(ctx, x, y + 18, 9, 12);
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 12);
    ctx.lineTo(x + 15, y + 16);
    ctx.lineTo(x + 8, y + 19);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLamp(ctx, x, y, on, time, glowK = 1) {
  ctx.strokeStyle = '#2a2118';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 46);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = '#2a5d3a';
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 18);
  ctx.lineTo(x + 18, y - 18);
  ctx.lineTo(x + 10, y + 2);
  ctx.lineTo(x - 10, y + 2);
  ctx.closePath();
  ctx.fill();
  if (on) {
    const flicker = 0.75 + Math.sin(time * 3) * 0.05;
    ctx.fillStyle = `rgba(242, 201, 76, ${0.85 * flicker})`;
    circle(ctx, x, y + 8, 9);
    const glow = ctx.createRadialGradient(x, y + 8, 4, x, y + 8, 60);
    glow.addColorStop(0, `rgba(242, 201, 76, ${0.30 * glowK})`);
    glow.addColorStop(1, 'rgba(242, 201, 76, 0)');
    ctx.fillStyle = glow;
    circle(ctx, x, y + 8, 60);
  } else {
    ctx.fillStyle = '#5d5a52';
    circle(ctx, x, y + 8, 9);
  }
}

/**
 * Paint one picture. `scene` is the scene definition from config.js, `applied` the set of
 * difference ids drawn in their changed form, `time` the seconds for gentle motion.
 * The picture is 600x460; the caller translates it into a panel.
 */
export function drawScene(ctx, scene, applied, time) {
  const theme = THEMES[scene.id] || THEMES['morning-bench'];
  const has = (id) => applied.has(id);

  // Wall of wooden planks, in the scene's own palette.
  ctx.fillStyle = theme.wall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = theme.wallBand;
  for (let y = 0; y < H; y += 46) ctx.fillRect(0, y, W, 22);
  ctx.strokeStyle = WOOD_LINE;
  ctx.lineWidth = 2;
  for (let y = 46; y < H; y += 46) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Floor.
  ctx.fillStyle = theme.floor;
  ctx.fillRect(0, 420, W, 40);

  // Rug. It stays red; only its stripe changes colour (yellow to blue) — a
  // medium change: visible once you look, not from across the room.
  ctx.fillStyle = '#8c3a3a';
  roundRect(ctx, 220, 428, 160, 26, 6);
  ctx.fillStyle = has('rug-stripe') ? '#4a6a8c' : '#f2c94c';
  ctx.fillRect(240, 436, 120, 5);
  ctx.fillStyle = '#f5ead6';
  ctx.fillRect(260, 446, 80, 3);

  // Round window, top left, with the sky for the scene's time of day.
  ctx.fillStyle = '#2a2118';
  circle(ctx, 84, 66, 46);
  ctx.fillStyle = theme.sky;
  circle(ctx, 84, 66, 40);
  star(ctx, 62, 44, 4, theme.star);
  star(ctx, 106, 40, 3, theme.star);
  if (!has('window-star')) star(ctx, 128, 54, 4, theme.star);
  star(ctx, 96, 84, 3, theme.star);
  // The moon: full, or a crescent when the difference is applied.
  ctx.fillStyle = '#f2ead0';
  circle(ctx, 84, 66, 16);
  if (has('moon')) {
    ctx.fillStyle = theme.sky;
    circle(ctx, 90, 62, 14);
  }
  ctx.strokeStyle = '#5d4526';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(84, 66, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(84, 26);
  ctx.lineTo(84, 106);
  ctx.moveTo(44, 66);
  ctx.lineTo(124, 66);
  ctx.stroke();

  // Shelf with books, teapot and a stack.
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(16, 150, 568, 10);
  drawBooks(ctx, 320, 150, has('book-spine'), has('book-stack') ? 2 : 3);
  drawTeapot(ctx, 296, 168, !has('teapot-lid'));

  // The tall clock: round dial above, pendulum below. The case is warm wood with a
  // lighter chamber, so it reads as furniture rather than a dark hole in the wall.
  ctx.fillStyle = '#6b4a2b';
  roundRect(ctx, 262, 120, 76, 220, 8);
  ctx.fillStyle = '#8a6a42';
  roundRect(ctx, 272, 150, 56, 172, 6);
  ctx.fillStyle = '#5d4526';
  ctx.fillRect(262, 120, 76, 8);
  drawClockFace(ctx, 300, 82, 34, 0, Math.PI / 3, has('dial-twelve'));
  // Pendulum: a small shift left or right with the difference — subtle by design.
  const swing = has('pendulum') ? 0.12 : -0.12;
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(300, 170);
  ctx.lineTo(300 + Math.sin(swing) * 46, 170 + Math.cos(swing) * 62);
  ctx.stroke();
  ctx.fillStyle = BRASS;
  circle(ctx, 300 + Math.sin(swing) * 46, 170 + Math.cos(swing) * 62, 12);
  ctx.fillStyle = '#f5ead6';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TINKER & CO', 300, 330);

  // Cuckoo clock, top right of the dial.
  ctx.fillStyle = '#7d4a22';
  ctx.beginPath();
  ctx.moveTo(438, 66);
  ctx.lineTo(468, 44);
  ctx.lineTo(498, 66);
  ctx.lineTo(498, 118);
  ctx.lineTo(438, 118);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7f0dd';
  circle(ctx, 468, 92, 22);
  ctx.strokeStyle = '#5d4526';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(468, 92, 22, 0, Math.PI * 2);
  ctx.stroke();
  // Hands: three o'clock, or five o'clock when changed.
  const hourA = has('clock-hands') ? (5 * Math.PI) / 6 : Math.PI / 2;
  ctx.strokeStyle = '#2a2118';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(468, 92);
  ctx.lineTo(468 + Math.sin(hourA) * 10, 92 - Math.cos(hourA) * 10);
  ctx.moveTo(468, 92);
  ctx.lineTo(468, 92 - 15);
  ctx.stroke();
  ctx.fillStyle = BRASS;
  circle(ctx, 468, 122, 4);

  // Hanging key, top right.
  if (!has('wall-key')) {
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(560, 92, 7, 0, Math.PI * 2);
    ctx.moveTo(560, 99);
    ctx.lineTo(560, 116);
    ctx.moveTo(560, 110);
    ctx.lineTo(566, 110);
    ctx.moveTo(560, 116);
    ctx.lineTo(566, 116);
    ctx.stroke();
  }

  // Wall gears, slowly turning. The big gear is an Easy difference: it is simply
  // gone in the changed picture — a whole object missing is easy to spot.
  if (!has('wall-gear')) gear(ctx, 540, 210, 22, 8, '#8f6f14', time * 0.2);
  gear(ctx, 500, 246, 14, 7, '#6a5a3a', -time * 0.3);

  // Birdcage hanging from the shelf.
  ctx.strokeStyle = '#2a2118';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(168, 150);
  ctx.lineTo(168, 128);
  ctx.stroke();
  drawBirdcage(ctx, 168, 158, !has('cage-bird'));

  // Potted plant on a wall bracket. The pot changes colour (red to blue) — a
  // medium change on a small object.
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(70, 262, 52, 8);
  ctx.fillStyle = has('plant-pot') ? '#3a6ea6' : '#a63a3a';
  ctx.beginPath();
  ctx.moveTo(82, 262);
  ctx.lineTo(110, 262);
  ctx.lineTo(104, 286);
  ctx.lineTo(88, 286);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a8c5d';
  ctx.lineWidth = 3;
  const leaves = 3;
  for (let i = 0; i < leaves; i += 1) {
    const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.5;
    ctx.beginPath();
    ctx.moveTo(96, 262);
    ctx.quadraticCurveTo(96 + Math.cos(a) * 14, 262 + Math.sin(a) * 20, 96 + Math.cos(a) * 22, 262 + Math.sin(a) * 34);
    ctx.stroke();
  }

  // The work lamp, hanging above the bench.
  drawLamp(ctx, 520, 128, !has('lamp'), time, theme.lampGlow);

  // Workbench.
  ctx.fillStyle = '#5d4526';
  ctx.fillRect(0, 380, W, 40);
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(0, 380, W, 8);
  ctx.strokeStyle = WOOD_LINE;
  ctx.beginPath();
  ctx.moveTo(0, 396);
  ctx.lineTo(W, 396);
  ctx.stroke();

  // The cat asleep on the bench.
  drawCat(ctx, 118, 372, has('cat-tail'), has('cat-ear'));

  // The blue mug — or an empty spot where it was.
  if (!has('mug')) {
    ctx.fillStyle = '#3a6ea6';
    roundRect(ctx, 182, 380, 28, 26, 4);
    ctx.fillStyle = '#3a6ea6';
    ctx.beginPath();
    ctx.arc(212, 393, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = '#3a6ea6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(212, 393, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  // A small gear on the bench. It stays put; only its teeth change (7 to 5) —
  // a detail you have to count, which is what the Hard scene is for.
  gear(ctx, 240, 404, 12, has('bench-gear') ? 5 : 7, '#8f6f14', time * 0.4);

  // Oil can: spout points left, or right when changed.
  ctx.fillStyle = '#8c6a3a';
  ellipse(ctx, 392, 388, 18, 12);
  ctx.strokeStyle = '#8c6a3a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(392, 384);
  ctx.lineTo(has('oil-spout') ? 416 : 368, 372);
  ctx.stroke();
  ctx.fillStyle = '#5d4526';
  ctx.fillRect(388, 372, 8, 6);

  // Wrench: it stays on the bench, but flips its angle when changed — the same
  // tool, a different lean. Medium: you have to notice the orientation.
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 5;
  if (has('wrench')) {
    ctx.beginPath();
    ctx.moveTo(436, 404);
    ctx.lineTo(468, 392);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(470, 391, 7, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(436, 392);
    ctx.lineTo(468, 404);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(434, 391, 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Screwdriver: red handle, or dark maroon when changed — a small colour
  // shift on a small tool, subtle enough for the Hard scene.
  ctx.fillStyle = has('screwdriver') ? '#6a2a2a' : '#a63a3a';
  roundRect(ctx, 488, 384, 26, 9, 4);
  ctx.fillStyle = IRON;
  ctx.fillRect(514, 386, 22, 5);

  // Scattered screws and a soft vignette so the picture reads as one scene.
  ctx.fillStyle = '#8f6f14';
  for (const [sx, sy] of [[320, 402], [340, 410], [280, 408]]) circle(ctx, sx, sy, 2);
  const vig = ctx.createRadialGradient(300, 230, 180, 300, 230, 420);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${theme.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  void PAPER;
}
