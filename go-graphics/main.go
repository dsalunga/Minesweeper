// Minesweeper rendered with Ebitengine — full-featured, neon themed.
package main

import (
	"fmt"
	"image/color"
	"log"
	"math/rand"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/inpututil"
	"github.com/hajimehoshi/ebiten/v2/text/v2"
	"github.com/hajimehoshi/ebiten/v2/vector"
	"golang.org/x/image/font/basicfont"
)

// ---------- engine ----------

type status int

const (
	statusIdle status = iota
	statusPlaying
	statusWon
	statusLost
)

type cell struct {
	mine, revealed, flagged, questioned, exploded, wrongFlag bool
	adjacent                                                 int
}

type preset struct {
	name             string
	rows, cols, mines int
}

var presets = []preset{
	{"Beginner", 9, 9, 10},
	{"Intermediate", 16, 16, 40},
	{"Expert", 16, 30, 99},
}

type game struct {
	rows, cols, mines int
	cells             [][]cell
	flags             int
	firstClick        bool
	status            status
	startedAt         time.Time
	endedAt           time.Time
}

func newGame(rows, cols, mines int) *game {
	g := &game{rows: rows, cols: cols, mines: mines, firstClick: true, status: statusIdle}
	g.cells = make([][]cell, rows)
	for r := range g.cells {
		g.cells[r] = make([]cell, cols)
	}
	return g
}

func (g *game) inB(r, c int) bool { return r >= 0 && r < g.rows && c >= 0 && c < g.cols }

func (g *game) placeMines(sr, sc int) {
	safe := map[int]bool{}
	for dr := -1; dr <= 1; dr++ {
		for dc := -1; dc <= 1; dc++ {
			rr, cc := sr+dr, sc+dc
			if g.inB(rr, cc) {
				safe[rr*g.cols+cc] = true
			}
		}
	}
	cands := make([][2]int, 0, g.rows*g.cols)
	for r := 0; r < g.rows; r++ {
		for c := 0; c < g.cols; c++ {
			if !safe[r*g.cols+c] {
				cands = append(cands, [2]int{r, c})
			}
		}
	}
	rand.Shuffle(len(cands), func(i, j int) { cands[i], cands[j] = cands[j], cands[i] })
	n := g.mines
	if n > len(cands) {
		n = len(cands)
	}
	for i := 0; i < n; i++ {
		g.cells[cands[i][0]][cands[i][1]].mine = true
	}
	for r := 0; r < g.rows; r++ {
		for c := 0; c < g.cols; c++ {
			if g.cells[r][c].mine {
				continue
			}
			n := 0
			for dr := -1; dr <= 1; dr++ {
				for dc := -1; dc <= 1; dc++ {
					if dr == 0 && dc == 0 {
						continue
					}
					rr, cc := r+dr, c+dc
					if g.inB(rr, cc) && g.cells[rr][cc].mine {
						n++
					}
				}
			}
			g.cells[r][c].adjacent = n
		}
	}
}

func (g *game) reveal(r, c int) {
	if g.status == statusWon || g.status == statusLost {
		return
	}
	cell := &g.cells[r][c]
	if cell.revealed || cell.flagged {
		return
	}
	if g.firstClick {
		g.placeMines(r, c)
		g.firstClick = false
		g.status = statusPlaying
		g.startedAt = time.Now()
	}
	g.flood(r, c)
	if cell.mine {
		cell.exploded = true
		g.revealAll()
		g.status = statusLost
		g.endedAt = time.Now()
		return
	}
	if g.win() {
		g.status = statusWon
		g.endedAt = time.Now()
	}
}

func (g *game) flood(r, c int) {
	stack := [][2]int{{r, c}}
	for len(stack) > 0 {
		p := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		cell := &g.cells[p[0]][p[1]]
		if cell.revealed || cell.flagged {
			continue
		}
		cell.revealed = true
		if cell.mine || cell.adjacent > 0 {
			continue
		}
		for dr := -1; dr <= 1; dr++ {
			for dc := -1; dc <= 1; dc++ {
				if dr == 0 && dc == 0 {
					continue
				}
				nr, nc := p[0]+dr, p[1]+dc
				if g.inB(nr, nc) && !g.cells[nr][nc].revealed {
					stack = append(stack, [2]int{nr, nc})
				}
			}
		}
	}
}

func (g *game) toggleFlag(r, c int) {
	if g.status == statusWon || g.status == statusLost {
		return
	}
	cell := &g.cells[r][c]
	if cell.revealed {
		return
	}
	switch {
	case !cell.flagged && !cell.questioned:
		cell.flagged = true
		g.flags++
	case cell.flagged:
		cell.flagged = false
		cell.questioned = true
		g.flags--
	default:
		cell.questioned = false
	}
}

func (g *game) chord(r, c int) {
	if g.firstClick || g.status != statusPlaying {
		return
	}
	cell := g.cells[r][c]
	if !cell.revealed || cell.adjacent == 0 {
		return
	}
	flagged := 0
	hidden := [][2]int{}
	for dr := -1; dr <= 1; dr++ {
		for dc := -1; dc <= 1; dc++ {
			if dr == 0 && dc == 0 {
				continue
			}
			rr, cc := r+dr, c+dc
			if !g.inB(rr, cc) {
				continue
			}
			n := g.cells[rr][cc]
			if n.flagged {
				flagged++
			} else if !n.revealed {
				hidden = append(hidden, [2]int{rr, cc})
			}
		}
	}
	if flagged != cell.adjacent {
		return
	}
	for _, h := range hidden {
		g.reveal(h[0], h[1])
		if g.status == statusLost {
			return
		}
	}
}

func (g *game) revealAll() {
	for r := 0; r < g.rows; r++ {
		for c := 0; c < g.cols; c++ {
			cell := &g.cells[r][c]
			if cell.mine && !cell.flagged {
				cell.revealed = true
			}
			if !cell.mine && cell.flagged {
				cell.wrongFlag = true
				cell.revealed = true
			}
		}
	}
}

func (g *game) win() bool {
	for r := 0; r < g.rows; r++ {
		for c := 0; c < g.cols; c++ {
			if !g.cells[r][c].mine && !g.cells[r][c].revealed {
				return false
			}
		}
	}
	for r := 0; r < g.rows; r++ {
		for c := 0; c < g.cols; c++ {
			cell := &g.cells[r][c]
			if cell.mine && !cell.flagged {
				cell.flagged = true
				g.flags++
			}
		}
	}
	return true
}

func (g *game) minesRemaining() int {
	n := g.mines - g.flags
	if n < 0 {
		return 0
	}
	return n
}

func (g *game) elapsed() int {
	if g.startedAt.IsZero() {
		return 0
	}
	end := time.Now()
	if g.status == statusWon || g.status == statusLost {
		end = g.endedAt
	}
	d := int(end.Sub(g.startedAt).Seconds())
	if d > 999 {
		d = 999
	}
	return d
}

// ---------- view ----------

const (
	cellSize     = 30
	gap          = 2
	pad          = 10
	hudHeight    = 130
	topMargin    = 20
	sideMargin   = 20
	hintHeight   = 30
)

var (
	bg          = color.RGBA{12, 16, 36, 255}
	panel       = color.RGBA{22, 26, 58, 255}
	panel2      = color.RGBA{31, 36, 82, 255}
	ink         = color.RGBA{233, 236, 255, 255}
	muted       = color.RGBA{141, 146, 199, 255}
	accent      = color.RGBA{76, 201, 240, 255}
	accent2     = color.RGBA{179, 136, 255, 255}
	danger      = color.RGBA{255, 92, 141, 255}
	good        = color.RGBA{110, 240, 163, 255}
	hiddenC     = color.RGBA{53, 58, 120, 255}
	revealedC   = color.RGBA{15, 19, 48, 255}
	gridC       = color.RGBA{27, 32, 80, 255}
	ledRed      = color.RGBA{255, 59, 107, 255}
	ledBg       = color.RGBA{16, 0, 32, 255}
	mineBg      = color.RGBA{42, 15, 28, 255}
	explodedBg  = color.RGBA{107, 14, 42, 255}
	yellow      = color.RGBA{245, 197, 24, 255}
	yellowDark  = color.RGBA{181, 136, 0, 255}
	pillBorder  = color.RGBA{44, 50, 117, 255}
	hudBorder   = color.RGBA{38, 43, 102, 255}
)

var numColors = map[int]color.RGBA{
	1: {76, 201, 240, 255},
	2: {110, 240, 163, 255},
	3: {255, 92, 141, 255},
	4: {179, 136, 255, 255},
	5: {255, 180, 84, 255},
	6: {74, 215, 209, 255},
	7: {233, 236, 255, 255},
	8: {141, 146, 199, 255},
}

type App struct {
	game       *game
	preset     int
	textFace   text.Face
	bigFace    text.Face
	bannerFace text.Face
	leftDown   bool
	rightDown  bool
}

func newApp() *App {
	a := &App{game: newGame(presets[0].rows, presets[0].cols, presets[0].mines), preset: 0}
	a.textFace = text.NewGoXFace(basicfont.Face7x13)
	a.bigFace = text.NewGoXFace(basicfont.Face7x13)
	a.bannerFace = text.NewGoXFace(basicfont.Face7x13)
	return a
}

func (a *App) reset(p int) {
	a.preset = p
	a.game = newGame(presets[p].rows, presets[p].cols, presets[p].mines)
}

func (a *App) Layout(_, _ int) (int, int) {
	g := a.game
	boardW := g.cols*cellSize + (g.cols-1)*gap + 2*pad
	boardH := g.rows*cellSize + (g.rows-1)*gap + 2*pad
	w := boardW + 2*sideMargin
	if w < 600 {
		w = 600
	}
	h := topMargin + hudHeight + 14 + boardH + hintHeight
	return w, h
}

func (a *App) Update() error {
	mx, my := ebiten.CursorPosition()

	if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) {
		a.leftDown = true
		// preset bar
		for i := range presets {
			if presetRect(i).contains(mx, my) {
				a.reset(i)
				return nil
			}
		}
		// face
		if faceRect().contains(mx, my) {
			a.reset(a.preset)
			return nil
		}
	}
	if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonRight) {
		a.rightDown = true
	}

	if inpututil.IsMouseButtonJustReleased(ebiten.MouseButtonLeft) {
		if r, c, ok := cellAt(a.game, mx, my); ok && a.game.status != statusWon && a.game.status != statusLost {
			if a.rightDown {
				a.game.chord(r, c)
			} else {
				a.game.reveal(r, c)
			}
		}
		a.leftDown = false
	}
	if inpututil.IsMouseButtonJustReleased(ebiten.MouseButtonRight) {
		if r, c, ok := cellAt(a.game, mx, my); ok && a.game.status != statusWon && a.game.status != statusLost {
			if a.leftDown {
				a.game.chord(r, c)
			} else {
				a.game.toggleFlag(r, c)
			}
		}
		a.rightDown = false
	}
	if inpututil.IsMouseButtonJustReleased(ebiten.MouseButtonMiddle) {
		if r, c, ok := cellAt(a.game, mx, my); ok && a.game.status != statusWon && a.game.status != statusLost {
			a.game.chord(r, c)
		}
	}
	return nil
}

type rect struct{ x, y, w, h float32 }

func (r rect) contains(x, y int) bool {
	fx, fy := float32(x), float32(y)
	return fx >= r.x && fx < r.x+r.w && fy >= r.y && fy < r.y+r.h
}

func faceRect() rect {
	w := float32(currentWidth)
	return rect{w/2 - 26, topMargin + 38, 52, 52}
}
func presetRect(i int) rect {
	pillW, pillH := float32(120), float32(30)
	gap := float32(8)
	total := float32(len(presets))*pillW + float32(len(presets)-1)*gap
	x0 := (float32(currentWidth) - total) / 2
	return rect{x0 + float32(i)*(pillW+gap), topMargin + hudHeight - 38, pillW, pillH}
}

func boardOrigin(g *game) (float32, float32) {
	boardW := float32(g.cols*cellSize + (g.cols-1)*gap + 2*pad)
	x := (float32(currentWidth) - boardW) / 2
	y := float32(topMargin + hudHeight + 14)
	return x, y
}

func cellAt(g *game, mx, my int) (int, int, bool) {
	ox, oy := boardOrigin(g)
	x := float32(mx) - ox - pad
	y := float32(my) - oy - pad
	if x < 0 || y < 0 {
		return 0, 0, false
	}
	cw := float32(cellSize + gap)
	c := int(x / cw)
	r := int(y / cw)
	if r < 0 || r >= g.rows || c < 0 || c >= g.cols {
		return 0, 0, false
	}
	if x-float32(c)*cw >= cellSize || y-float32(r)*cw >= cellSize {
		return 0, 0, false
	}
	return r, c, true
}

var currentWidth, currentHeight int

func (a *App) Draw(screen *ebiten.Image) {
	currentWidth, currentHeight = screen.Bounds().Dx(), screen.Bounds().Dy()
	screen.Fill(bg)

	// hud panel
	hud := rect{sideMargin, topMargin, float32(currentWidth - 2*sideMargin), hudHeight}
	fillRoundedRect(screen, hud, 16, panel)
	strokeRoundedRect(screen, hud, 16, hudBorder, 1)

	drawText(screen, "MINE·SWEEPER · GO", a.textFace, accent,
		float64(hud.x+hud.w/2), float64(hud.y+18), text.AlignCenter)

	// counters
	mines := fmt.Sprintf("%03d", a.game.minesRemaining())
	timer := fmt.Sprintf("%03d", a.game.elapsed())
	drawCounter(screen, mines, ledRed, rect{hud.x + 24, hud.y + 38, 100, 38}, a.bigFace)
	drawCounter(screen, timer, accent, rect{hud.x + hud.w - 24 - 100, hud.y + 38, 100, 38}, a.bigFace)

	// face
	fr := faceRect()
	fillCircle(screen, fr.x+fr.w/2, fr.y+fr.h/2, fr.w/2, yellow)
	strokeCircle(screen, fr.x+fr.w/2, fr.y+fr.h/2, fr.w/2, yellowDark, 2)
	faceCh := ":)"
	switch a.game.status {
	case statusLost:
		faceCh = "X("
	case statusWon:
		faceCh = "B)"
	}
	if a.leftDown && a.game.status == statusPlaying {
		faceCh = ":O"
	}
	drawText(screen, faceCh, a.bigFace, color.RGBA{0, 0, 0, 255},
		float64(fr.x+fr.w/2), float64(fr.y+fr.h/2-12), text.AlignCenter)

	// presets
	for i, p := range presets {
		pr := presetRect(i)
		col := panel2
		fg := ink
		if i == a.preset {
			col = accent
			fg = color.RGBA{4, 16, 28, 255}
		}
		fillRoundedRect(screen, pr, 999, col)
		if i != a.preset {
			strokeRoundedRect(screen, pr, 999, pillBorder, 1)
		}
		drawText(screen, p.name, a.textFace, fg,
			float64(pr.x+pr.w/2), float64(pr.y+8), text.AlignCenter)
	}

	// board
	g := a.game
	ox, oy := boardOrigin(g)
	boardW := float32(g.cols*cellSize + (g.cols-1)*gap + 2*pad)
	boardH := float32(g.rows*cellSize + (g.rows-1)*gap + 2*pad)
	fillRoundedRect(screen, rect{ox, oy, boardW, boardH}, 12, gridC)

	for r := 0; r < g.rows; r++ {
		for c := 0; c < g.cols; c++ {
			cell := g.cells[r][c]
			x := ox + pad + float32(c*(cellSize+gap))
			y := oy + pad + float32(r*(cellSize+gap))
			cr := rect{x, y, cellSize, cellSize}
			col := hiddenC
			if cell.revealed {
				col = revealedC
				if cell.exploded {
					col = explodedBg
				} else if cell.mine {
					col = mineBg
				}
			}
			fillRoundedRect(screen, cr, 4, col)

			ch := ""
			fg := ink
			switch {
			case cell.wrongFlag:
				ch, fg = "X", danger
			case cell.flagged:
				ch, fg = "F", accent2
			case cell.questioned:
				ch, fg = "?", color.RGBA{255, 180, 84, 255}
			case cell.revealed && cell.mine:
				ch, fg = "*", danger
			case cell.revealed && cell.adjacent > 0:
				ch = fmt.Sprintf("%d", cell.adjacent)
				if nc, ok := numColors[cell.adjacent]; ok {
					fg = nc
				}
			}
			if ch != "" {
				drawText(screen, ch, a.textFace, fg,
					float64(cr.x+cr.w/2), float64(cr.y+cr.h/2-7), text.AlignCenter)
			}
		}
	}

	// banner
	if g.status == statusWon || g.status == statusLost {
		overlay := ebiten.NewImage(currentWidth, currentHeight)
		overlay.Fill(color.RGBA{8, 10, 30, 170})
		screen.DrawImage(overlay, nil)
		txt := "VICTORY!"
		col := good
		if g.status == statusLost {
			txt = "BOOM!"
			col = danger
		}
		drawText(screen, txt, a.bannerFace, col,
			float64(currentWidth/2), float64(currentHeight/2-16), text.AlignCenter)
	}

	// hint
	drawText(screen, "Left reveal  Right flag  Middle (or L+R) chord  Click face to restart",
		a.textFace, muted, float64(currentWidth/2), float64(currentHeight-20), text.AlignCenter)
}

// ---------- low-level drawing helpers ----------

func fillRoundedRect(dst *ebiten.Image, r rect, _ float32, col color.Color) {
	vector.DrawFilledRect(dst, r.x, r.y, r.w, r.h, col, true)
}
func strokeRoundedRect(dst *ebiten.Image, r rect, _ float32, col color.Color, w float32) {
	vector.StrokeRect(dst, r.x, r.y, r.w, r.h, w, col, true)
}
func fillCircle(dst *ebiten.Image, cx, cy, rad float32, col color.Color) {
	vector.DrawFilledCircle(dst, cx, cy, rad, col, true)
}
func strokeCircle(dst *ebiten.Image, cx, cy, rad float32, col color.Color, w float32) {
	vector.StrokeCircle(dst, cx, cy, rad, w, col, true)
}

func drawCounter(dst *ebiten.Image, txt string, col color.RGBA, r rect, face text.Face) {
	fillRoundedRect(dst, r, 10, ledBg)
	strokeRoundedRect(dst, r, 10, color.RGBA{col.R / 2, col.G / 2, col.B / 2, 255}, 1)
	drawText(dst, txt, face, col, float64(r.x+r.w/2), float64(r.y+r.h/2-7), text.AlignCenter)
}

func drawText(dst *ebiten.Image, s string, face text.Face, col color.Color, x, y float64, align text.Align) {
	op := &text.DrawOptions{}
	op.GeoM.Translate(x, y)
	op.ColorScale.ScaleWithColor(col)
	op.PrimaryAlign = align
	text.Draw(dst, s, face, op)
}

func main() {
	rand.Seed(time.Now().UnixNano())
	ebiten.SetWindowTitle("Minesweeper · Go")
	ebiten.SetWindowResizingMode(ebiten.WindowResizingModeEnabled)
	app := newApp()
	w, h := app.Layout(0, 0)
	ebiten.SetWindowSize(w, h)
	if err := ebiten.RunGame(app); err != nil {
		log.Fatal(err)
	}
}
