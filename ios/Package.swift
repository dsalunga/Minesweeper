// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Minesweeper",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "MinesweeperCore", targets: ["MinesweeperCore"])
    ],
    targets: [
        .target(name: "MinesweeperCore", path: "Sources/MinesweeperCore")
    ]
)
