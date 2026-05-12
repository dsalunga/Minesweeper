# Minesweeper Kotlin (JVM)

Console Minesweeper implementation in Kotlin with JUnit 5 tests.

## Requirements

- JDK 17+

## Run the app (CLI)

From repository root:

```bash
cd kotlin
./gradlew run --console=plain -q
```

If `gradlew` is not executable yet on macOS/Linux:

```bash
cd kotlin
chmod +x gradlew
./gradlew run --console=plain -q
```

## Run tests (CLI)

From repository root:

```bash
cd kotlin
./gradlew test
```

## Build

```bash
cd kotlin
./gradlew build
```

## Gameplay notes

- Presets: Beginner (`9x9`, `10`), Intermediate (`16x16`, `40`), Expert (`16x30`, `99`), and Custom.
- Custom constraints: rows `5-26`, cols `5-26`, mines `1` to `rows * cols - 9`.
- Command grammar:
  - `A1` reveal
  - `f A1` toggle flag/question
  - `c A1` chord reveal
  - `n` new game, `q` quit, `h` help

## Optional: Run in IntelliJ IDEA

1. Open the `kotlin` folder as a project.
2. Open `src/main/kotlin/Main.kt`.
3. Run `main()` (`MainKt`).
