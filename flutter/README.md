# Minesweeper · Flutter

Cross-platform Minesweeper for iOS, Android, macOS, Linux, Windows, and Web.

## Run

```bash
cd flutter
flutter pub get
flutter run                # default device
flutter run -d chrome      # web
flutter run -d ios         # iOS simulator (macOS)
flutter run -d android     # Android device/emulator
```

## Controls

- **Tap** — reveal (or flag, in flag mode); chord-reveals on revealed numbered cells
- **Long-press** — flag (or chord on numbered cells)
- **Mode toggle** — switch between Reveal / Flag for fast thumb flagging
- **Presets** — Beginner / Intermediate / Expert
