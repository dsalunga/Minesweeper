import SwiftUI
import MinesweeperCore

@main
struct MinesweeperApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}

struct Theme {
    static let bg = Color(red: 12/255, green: 16/255, blue: 36/255)
    static let panel = Color(red: 22/255, green: 26/255, blue: 58/255)
    static let panel2 = Color(red: 31/255, green: 36/255, blue: 82/255)
    static let ink = Color(red: 233/255, green: 236/255, blue: 255/255)
    static let muted = Color(red: 141/255, green: 146/255, blue: 199/255)
    static let accent = Color(red: 76/255, green: 201/255, blue: 240/255)
    static let accent2 = Color(red: 179/255, green: 136/255, blue: 255/255)
    static let danger = Color(red: 255/255, green: 92/255, blue: 141/255)
    static let good = Color(red: 110/255, green: 240/255, blue: 163/255)
    static let hidden = Color(red: 53/255, green: 58/255, blue: 120/255)
    static let revealed = Color(red: 15/255, green: 19/255, blue: 48/255)

    static func numberColor(_ n: Int) -> Color {
        switch n {
        case 1: return accent
        case 2: return good
        case 3: return danger
        case 4: return accent2
        case 5: return Color(red: 1, green: 180/255, blue: 84/255)
        case 6: return Color(red: 74/255, green: 215/255, blue: 209/255)
        case 7: return ink
        default: return muted
        }
    }
}

@MainActor
final class GameModel: ObservableObject {
    @Published private(set) var game: Game
    @Published var preset: Preset = .beginner
    @Published var flagMode = false
    @Published var tick = 0

    private var timer: Timer?

    init() {
        game = Game(.beginner)
        timer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick &+= 1 }
        }
    }

    func newGame(_ p: Preset) {
        preset = p
        game = Game(p)
    }

    func tap(_ r: Int, _ c: Int) {
        let cell = game.cells[r][c]
        if flagMode {
            game.toggleFlag(r, c)
        } else if cell.state == .revealed && cell.adjacent > 0 {
            game.chord(r, c)
        } else {
            game.reveal(r, c)
        }
        objectWillChange.send()
    }

    func longPress(_ r: Int, _ c: Int) {
        game.toggleFlag(r, c)
        objectWillChange.send()
    }
}

struct ContentView: View {
    @StateObject private var model = GameModel()

    var body: some View {
        ZStack {
            LinearGradient(colors: [Theme.bg, Theme.panel], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            VStack(spacing: 14) {
                Text("MINE·SWEEPER · iOS")
                    .font(.caption.bold())
                    .foregroundColor(Theme.accent)
                    .padding(.top, 4)

                hud

                presets

                modeToggle

                ScrollView([.horizontal, .vertical]) {
                    board
                        .padding(8)
                        .background(Color(red: 27/255, green: 32/255, blue: 80/255))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Text("Tap reveal · Long-press flag · Tap a number to chord")
                    .font(.caption2).foregroundColor(Theme.muted)
            }
            .padding(.horizontal, 16)

            if model.game.status == .won || model.game.status == .lost {
                banner
            }
        }
    }

    private var hud: some View {
        HStack {
            Text(String(format: "%03d", model.game.minesRemaining))
                .font(.system(.title, design: .monospaced).bold())
                .foregroundColor(Theme.danger)
                .padding(.horizontal, 12).padding(.vertical, 4)
                .background(Color(red: 16/255, green: 0, blue: 32/255))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            Spacer()
            Button(action: { model.newGame(model.preset) }) {
                Text(face).font(.title)
            }
            .frame(width: 52, height: 52)
            .background(Color(red: 245/255, green: 197/255, blue: 24/255))
            .clipShape(Circle())
            Spacer()
            Text(String(format: "%03d", model.game.elapsedSeconds))
                .font(.system(.title, design: .monospaced).bold())
                .foregroundColor(Theme.accent)
                .padding(.horizontal, 12).padding(.vertical, 4)
                .background(Color(red: 16/255, green: 0, blue: 32/255))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .padding(12)
        .background(Theme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var face: String {
        switch model.game.status {
        case .lost: return "😵"
        case .won: return "😎"
        default: return "🙂"
        }
    }

    private var presets: some View {
        HStack(spacing: 8) {
            ForEach(Preset.all, id: \.name) { p in
                Button(p.name) { model.newGame(p) }
                    .font(.subheadline.bold())
                    .padding(.horizontal, 16).padding(.vertical, 8)
                    .background(p == model.preset ? Theme.accent : Theme.panel2)
                    .foregroundColor(p == model.preset ? .black : Theme.ink)
                    .clipShape(Capsule())
            }
        }
    }

    private var modeToggle: some View {
        Button(action: { model.flagMode.toggle() }) {
            Label(model.flagMode ? "Flag mode (on)" : "Flag mode",
                  systemImage: "flag.fill")
                .font(.footnote.bold())
                .padding(.horizontal, 14).padding(.vertical, 6)
                .background(model.flagMode ? Theme.accent2 : Theme.panel2)
                .foregroundColor(model.flagMode ? .black : Theme.ink)
                .clipShape(Capsule())
        }
    }

    private var board: some View {
        VStack(spacing: 2) {
            ForEach(0..<model.game.rows, id: \.self) { r in
                HStack(spacing: 2) {
                    ForEach(0..<model.game.cols, id: \.self) { c in
                        cellView(r: r, c: c)
                    }
                }
            }
        }
    }

    private func cellView(r: Int, c: Int) -> some View {
        let cell = model.game.cells[r][c]
        let size: CGFloat = model.game.cols > 16 ? 24 : 30
        return ZStack {
            RoundedRectangle(cornerRadius: 4)
                .fill(cellBg(cell))
            Text(label(cell))
                .font(.system(size: size * 0.55, weight: .heavy, design: .monospaced))
                .foregroundColor(textColor(cell))
        }
        .frame(width: size, height: size)
        .onTapGesture { model.tap(r, c) }
        .onLongPressGesture(minimumDuration: 0.28) { model.longPress(r, c) }
    }

    private func cellBg(_ cell: Cell) -> Color {
        if cell.state == .revealed {
            if cell.exploded { return Color(red: 107/255, green: 14/255, blue: 42/255) }
            if cell.mine { return Color(red: 42/255, green: 15/255, blue: 28/255) }
            return Theme.revealed
        }
        return Theme.hidden
    }

    private func label(_ cell: Cell) -> String {
        if cell.wrongFlag { return "✕" }
        switch cell.state {
        case .flagged: return "⚑"
        case .questioned: return "?"
        case .revealed:
            if cell.mine { return "✱" }
            return cell.adjacent > 0 ? "\(cell.adjacent)" : ""
        case .hidden: return ""
        }
    }

    private func textColor(_ cell: Cell) -> Color {
        if cell.wrongFlag { return Theme.danger }
        switch cell.state {
        case .flagged: return Theme.accent2
        case .questioned: return Color(red: 1, green: 180/255, blue: 84/255)
        case .revealed:
            if cell.mine { return Theme.danger }
            return Theme.numberColor(cell.adjacent)
        case .hidden: return Theme.ink
        }
    }

    private var banner: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            VStack(spacing: 12) {
                Text(model.game.status == .won ? "✨ VICTORY ✨" : "💥 BOOM 💥")
                    .font(.largeTitle.bold())
                    .foregroundColor(model.game.status == .won ? Theme.good : Theme.danger)
                Button("Play again") { model.newGame(model.preset) }
                    .padding(.horizontal, 20).padding(.vertical, 10)
                    .background(Theme.accent)
                    .foregroundColor(.black)
                    .clipShape(Capsule())
            }
        }
    }
}
