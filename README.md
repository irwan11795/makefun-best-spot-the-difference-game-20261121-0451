[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/irwan11795/makefun-best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/irwan11795/makefun-best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)

# Tinker & Spot — The Clockmaker's Workshop

A spot-the-difference game for the [make.fun bounty](https://make.fun/c/best-spot-the-difference-game-20261121-0451): two near-identical pictures of a clockmaker's workshop, side by side. Find the seven differences in each picture before the clock runs out.

## How to play

- **Click** a difference in either picture — or steer the crosshair with the **arrow keys** and press **Enter**.
- A found difference gets a bright ring on both pictures, with a checkmark and its name.
- **H** asks for a hint (3 per scene, −50 points, rings one unfound difference for a few seconds).
- A wrong click costs 5 seconds and breaks your combo; finding two in a row without a miss builds a combo bonus.
- **P** pauses, **M** mutes, **Space** starts and continues.
- Three scenes, 21 differences in all: *Morning Bench* (easy), *The Clock Wall* (medium), *Midnight Tinkering* (hard). Each scene gives you 3 minutes; clearing one banks a time bonus.

## What is in the box

- `game/` — the whole game as static files, no build step, no network request. Open `game/index.html` in desktop Chrome and play.
- `game/src/config.js` — every tuning number, colour and scene definition.
- `game/src/scenes.js` — the workshop itself, drawn in code (no borrowed art): the wall of clocks, the cat on the bench, the birdcage, the gears that turn.
- `game/src/world.js` — the game state: finds, timer, score, combo, hints.
- `game/src/input.js` — mouse and keyboard, with a crosshair for keyboard play.
- `game/src/audio.js` — all sound made with the Web Audio API (chimes, thuds, arpeggios); no audio files.
- `game/src/render.js` — every screen: title, play, pause, scene clear, game over, win.
- `game/src/shots.js` — the four screenshot scenes, staged through the real rules.
- `main.ts` — the hand-in program (Node 22, standard library only): copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

## Run it

```sh
node serve.ts            # serves game/ on http://localhost:8080
```

Hand it in (outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for `/output`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
