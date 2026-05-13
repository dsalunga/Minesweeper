# Minesweeper · Android (Jetpack Compose)

Native Android Minesweeper written in Kotlin + Jetpack Compose for API 24+.

## Project layout

```
android/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle/wrapper/gradle-wrapper.properties
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        └── java/com/dsalunga/minesweeper/
            ├── MainActivity.kt
            ├── Game.kt
            └── ui/MinesweeperApp.kt
```

## Run

1. Open the `android/` folder in Android Studio Hedgehog (2023.1) or newer.
2. Let Gradle sync (it will download Gradle 8.5, AGP 8.2.2, Compose BOM
   2024.02.01).
3. Choose an emulator or device (API 24+) and run the **app** configuration.

## Controls

- **Tap** reveal (or chord on a numbered revealed cell).
- **Long-press** to cycle flag → ? → hidden.
- Toggle *Flag mode* to reveal-by-flagging on touch devices.
- Tap a preset chip for Beginner/Intermediate/Expert.

The Compose code lives in `MinesweeperApp.kt`; the engine is `Game.kt` and is
pure Kotlin so it can be reused or unit-tested independently.
