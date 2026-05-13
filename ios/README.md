# Minesweeper · iOS (SwiftUI)

Native iOS Minesweeper written in SwiftUI for iOS 16+. Game logic is in a
reusable Swift package (`MinesweeperCore`) so it can also be used from macOS,
unit tests, or future watchOS targets.

## Layout

```
ios/
├── Package.swift                     # SwiftPM (MinesweeperCore library)
├── Sources/MinesweeperCore/Game.swift
└── MinesweeperApp/MinesweeperApp.swift  # SwiftUI @main app
```

## Run

The simplest path on a Mac with Xcode 15+:

1. Open Xcode → *File ▸ New ▸ Project ▸ iOS App*. Name it `Minesweeper`,
   interface **SwiftUI**, language **Swift**.
2. Delete the auto-generated `ContentView.swift` and `MinesweeperApp.swift`.
3. Drag `ios/MinesweeperApp/MinesweeperApp.swift` into the project (copy
   reference).
4. Add a Swift package dependency: *File ▸ Add Packages…* → *Add Local…*
   pointing at `ios/`. Select the `MinesweeperCore` library product.
5. Run on the iOS Simulator (iPhone 15) or a device.

## Controls

- **Tap** reveal (or chord on a numbered revealed cell).
- **Long-press** to cycle flag → ? → hidden.
- Toggle *Flag mode* to reveal-by-flagging on touch devices.
- Tap a preset pill for Beginner/Intermediate/Expert.
