// Everything the player sees. The renderer paints one logical field and scales it to the
// window, letterboxed so circles stay circles — the canvas keeps the field's aspect ratio
// and sits centred, never stretched. Two layouts: wide (1280x720, the two pictures side by
// side) and stacked (680x1180, the pictures one above the other, used when a side-by-side
// picture would shrink under ~300 CSS px, i.e. phones in portrait). The pictures themselves
// stay 600x460 in both layouts, so the world logic never changes — only where they sit.
// Screens: title, play, paused, scene clear, game over, win.

import { FONT, LAYOUTS, PALETTE, SCENES, chooseLayout } from './config.js';
import { drawScene } from './scenes.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_CLEAR = 3;
export const SCREEN_OVER = 4;
export const SCREEN_WIN = 5;

function drawPanelFrame(ctx, panel) {
  ctx.fillStyle = PALETTE.panelFrameDark;
  ctx.fillRect(panel.x - 6, panel.y - 6, panel.w + 12, panel.h + 12);
  ctx.fillStyle = PALETTE.panelFrame;
  ctx.fillRect(panel.x - 3, panel.y - 3, panel.w + 6, panel.h + 6);
}

function drawMarker(ctx, x, y, r, pulse) {
  ctx.save();
  ctx.strokeStyle = PALETTE.marker;
  ctx.lineWidth = 4 + pulse;
  ctx.beginPath();
  ctx.arc(x, y, r + 6 + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.markerRing;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r + 6 + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFoundCheck(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = '#1d2a18';
  ctx.fillStyle = PALETTE.good;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f5ead6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x - 1, y + 4);
  ctx.lineTo(x + 6, y - 4);
  ctx.stroke();
  ctx.restore();
}

export function createRenderer(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  // ?layout=wide|stacked pins the layout (the screenshot runner uses it so a staged
  // frame is always the wide one); otherwise the window size decides.
  const forced = options.layout === 'wide' || options.layout === 'stacked' ? options.layout : null;
  let currentLayout = LAYOUTS.wide;

  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mode = forced ?? chooseLayout(vw, vh);
    currentLayout = LAYOUTS[mode];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = currentLayout.field.width * dpr;
    canvas.height = currentLayout.field.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Letterbox: keep the field's aspect ratio, centred in the window, so a portrait
    // phone shows the whole stacked field instead of a squashed wide one.
    const scale = Math.min(vw / currentLayout.field.width, vh / currentLayout.field.height);
    const cssW = Math.max(1, Math.round(currentLayout.field.width * scale));
    const cssH = Math.max(1, Math.round(currentLayout.field.height * scale));
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.style.left = `${Math.round((vw - cssW) / 2)}px`;
    canvas.style.top = `${Math.round((vh - cssH) / 2)}px`;
    canvas.style.right = 'auto';
    canvas.style.bottom = 'auto';
  }
  window.addEventListener('resize', resize);
  resize();

  function drawPanels(state, time, crosshair) {
    const layout = currentLayout;
    const scene = SCENES[state.sceneIndex];
    const applied = new Set(scene.differences.map((d) => d.id));
    const found = state.found;
    const [first, second] = layout.panels;

    for (const [panel, useApplied] of [[first, new Set()], [second, applied]]) {
      drawPanelFrame(ctx, panel);
      ctx.save();
      ctx.beginPath();
      ctx.rect(panel.x, panel.y, panel.w, panel.h);
      ctx.clip();
      ctx.translate(panel.x, panel.y);
      drawScene(ctx, scene, useApplied, time);
      ctx.restore();
      // Rings on every found difference, on both pictures.
      for (const diff of scene.differences) {
        if (!found.has(diff.id)) continue;
        drawMarker(ctx, panel.x + diff.x, panel.y + diff.y, diff.r, 0);
        drawFoundCheck(ctx, panel.x + diff.x, panel.y + diff.y - diff.r - 16);
      }
      // A pulsing ring on the hinted difference, on both pictures.
      if (state.hinted !== null) {
        const diff = scene.differences.find((d) => d.id === state.hinted);
        if (diff) {
          const pulse = 2 + Math.sin(time * 6) * 2;
          ctx.save();
          ctx.strokeStyle = '#7ec8f7';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(panel.x + diff.x, panel.y + diff.y, diff.r + 10 + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    // Labels under each picture.
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `13px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('ORIGINAL', first.x + 4, first.y + first.h + 20);
    ctx.textAlign = 'right';
    ctx.fillText('CHANGED — find what moved', second.x + second.w - 4, second.y + second.h + 20);
    ctx.textAlign = 'left';
    // The crosshair, drawn over the picture the pointer is in.
    if (crosshair !== null) {
      ctx.save();
      ctx.strokeStyle = 'rgba(245,234,214,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(crosshair.x, crosshair.y, 12, 0, Math.PI * 2);
      ctx.moveTo(crosshair.x - 18, crosshair.y);
      ctx.lineTo(crosshair.x - 8, crosshair.y);
      ctx.moveTo(crosshair.x + 8, crosshair.y);
      ctx.lineTo(crosshair.x + 18, crosshair.y);
      ctx.moveTo(crosshair.x, crosshair.y - 18);
      ctx.lineTo(crosshair.x, crosshair.y - 8);
      ctx.moveTo(crosshair.x, crosshair.y + 8);
      ctx.lineTo(crosshair.x, crosshair.y + 18);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHud(state, best) {
    const layout = currentLayout;
    const fw = layout.field.width;
    const scene = SCENES[state.sceneIndex];
    const foundCount = state.found.size;
    const total = scene.differences.length;
    const low = state.timeLeft <= 30;
    const mins = Math.floor(state.timeLeft / 60);
    const secs = Math.floor(state.timeLeft % 60);
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, fw, 80);
    ctx.strokeStyle = PALETTE.hudLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.lineTo(fw, 80);
    ctx.stroke();

    if (layout.mode === 'stacked') {
      // Narrow HUD: title left, clock right; scene line left, counter centred, score right.
      // The timer bar runs full width along the bottom of the HUD.
      ctx.fillStyle = PALETTE.accent;
      ctx.font = `bold 26px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('TINKER & SPOT', 20, 34);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `14px ${FONT}`;
      ctx.fillText(`${scene.name} · ${scene.difficulty}`, 20, 58);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 30px ${FONT}`;
      ctx.fillText(`${foundCount} of ${total} found`, fw / 2, 38);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `14px ${FONT}`;
      ctx.fillText(`${total - foundCount} still hiding`, fw / 2, 60);
      ctx.textAlign = 'right';
      ctx.fillStyle = low ? PALETTE.timerLow : PALETTE.text;
      ctx.font = `bold 26px ${FONT}`;
      ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, fw - 20, 34);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `14px ${FONT}`;
      ctx.fillText(`Score ${state.score} · Best ${best}`, fw - 20, 58);
      ctx.fillStyle = '#3a2c1c';
      ctx.fillRect(20, 74, fw - 40, 4);
      ctx.fillStyle = low ? PALETTE.timerLow : PALETTE.accent;
      ctx.fillRect(20, 74, (fw - 40) * Math.max(0, state.timeLeft / 180), 4);
      ctx.textAlign = 'left';
      return;
    }

    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 26px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('TINKER & SPOT', 20, 34);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`${scene.name} · ${scene.difficulty} · Scene ${state.sceneIndex + 1} of ${SCENES.length}`, 20, 58);

    // The counter of how many remain — the number the screenshots must show.
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText(`${foundCount} of ${total} found`, fw / 2, 38);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`${total - foundCount} still hiding`, fw / 2, 60);

    // Timer bar and score.
    ctx.textAlign = 'right';
    ctx.fillStyle = low ? PALETTE.timerLow : PALETTE.text;
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, fw - 20, 34);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`Score ${state.score} · Best ${best}`, fw - 20, 58);
    const barW = 200;
    ctx.fillStyle = '#3a2c1c';
    ctx.fillRect(fw - 220, 66, barW, 6);
    ctx.fillStyle = low ? PALETTE.timerLow : PALETTE.accent;
    ctx.fillRect(fw - 220, 66, barW * Math.max(0, state.timeLeft / 180), 6);
    ctx.textAlign = 'left';
  }

  function drawBottomBar(state) {
    const layout = currentLayout;
    const fw = layout.field.width;
    const bar = layout.bottomBar;
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, bar.y, fw, bar.height);
    ctx.strokeStyle = PALETTE.hudLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, bar.y);
    ctx.lineTo(fw, bar.y);
    ctx.stroke();

    if (layout.mode === 'stacked') {
      // Short copy so nothing clips at 680 logical px across.
      ctx.fillStyle = PALETTE.text;
      ctx.font = `16px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('Tap a difference in either picture.', 20, bar.y + 28);
      ctx.textAlign = 'right';
      ctx.fillStyle = state.hintsLeft > 0 ? PALETTE.accent : PALETTE.muted;
      ctx.font = `bold 16px ${FONT}`;
      ctx.fillText(`Hints left: ${state.hintsLeft}`, fw - 20, bar.y + 28);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `14px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(`Scene ${state.sceneIndex + 1} of ${SCENES.length} · H — hint · P — pause · M — mute · wrong tap −5s`, 20, bar.y + 54);
      ctx.textAlign = 'right';
      const combo = state.combo > 1 ? `Combo ×${state.combo}` : 'Two in a row = combo';
      ctx.fillText(combo, fw - 20, bar.y + 54);
      ctx.textAlign = 'left';
      return;
    }

    ctx.fillStyle = PALETTE.text;
    ctx.font = `16px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('Click a difference in either picture — or steer with the arrow keys and press Enter.', 20, bar.y + 32);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('H — hint (3 per scene, −50 pts) · P — pause · M — mute · a wrong click costs 5 seconds', 20, bar.y + 58);
    ctx.textAlign = 'right';
    ctx.fillStyle = state.hintsLeft > 0 ? PALETTE.accent : PALETTE.muted;
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillText(`Hints left: ${state.hintsLeft}`, fw - 20, bar.y + 32);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    const combo = state.combo > 1 ? `Combo ×${state.combo} — keep finding without a miss` : 'Find two in a row without a miss for a combo bonus';
    ctx.fillText(combo, fw - 20, bar.y + 58);
    ctx.textAlign = 'left';
  }

  function drawOverlay(title, lines, accent) {
    const layout = currentLayout;
    const fw = layout.field.width;
    const fh = layout.field.height;
    const cx = fw / 2;
    const dy = layout.titleOffsetY;
    ctx.fillStyle = 'rgba(12, 9, 6, 0.82)';
    ctx.fillRect(0, 0, fw, fh);
    ctx.fillStyle = accent;
    ctx.font = `bold 44px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(title, cx, 280 + dy);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `20px ${FONT}`;
    lines.forEach((line, i) => ctx.fillText(line, cx, 330 + i * 34 + dy));
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText('Press Space or click to continue', cx, 330 + lines.length * 34 + 30 + dy);
    ctx.textAlign = 'left';
  }

  function drawTitle(best, time) {
    const layout = currentLayout;
    const fw = layout.field.width;
    const fh = layout.field.height;
    const cx = fw / 2;
    const dy = layout.titleOffsetY;
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, fw, fh);
    // A quiet backdrop: the workshop, full-bleed and dimmed, behind the title.
    ctx.save();
    ctx.globalAlpha = 0.32;
    const cover = Math.max(fw / 600, fh / 460);
    ctx.translate((fw - 600 * cover) / 2, (fh - 460 * cover) / 2);
    ctx.scale(cover, cover);
    drawScene(ctx, SCENES[0], new Set(), time);
    ctx.restore();
    ctx.fillStyle = 'rgba(12, 9, 6, 0.55)';
    ctx.fillRect(0, 0, fw, fh);

    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 64px ${FONT}`;
    ctx.fillText('TINKER & SPOT', cx, 250 + dy);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `24px ${FONT}`;
    ctx.fillText('The Clockmaker’s Workshop', cx, 296 + dy);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `18px ${FONT}`;
    ctx.fillText('Two pictures. Seven differences. One sharp eye.', cx, 332 + dy);
    ctx.fillText('Three scenes, 21 differences in all — and the clock is ticking.', cx, 360 + dy);
    const pulse = 0.7 + Math.sin(time * 3) * 0.3;
    ctx.fillStyle = `rgba(245, 234, 214, ${pulse})`;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText('Press Space or click to start', cx, 430 + dy);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(`Best score: ${best}`, cx, 470 + dy);
    ctx.fillText('Click a difference in either picture · H for a hint · P to pause', cx, 500 + dy);
    ctx.textAlign = 'left';
  }

  return {
    draw(state, screen, best, time, crosshair) {
      const layout = currentLayout;
      ctx.clearRect(0, 0, layout.field.width, layout.field.height);
      if (screen === SCREEN_TITLE) {
        drawTitle(best, time);
        return;
      }
      drawPanels(state, time, screen === SCREEN_PLAY ? crosshair : null);
      drawHud(state, best);
      drawBottomBar(state);
      if (screen === SCREEN_PAUSED) {
        drawOverlay('Paused', ['The workshop waits for you.'], PALETTE.accent);
      } else if (screen === SCREEN_CLEAR) {
        const last = state.sceneIndex + 1 >= SCENES.length;
        drawOverlay(
          last ? 'Workshop Complete!' : 'Scene Clear!',
          last
            ? [`Every difference found. Final score ${state.score}.`, `Best ${best}.`]
            : [`All ${SCENES[state.sceneIndex].differences.length} differences found — time bonus banked.`, `Next: ${SCENES[state.sceneIndex + 1].name}.`],
          PALETTE.good,
        );
      } else if (screen === SCREEN_OVER) {
        const scene = SCENES[state.sceneIndex];
        drawOverlay(
          'Out of Time',
          [`The clock ran out with ${scene.differences.length - state.found.size} differences still hiding.`, `Score ${state.score} · Best ${best}.`],
          PALETTE.bad,
        );
      } else if (screen === SCREEN_WIN) {
        drawOverlay(
          'Workshop Complete!',
          [`All 21 differences found across three scenes.`, `Final score ${state.score} · Best ${best}.`],
          PALETTE.good,
        );
      }
    },
    getLayout() {
      return currentLayout;
    },
  };
}
