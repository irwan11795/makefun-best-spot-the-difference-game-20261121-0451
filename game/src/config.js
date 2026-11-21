// Every tuning number, colour and scene definition in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule depends on the
// screen size. Each scene is one picture of the clockmaker's workshop; the right-hand panel
// draws the same picture with every one of its differences applied, the left-hand panel with
// none. A difference is fair when a careful look finds it and a careless one does not.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One picture panel (each side of the pair). The scene draws inside it. */
export const PANEL = { width: 600, height: 460, top: 92 };
export const PANEL_LEFT = { x: 20, y: PANEL.top };
export const PANEL_RIGHT = { x: 660, y: PANEL.top };

/**
 * The two playfield layouts. Wide (1280x720) puts the pictures side by side; stacked
 * (680x1180) puts them one above the other, for phones in portrait, where a side-by-side
 * picture would shrink under ~300 CSS px and be unplayable. The pictures themselves stay
 * 600x460 in both layouts, so the world logic never changes — only where they sit.
 * Stacked geometry: HUD 0–80, top picture 92–552, its label at 572, bottom picture
 * 592–1052, its label at 1072, bottom bar 1088–1180.
 */
export const FIELD_STACKED = { width: 680, height: 1180 };
export const PANEL_STACKED_TOP = { x: 40, y: PANEL.top };
export const PANEL_STACKED_BOTTOM = { x: 40, y: 592 };

export const LAYOUTS = {
  wide: {
    mode: 'wide',
    field: FIELD,
    panels: [
      { x: PANEL_LEFT.x, y: PANEL_LEFT.y, w: PANEL.width, h: PANEL.height },
      { x: PANEL_RIGHT.x, y: PANEL_RIGHT.y, w: PANEL.width, h: PANEL.height },
    ],
    bottomBar: { y: 580, height: 140 },
    titleOffsetY: 0,
  },
  stacked: {
    mode: 'stacked',
    field: FIELD_STACKED,
    panels: [
      { x: PANEL_STACKED_TOP.x, y: PANEL_STACKED_TOP.y, w: PANEL.width, h: PANEL.height },
      { x: PANEL_STACKED_BOTTOM.x, y: PANEL_STACKED_BOTTOM.y, w: PANEL.width, h: PANEL.height },
    ],
    bottomBar: { y: 1088, height: 92 },
    titleOffsetY: 230,
  },
};

/**
 * Pick the layout for a window of (vw, vh) CSS pixels. Wide wins while each picture
 * would still be at least 300 CSS px across; below that the pictures stack. At 1024x768
 * the wide scale is 0.8, so each picture is 480px — wide. At 390x844 the wide scale is
 * 0.30, so each picture would be 183px — stacked, where each is 344px.
 */
export function chooseLayout(vw, vh) {
  const wideScale = Math.min(vw / FIELD.width, vh / FIELD.height);
  if (PANEL.width * wideScale >= 300) return 'wide';
  return 'stacked';
}

/** Seconds on the clock for one scene; a miss costs a few more. */
export const SCENE_TIME = 180;
export const MISS_PENALTY = 5;

/** Hints per scene; a hint costs points and briefly rings one unfound difference. */
export const HINTS_PER_SCENE = 3;
export const HINT_COST = 50;
export const HINT_SECONDS = 2.5;

/** Points: a find, a time bonus per second left when a scene is cleared, and a combo. */
export const POINTS = { find: 100, timeBonus: 2, comboStep: 25, maxCombo: 4 };

export const PALETTE = {
  backdrop: '#171310',
  hud: '#241c15',
  hudLine: '#4a3a28',
  panelFrame: '#8a6a42',
  panelFrameDark: '#5d4526',
  text: '#f5ead6',
  muted: '#c9b48f',
  accent: '#f2c94c',
  good: '#7bc96f',
  bad: '#e5534b',
  marker: '#ffcf3d',
  markerRing: '#fff3c4',
  timerLow: '#ff7a5c',
  button: '#3a2c1c',
  buttonLine: '#8a6a42',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'tinker-and-spot.best';

/**
 * The three scenes. Each difference: an id, a name (shown when found), the spot in the
 * 600x460 picture where it lives, and the radius a click must fall inside. The picture's
 * draw code in scenes.js reads these ids and changes what it draws when one is applied.
 */
export const SCENES = [
  {
    id: 'morning-bench',
    name: 'Morning Bench',
    subtitle: 'Seven small things changed while the kettle boiled.',
    difficulty: 'Easy',
    differences: [
      { id: 'clock-hands', name: 'Cuckoo clock hands', x: 468, y: 96, r: 30 },
      { id: 'cat-tail', name: "The cat's tail", x: 118, y: 372, r: 30 },
      { id: 'teapot-lid', name: 'Teapot lid', x: 296, y: 168, r: 26 },
      { id: 'moon', name: 'The moon', x: 84, y: 66, r: 26 },
      { id: 'book-spine', name: 'A book spine', x: 356, y: 128, r: 22 },
      { id: 'wall-gear', name: 'A wall gear', x: 540, y: 210, r: 28 },
      { id: 'mug', name: 'The blue mug', x: 196, y: 396, r: 24 },
    ],
  },
  {
    id: 'clock-wall',
    name: 'The Clock Wall',
    subtitle: 'Seven small things changed while the clocks ticked.',
    difficulty: 'Medium',
    differences: [
      { id: 'dial-twelve', name: 'The twelve on the dial', x: 300, y: 82, r: 26 },
      { id: 'wrench', name: 'The wrench', x: 452, y: 396, r: 28 },
      { id: 'plant-pot', name: 'The plant pot', x: 96, y: 274, r: 26 },
      { id: 'lamp', name: 'The work lamp', x: 520, y: 128, r: 28 },
      { id: 'cage-bird', name: 'The bird in its cage', x: 168, y: 158, r: 28 },
      { id: 'oil-spout', name: 'The oil can spout', x: 392, y: 372, r: 26 },
      { id: 'rug-stripe', name: 'A rug stripe', x: 300, y: 436, r: 26 },
    ],
  },
  {
    id: 'midnight-tinkering',
    name: 'Midnight Tinkering',
    subtitle: 'Seven small things changed after midnight.',
    difficulty: 'Hard',
    differences: [
      { id: 'window-star', name: 'A star in the window', x: 128, y: 54, r: 22 },
      { id: 'screwdriver', name: 'The screwdriver handle', x: 500, y: 388, r: 24 },
      { id: 'pendulum', name: 'The pendulum', x: 300, y: 252, r: 26 },
      { id: 'bench-gear', name: 'A gear on the bench', x: 240, y: 404, r: 24 },
      { id: 'cat-ear', name: "The cat's ear", x: 148, y: 342, r: 22 },
      { id: 'book-stack', name: 'The book stack', x: 420, y: 160, r: 26 },
      { id: 'wall-key', name: 'The hanging key', x: 560, y: 96, r: 22 },
    ],
  },
];
