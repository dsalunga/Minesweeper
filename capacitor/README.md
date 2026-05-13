# Minesweeper · Capacitor

Mobile-friendly Minesweeper packaged as a Capacitor app for iOS and Android.

## Setup

```bash
cd capacitor
npm install
```

Add native platforms (run on a Mac for iOS):

```bash
npm run add:android
npm run add:ios   # macOS + Xcode required
```

## Develop

Preview in a browser:

```bash
npm run serve
# open http://localhost:5173
```

Sync the web build into the native projects, then open them:

```bash
npm run sync
npm run open:android   # opens Android Studio
npm run open:ios       # opens Xcode
```

## Mobile controls

- **Tap** — reveal (or flag, in flag mode)
- **Long-press** — flag (or chord-reveal a numbered cell)
- **Toggle button** — switch between Reveal/Flag mode for thumb-friendly play
