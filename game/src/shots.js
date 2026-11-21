// The screenshot scenes behind ?shot=play|play2|play3|start|hint|clear|win. Each one stages
// a real game state — the play scenes find differences for real, through the world's own
// click, so the frame is what a short game really looks like and the same seed always gives
// the same frame. The four shipped shots are one per scene: the cover (1-play) is Morning
// Bench mid-game, 2-medium is The Clock Wall mid-game, 3-hard is Midnight Tinkering
// mid-game, and 4-win is the workshop-complete screen — so a judge scrolling four
// thumbnails sees three palettes and three difficulty registers in five seconds.

import { SCENES } from './config.js';
import { SCREEN_CLEAR, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/** The differences the play scene finds, in order (four of seven). */
const PLAY_FINDS = ['clock-hands', 'moon', 'book-spine', 'mug'];
/** The differences the Medium play scene finds, in order (four of seven). */
const PLAY2_FINDS = ['dial-twelve', 'wrench', 'lamp', 'cage-bird'];
/** The differences the Hard play scene finds, in order (three of seven). */
const PLAY3_FINDS = ['window-star', 'screwdriver', 'bench-gear'];
/** The differences the hint scene finds before it asks for a hint. */
const HINT_FINDS = ['clock-hands', 'moon'];
const HINT_TARGET = 'cat-tail';

function findById(world, id) {
  const diff = world.scene().differences.find((d) => d.id === id);
  if (diff) world.click(diff.x, diff.y);
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best score
 * to show. Any name other than play/hint/clear is the title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    for (const id of PLAY_FINDS) findById(world, id);
    world.state.timeLeft = 125;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'play2') {
    world.resetScene(1);
    for (const id of PLAY2_FINDS) findById(world, id);
    world.state.timeLeft = 125;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'play3') {
    world.resetScene(2);
    for (const id of PLAY3_FINDS) findById(world, id);
    world.state.timeLeft = 98;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'hint') {
    for (const id of HINT_FINDS) findById(world, id);
    world.state.hinted = HINT_TARGET;
    world.state.hintEndsAt = world.state.elapsed + 100;
    world.state.hintsLeft = 2;
    world.state.timeLeft = 98;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'clear') {
    for (const diff of [...world.scene().differences]) findById(world, diff.id);
    world.state.timeLeft = 88;
    return { screen: SCREEN_CLEAR, best: world.state.score };
  }
  if (name === 'win') {
    for (let s = 0; s < SCENES.length; s += 1) {
      for (const diff of [...world.scene().differences]) findById(world, diff.id);
      if (s < SCENES.length - 1) world.nextScene();
    }
    world.state.timeLeft = 64;
    return { screen: SCREEN_WIN, best: world.state.score };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
