# Card Memory Trainer

A mobile-first React application for rapidly memorizing a standard 52-card deck. Tap through a naturally offset pile on a warm wood tabletop while a configurable Web Audio metronome keeps the pace.

## Features

- One-tap practice: the first card tap starts both the elapsed timer and metronome.
- A complete, locally generated 52-card deck with no jokers or remote card assets.
- Traditional responsive card faces and red, blue, and black commemorative card backs.
- Deterministic organic card stacking that looks identical when a saved deck is reviewed.
- Start Over preserves the deck, timer, and current metronome session; Shuffle archives and replaces it.
- The three most recent decks, settings, review state, and session timing persist in `localStorage`.
- Configurable BPM, beats per bar, maximum runtime, and volume.
- iPhone safe-area support, landscape layout, large touch targets, visible focus states, and reduced-motion support.

## Local setup

Node.js 22 or later is recommended.

```bash
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Tests

```bash
npm test
```

The Node test suite covers deck integrity, shuffle behavior, session reset rules, saved-deck limits and restoration, back-color rotation, timing, rapid advancement, and persistence recovery.

## Production build

```bash
npm run build
```

The generated static application is written to `dist/`. Vite uses the repository base path `/card-memory-trainer/`.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy.yml` installs dependencies, runs tests, builds the app, uploads the static artifact, and deploys it to GitHub Pages after a push to `main` (or a manual workflow run). In the repository settings, configure **Pages → Source** to **GitHub Actions**.

Expected URL: **https://aaronchipsandsalsa.github.io/card-memory-trainer/**

## iPhone audio note

The metronome initializes from a card tap for compatibility with iPhone browsers. iOS may suspend Web Audio when the screen locks or the browser moves to the background; continuous background audio is not guaranteed. The app retains the original start time and does not extend the configured cutoff when it becomes visible again.
