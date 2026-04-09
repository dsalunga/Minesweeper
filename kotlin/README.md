# Minesweeper Kotlin (JVM)

Console Minesweeper implementation in Kotlin with JUnit 5 tests.

## Requirements

- JDK 22+
- IntelliJ IDEA (recommended for running the app entrypoint)

## Run the app (IntelliJ IDEA)

1. Open the `kotlin` folder as a project in IntelliJ IDEA.
2. Open `src/main/kotlin/Main.kt`.
3. Run `main()` (`MainKt`).

## Run tests (CLI)

From repository root:

```bash
cd kotlin
bash ./gradlew test
```

If you prefer running `./gradlew` directly on macOS/Linux, make it executable once:

```bash
cd kotlin
chmod +x gradlew
./gradlew test
```

## Build

```bash
cd kotlin
bash ./gradlew build
```

## Gameplay notes

- Grid size accepts values from `4` to `26`.
- Mine count must be at least `1` and up to `35%` of total cells.
- Squares are selected using coordinates like `A1`.
