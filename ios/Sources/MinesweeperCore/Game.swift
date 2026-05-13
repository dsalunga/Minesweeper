import Foundation

public enum CellState { case hidden, revealed, flagged, questioned }
public enum GameStatus { case idle, playing, won, lost }

public final class Cell {
    public let row: Int
    public let col: Int
    public var mine = false
    public var state: CellState = .hidden
    public var adjacent = 0
    public var exploded = false
    public var wrongFlag = false
    public init(_ r: Int, _ c: Int) { row = r; col = c }
}

public struct Preset: Hashable {
    public let name: String
    public let rows: Int
    public let cols: Int
    public let mines: Int
    public init(_ n: String, _ r: Int, _ c: Int, _ m: Int) { name = n; rows = r; cols = c; mines = m }
    public static let beginner = Preset("Beginner", 9, 9, 10)
    public static let intermediate = Preset("Intermediate", 16, 16, 40)
    public static let expert = Preset("Expert", 16, 30, 99)
    public static let all: [Preset] = [.beginner, .intermediate, .expert]
}

public final class Game {
    public let rows: Int
    public let cols: Int
    public let mines: Int
    public private(set) var cells: [[Cell]]
    public private(set) var flags = 0
    public private(set) var firstClick = true
    public private(set) var status: GameStatus = .idle
    public private(set) var startedAt: Date?
    public private(set) var endedAt: Date?

    public init(_ p: Preset) {
        rows = p.rows; cols = p.cols; mines = p.mines
        cells = (0..<p.rows).map { r in (0..<p.cols).map { c in Cell(r, c) } }
    }

    public var minesRemaining: Int { max(mines - flags, 0) }
    public var elapsedSeconds: Int {
        guard let s = startedAt else { return 0 }
        let end: Date
        if status == .won || status == .lost, let e = endedAt { end = e } else { end = Date() }
        return min(Int(end.timeIntervalSince(s)), 999)
    }

    private func inB(_ r: Int, _ c: Int) -> Bool { r >= 0 && r < rows && c >= 0 && c < cols }

    private func placeMines(safeRow sr: Int, safeCol sc: Int) {
        var safe = Set<Int>()
        for dr in -1...1 { for dc in -1...1 where inB(sr+dr, sc+dc) { safe.insert((sr+dr)*cols + (sc+dc)) } }
        var cands: [Int] = []
        for r in 0..<rows { for c in 0..<cols where !safe.contains(r*cols + c) { cands.append(r*cols + c) } }
        cands.shuffle()
        for idx in cands.prefix(min(mines, cands.count)) {
            cells[idx / cols][idx % cols].mine = true
        }
        for r in 0..<rows {
            for c in 0..<cols where !cells[r][c].mine {
                var n = 0
                for dr in -1...1 { for dc in -1...1 where (dr|dc) != 0 && inB(r+dr, c+dc) && cells[r+dr][c+dc].mine { n += 1 } }
                cells[r][c].adjacent = n
            }
        }
    }

    public func reveal(_ r: Int, _ c: Int) {
        guard status != .won && status != .lost else { return }
        let cell = cells[r][c]
        guard cell.state != .revealed && cell.state != .flagged else { return }
        if firstClick {
            placeMines(safeRow: r, safeCol: c)
            firstClick = false
            status = .playing
            startedAt = Date()
        }
        if cell.mine {
            cell.state = .revealed; cell.exploded = true
            revealAll(); status = .lost; endedAt = Date(); return
        }
        flood(r, c)
        if checkWin() { status = .won; endedAt = Date() }
    }

    private func flood(_ r: Int, _ c: Int) {
        var stack = [(r, c)]
        while let (rr, cc) = stack.popLast() {
            let cell = cells[rr][cc]
            if cell.state == .revealed || cell.state == .flagged || cell.mine { continue }
            cell.state = .revealed
            if cell.adjacent > 0 { continue }
            for dr in -1...1 { for dc in -1...1 where (dr|dc) != 0 && inB(rr+dr, cc+dc) { stack.append((rr+dr, cc+dc)) } }
        }
    }

    public func toggleFlag(_ r: Int, _ c: Int) {
        guard status != .won && status != .lost else { return }
        let cell = cells[r][c]
        guard cell.state != .revealed else { return }
        switch cell.state {
        case .hidden: cell.state = .flagged; flags += 1
        case .flagged: cell.state = .questioned; flags -= 1
        case .questioned: cell.state = .hidden
        case .revealed: break
        }
    }

    public func chord(_ r: Int, _ c: Int) {
        guard status == .playing else { return }
        let cell = cells[r][c]
        guard cell.state == .revealed && cell.adjacent > 0 else { return }
        var flagged = 0
        var hidden: [(Int, Int)] = []
        for dr in -1...1 {
            for dc in -1...1 where (dr|dc) != 0 {
                let nr = r+dr, nc = c+dc
                guard inB(nr, nc) else { continue }
                let n = cells[nr][nc]
                if n.state == .flagged { flagged += 1 }
                else if n.state != .revealed { hidden.append((nr, nc)) }
            }
        }
        guard flagged == cell.adjacent else { return }
        for (hr, hc) in hidden { reveal(hr, hc); if status == .lost { return } }
    }

    private func revealAll() {
        for row in cells {
            for c in row {
                if c.mine && c.state != .flagged { c.state = .revealed }
                if !c.mine && c.state == .flagged { c.wrongFlag = true; c.state = .revealed }
            }
        }
    }

    private func checkWin() -> Bool {
        for row in cells { for c in row where !c.mine && c.state != .revealed { return false } }
        for row in cells {
            for c in row where c.mine && c.state != .flagged { c.state = .flagged; flags += 1 }
        }
        return true
    }
}
