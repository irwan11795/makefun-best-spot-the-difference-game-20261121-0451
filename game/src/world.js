// The game state: which scene, what is found, the clock, the score. Pure logic — no
// drawing here. A click is a find when it lands inside an unfound difference of the
// current scene, in either panel; a miss costs seconds and breaks the combo.

import { HINTS_PER_SCENE, MISS_PENALTY, POINTS, SCENES, SCENE_TIME } from './config.js';

export const EVENT_FIND = 1;
export const EVENT_MISS = 2;
export const EVENT_SCENE_CLEAR = 4;
export const EVENT_WIN = 8;
export const EVENT_TIMEOUT = 16;
export const EVENT_HINT = 32;

export function createWorld() {
  const state = {
    sceneIndex: 0,
    found: new Set(),
    hinted: null,
    hintEndsAt: 0,
    timeLeft: SCENE_TIME,
    score: 0,
    combo: 0,
    hintsLeft: HINTS_PER_SCENE,
    elapsed: 0,
    cleared: 0,
    totalFinds: 0,
  };

  function scene() {
    return SCENES[state.sceneIndex];
  }

  function resetScene(index) {
    state.sceneIndex = index;
    state.found = new Set();
    state.hinted = null;
    state.hintEndsAt = 0;
    state.timeLeft = SCENE_TIME;
    state.hintsLeft = HINTS_PER_SCENE;
  }

  function reset() {
    state.score = 0;
    state.combo = 0;
    state.elapsed = 0;
    state.cleared = 0;
    state.totalFinds = 0;
    resetScene(0);
  }

  /** Advance the clock; returns EVENT_TIMEOUT when the scene's time runs out. */
  function step(dt) {
    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.hinted !== null && state.elapsed >= state.hintEndsAt) state.hinted = null;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      return EVENT_TIMEOUT;
    }
    return 0;
  }

  /**
   * Try a click at scene coordinates (x, y) inside one picture. Returns an event mask and,
   * on a find, the difference that was found.
   */
  function click(x, y) {
    const current = scene();
    for (const diff of current.differences) {
      if (state.found.has(diff.id)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      if (dx * dx + dy * dy <= diff.r * diff.r) {
        state.found.add(diff.id);
        state.totalFinds += 1;
        state.combo = Math.min(state.combo + 1, POINTS.maxCombo);
        const gained = POINTS.find + (state.combo - 1) * POINTS.comboStep;
        state.score += gained;
        state.hinted = null;
        let events = EVENT_FIND;
        if (state.found.size === current.differences.length) {
          state.score += Math.round(state.timeLeft) * POINTS.timeBonus;
          state.cleared += 1;
          state.combo = 0;
          events |= EVENT_SCENE_CLEAR;
          if (state.sceneIndex + 1 >= SCENES.length) events |= EVENT_WIN;
        }
        return { events, diff, gained };
      }
    }
    state.combo = 0;
    state.timeLeft = Math.max(0, state.timeLeft - MISS_PENALTY);
    return { events: state.timeLeft <= 0 ? EVENT_MISS | EVENT_TIMEOUT : EVENT_MISS, diff: null, gained: 0 };
  }

  /** Ring one unfound difference for a while; costs points and a hint. */
  function hint() {
    if (state.hintsLeft <= 0) return null;
    const remaining = scene().differences.filter((d) => !state.found.has(d.id));
    if (remaining.length === 0) return null;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - HINT_COST);
    state.hinted = pick.id;
    state.hintEndsAt = state.elapsed + 2.5;
    return pick;
  }

  function nextScene() {
    resetScene(state.sceneIndex + 1);
  }

  return {
    state,
    scene,
    reset,
    resetScene,
    step,
    click,
    hint,
    nextScene,
  };
}
