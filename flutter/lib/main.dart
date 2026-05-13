import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  runApp(const MinesweeperApp());
}

class MinesweeperApp extends StatelessWidget {
  const MinesweeperApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Minesweeper',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0C1024),
        useMaterial3: true,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF4CC9F0),
          secondary: Color(0xFFB388FF),
          surface: Color(0xFF161A3A),
        ),
        fontFamily: 'Menlo',
      ),
      home: const GamePage(),
    );
  }
}

enum GameStatus { idle, playing, won, lost }

class Cell {
  bool mine = false;
  bool revealed = false;
  bool flagged = false;
  bool questioned = false;
  int adjacent = 0;
  bool exploded = false;
  bool wrongFlag = false;
}

class Preset {
  final String name;
  final int rows, cols, mines;
  const Preset(this.name, this.rows, this.cols, this.mines);
}

const presets = [
  Preset('Beginner', 9, 9, 10),
  Preset('Intermediate', 16, 16, 40),
  Preset('Expert', 16, 30, 99),
];

class Game {
  final int rows, cols, mines;
  late List<List<Cell>> cells;
  int flags = 0;
  bool firstClick = true;
  GameStatus status = GameStatus.idle;
  DateTime? startedAt;
  DateTime? endedAt;
  final _rand = Random();

  Game(this.rows, this.cols, this.mines) {
    cells = List.generate(rows, (_) => List.generate(cols, (_) => Cell()));
  }

  bool _inB(int r, int c) => r >= 0 && r < rows && c >= 0 && c < cols;

  void _place(int sr, int sc) {
    final safe = <int>{};
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      final rr = sr + dr, cc = sc + dc;
      if (_inB(rr, cc)) safe.add(rr * cols + cc);
    }
    final cands = <List<int>>[];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      if (!safe.contains(r * cols + c)) cands.add([r, c]);
    }
    cands.shuffle(_rand);
    for (var i = 0; i < min(mines, cands.length); i++) {
      cells[cands[i][0]][cands[i][1]].mine = true;
    }
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      if (!cells[r][c].mine) cells[r][c].adjacent = _adj(r, c);
    }
  }

  int _adj(int r, int c) {
    var n = 0;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (dr == 0 && dc == 0) continue;
      final rr = r + dr, cc = c + dc;
      if (_inB(rr, cc) && cells[rr][cc].mine) n++;
    }
    return n;
  }

  void reveal(int r, int c) {
    if (status == GameStatus.won || status == GameStatus.lost) return;
    final cell = cells[r][c];
    if (cell.revealed || cell.flagged) return;
    if (firstClick) {
      _place(r, c);
      firstClick = false;
      status = GameStatus.playing;
      startedAt = DateTime.now();
    }
    _flood(r, c);
    if (cell.mine) {
      cell.exploded = true;
      _revealAll();
      status = GameStatus.lost;
      endedAt = DateTime.now();
      return;
    }
    if (_win()) {
      status = GameStatus.won;
      endedAt = DateTime.now();
    }
  }

  void _flood(int r, int c) {
    final stack = [[r, c]];
    while (stack.isNotEmpty) {
      final p = stack.removeLast();
      final cr = p[0], cc = p[1];
      final cell = cells[cr][cc];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (cell.mine || cell.adjacent > 0) continue;
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (dr == 0 && dc == 0) continue;
        final nr = cr + dr, nc = cc + dc;
        if (_inB(nr, nc) && !cells[nr][nc].revealed) stack.add([nr, nc]);
      }
    }
  }

  void toggleFlag(int r, int c) {
    if (status == GameStatus.won || status == GameStatus.lost) return;
    final cell = cells[r][c];
    if (cell.revealed) return;
    if (!cell.flagged && !cell.questioned) { cell.flagged = true; flags++; }
    else if (cell.flagged) { cell.flagged = false; cell.questioned = true; flags--; }
    else { cell.questioned = false; }
  }

  void chord(int r, int c) {
    if (firstClick || status != GameStatus.playing) return;
    final cell = cells[r][c];
    if (!cell.revealed || cell.adjacent == 0) return;
    var flagged = 0;
    final hidden = <List<int>>[];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (dr == 0 && dc == 0) continue;
      final rr = r + dr, cc = c + dc;
      if (!_inB(rr, cc)) continue;
      final n = cells[rr][cc];
      if (n.flagged) flagged++; else if (!n.revealed) hidden.add([rr, cc]);
    }
    if (flagged != cell.adjacent) return;
    for (final h in hidden) {
      reveal(h[0], h[1]);
      if (status == GameStatus.lost) return;
    }
  }

  void _revealAll() {
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      final cell = cells[r][c];
      if (cell.mine && !cell.flagged) cell.revealed = true;
      if (!cell.mine && cell.flagged) { cell.wrongFlag = true; cell.revealed = true; }
    }
  }

  bool _win() {
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      if (!cells[r][c].mine && !cells[r][c].revealed) return false;
    }
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      final cell = cells[r][c];
      if (cell.mine && !cell.flagged) { cell.flagged = true; flags++; }
    }
    return true;
  }

  int get minesRemaining => max(0, mines - flags);
  int get elapsed {
    if (startedAt == null) return 0;
    final end = (status == GameStatus.won || status == GameStatus.lost) ? endedAt! : DateTime.now();
    return min(end.difference(startedAt!).inSeconds, 999);
  }
}

class GamePage extends StatefulWidget {
  const GamePage({super.key});
  @override
  State<GamePage> createState() => _GamePageState();
}

class _GamePageState extends State<GamePage> {
  late Game game;
  Preset preset = presets[0];
  bool flagMode = false;
  Timer? _timer;

  static const numColors = [
    Colors.transparent,
    Color(0xFF4CC9F0),
    Color(0xFF6EF0A3),
    Color(0xFFFF5C8D),
    Color(0xFFB388FF),
    Color(0xFFFFB454),
    Color(0xFF4AD7D1),
    Color(0xFFE9ECFF),
    Color(0xFF8D92C7),
  ];

  @override
  void initState() {
    super.initState();
    game = Game(preset.rows, preset.cols, preset.mines);
    _timer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (game.status == GameStatus.playing) setState(() {});
    });
  }

  @override
  void dispose() { _timer?.cancel(); super.dispose(); }

  void newGame(Preset p) {
    setState(() {
      preset = p;
      game = Game(p.rows, p.cols, p.mines);
    });
  }

  String _pad(int n) => n.toString().padLeft(3, '0');

  @override
  Widget build(BuildContext context) {
    final cellSize = game.cols > 16 ? 22.0 : 28.0;
    return SafeArea(
      child: Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              _buildHud(),
              const SizedBox(height: 12),
              Expanded(
                child: Stack(
                  children: [
                    Center(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: SingleChildScrollView(
                          child: _buildBoard(cellSize),
                        ),
                      ),
                    ),
                    if (game.status == GameStatus.won || game.status == GameStatus.lost)
                      IgnorePointer(
                        child: Center(
                          child: Text(
                            game.status == GameStatus.won ? '✨ VICTORY ✨' : '💥 BOOM 💥',
                            style: TextStyle(
                              fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: 4,
                              color: game.status == GameStatus.won
                                  ? const Color(0xFF6EF0A3) : const Color(0xFFFF5C8D),
                              shadows: const [Shadow(blurRadius: 18, color: Colors.black87)],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text('Tap reveal · Long-press flag · Toggle mode for fast flagging',
                  style: TextStyle(color: Color(0xFF8D92C7), fontSize: 11)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHud() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [Color(0xFF161A3A), Color(0xFF1F2452)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF262B66)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          const Text('MINE·SWEEPER · FLUTTER',
            style: TextStyle(color: Color(0xFF4CC9F0), letterSpacing: 4, fontWeight: FontWeight.w800, fontSize: 12)),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            _counter(_pad(game.minesRemaining), const Color(0xFFFF3B6B)),
            GestureDetector(
              onTap: () => newGame(preset),
              child: Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const RadialGradient(colors: [Color(0xFFFFE169), Color(0xFFB58800)], stops: [0.3, 1.0]),
                ),
                child: Center(child: Text(
                  game.status == GameStatus.lost ? '😵' : game.status == GameStatus.won ? '😎' : '🙂',
                  style: const TextStyle(fontSize: 28))),
              ),
            ),
            _counter(_pad(game.elapsed), const Color(0xFF4CC9F0)),
          ]),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center,
            children: presets.map((p) => _pill(p.name, preset == p, () => newGame(p))).toList()),
          const SizedBox(height: 8),
          Wrap(spacing: 8, alignment: WrapAlignment.center, children: [
            _pill('⛏ Reveal', !flagMode, () => setState(() => flagMode = false)),
            _pill('⚑ Flag', flagMode, () => setState(() => flagMode = true), flagColor: true),
          ]),
        ],
      ),
    );
  }

  Widget _counter(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      constraints: const BoxConstraints(minWidth: 92),
      decoration: BoxDecoration(
        color: const Color(0xFF100020),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(text,
        textAlign: TextAlign.center,
        style: TextStyle(color: color, fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: 2,
          shadows: [Shadow(color: color, blurRadius: 12)])),
    );
  }

  Widget _pill(String label, bool active, VoidCallback onTap, {bool flagColor = false}) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? (flagColor ? const Color(0xFFB388FF) : const Color(0xFF4CC9F0)) : const Color(0xFF1F2452),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: active ? Colors.transparent : const Color(0xFF2C3275)),
        ),
        child: Text(label, style: TextStyle(
          color: active ? const Color(0xFF04101C) : const Color(0xFFE9ECFF),
          fontWeight: active ? FontWeight.w700 : FontWeight.w500, fontSize: 13)),
      ),
    );
  }

  Widget _buildBoard(double size) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: const Color(0xFF1B2050),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(game.rows, (r) => Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(game.cols, (c) => _buildCell(r, c, size)),
        )),
      ),
    );
  }

  Widget _buildCell(int r, int c, double size) {
    final cell = game.cells[r][c];
    Color bg = const Color(0xFF353A78);
    Color fg = const Color(0xFFE9ECFF);
    String text = '';
    if (cell.revealed) {
      bg = const Color(0xFF0F1330);
      if (cell.exploded) bg = const Color(0xFF6B0E2A);
      else if (cell.mine) bg = const Color(0xFF2A0F1C);
      if (cell.wrongFlag) { fg = const Color(0xFFFF5C8D); text = '✕'; }
      else if (cell.mine) { fg = const Color(0xFFFF5C8D); text = '✱'; }
      else if (cell.adjacent > 0) { fg = numColors[cell.adjacent]; text = '${cell.adjacent}'; }
    } else if (cell.flagged) { fg = const Color(0xFFB388FF); text = '⚑'; }
    else if (cell.questioned) { fg = const Color(0xFFFFB454); text = '?'; }
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          if (cell.revealed && cell.adjacent > 0) game.chord(r, c);
          else if (flagMode) game.toggleFlag(r, c);
          else game.reveal(r, c);
        });
      },
      onLongPress: () {
        HapticFeedback.mediumImpact();
        setState(() {
          if (cell.revealed && cell.adjacent > 0) game.chord(r, c);
          else game.toggleFlag(r, c);
        });
      },
      child: Container(
        width: size, height: size,
        margin: const EdgeInsets.all(1),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4)),
        alignment: Alignment.center,
        child: Text(text, style: TextStyle(color: fg, fontWeight: FontWeight.w800, fontSize: size - 12)),
      ),
    );
  }
}
