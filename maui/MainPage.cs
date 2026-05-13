using Microsoft.Maui.Controls.Shapes;
using Microsoft.Maui.Graphics;

namespace Minesweeper.Maui;

public class MainPage : ContentPage
{
    private Game _game = new(Preset.Beginner);
    private Preset _preset = Preset.Beginner;
    private DateTime? _started, _ended;

    private readonly Label _minesLbl = new() { TextColor = Color.FromArgb("#ff3b6b"), FontFamily = "Menlo", FontSize = 28, FontAttributes = FontAttributes.Bold };
    private readonly Label _timerLbl = new() { TextColor = Color.FromArgb("#4cc9f0"), FontFamily = "Menlo", FontSize = 28, FontAttributes = FontAttributes.Bold };
    private readonly Button _faceBtn = new() { Text = "🙂", FontSize = 28, BackgroundColor = Color.FromArgb("#f5c518"), CornerRadius = 26, WidthRequest = 52, HeightRequest = 52, Padding = 0 };
    private readonly Grid _board = new() { BackgroundColor = Color.FromArgb("#1b2050"), Padding = 6, RowSpacing = 2, ColumnSpacing = 2 };
    private readonly Label _banner = new() { IsVisible = false, FontSize = 36, FontAttributes = FontAttributes.Bold, HorizontalTextAlignment = TextAlignment.Center, VerticalTextAlignment = TextAlignment.Center, BackgroundColor = Color.FromArgb("#dd0a0e22") };

    private bool _flagMode;
    private Button[,]? _btns;

    public MainPage()
    {
        Title = "Minesweeper · MAUI";
        BackgroundColor = Color.FromArgb("#0c1024");

        _faceBtn.Clicked += (_, _) => NewGame(_preset);

        var presetBar = new HorizontalStackLayout { Spacing = 8, HorizontalOptions = LayoutOptions.Center };
        foreach (var p in Preset.All)
        {
            var btn = new Button { Text = p.Name, BackgroundColor = Color.FromArgb("#1f2452"), TextColor = Color.FromArgb("#e9ecff"), CornerRadius = 18, FontAttributes = FontAttributes.Bold };
            btn.Clicked += (_, _) => NewGame(p);
            presetBar.Add(btn);
        }

        var modeFlag = new Button { Text = "Flag mode", BackgroundColor = Color.FromArgb("#1f2452"), TextColor = Color.FromArgb("#e9ecff"), CornerRadius = 16 };
        modeFlag.Clicked += (_, _) =>
        {
            _flagMode = !_flagMode;
            modeFlag.BackgroundColor = _flagMode ? Color.FromArgb("#b388ff") : Color.FromArgb("#1f2452");
            modeFlag.TextColor = _flagMode ? Colors.Black : Color.FromArgb("#e9ecff");
        };

        var hud = new Grid
        {
            ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto), new ColumnDefinition(GridLength.Star) },
            BackgroundColor = Color.FromArgb("#161a3a"),
            Padding = 12,
        };
        hud.Add(_minesLbl, 0, 0); _minesLbl.HorizontalOptions = LayoutOptions.Start; _minesLbl.VerticalOptions = LayoutOptions.Center;
        hud.Add(_faceBtn, 1, 0);
        hud.Add(_timerLbl, 2, 0); _timerLbl.HorizontalOptions = LayoutOptions.End; _timerLbl.VerticalOptions = LayoutOptions.Center;

        var boardScroll = new ScrollView { Orientation = ScrollOrientation.Both, Content = _board };

        var stack = new VerticalStackLayout
        {
            Spacing = 10,
            Padding = 12,
            Children = { hud, presetBar, modeFlag, boardScroll },
        };

        Content = new Grid
        {
            Children = { stack, _banner },
        };

        NewGame(Preset.Beginner);

        var timer = Application.Current!.Dispatcher.CreateTimer();
        timer.Interval = TimeSpan.FromMilliseconds(250);
        timer.Tick += (_, _) => RefreshHud();
        timer.Start();
    }

    private void NewGame(Preset p)
    {
        _preset = p;
        _game = new Game(p);
        _started = _ended = null;
        BuildBoard();
        Render();
        _banner.IsVisible = false;
    }

    private void BuildBoard()
    {
        _board.Clear();
        _board.RowDefinitions.Clear();
        _board.ColumnDefinitions.Clear();
        for (int r = 0; r < _game.Rows; r++)
            _board.RowDefinitions.Add(new RowDefinition(28));
        for (int c = 0; c < _game.Cols; c++)
            _board.ColumnDefinitions.Add(new ColumnDefinition(28));

        _btns = new Button[_game.Rows, _game.Cols];
        for (int r = 0; r < _game.Rows; r++)
        {
            for (int c = 0; c < _game.Cols; c++)
            {
                int rr = r, cc = c;
                var btn = new Button
                {
                    BackgroundColor = Color.FromArgb("#353a78"),
                    TextColor = Color.FromArgb("#e9ecff"),
                    Padding = 0,
                    CornerRadius = 4,
                    FontFamily = "Menlo",
                    FontAttributes = FontAttributes.Bold,
                    FontSize = 14,
                    BorderWidth = 0,
                };
                btn.Clicked += (_, _) => OnTap(rr, cc);
                var lp = new TapGestureRecognizer { NumberOfTapsRequired = 2 };
                lp.Tapped += (_, _) => OnLongPress(rr, cc);
                // No native long-press on Button; fallback: double-tap = flag
                btn.GestureRecognizers.Add(lp);
                _board.Add(btn, c, r);
                _btns[r, c] = btn;
            }
        }
    }

    private void OnTap(int r, int c)
    {
        if (_game.Status is GameStatus.Won or GameStatus.Lost) return;
        var cell = _game.Cells[r, c];
        if (_flagMode || (cell.State == CellState.Revealed && cell.Adjacent > 0))
        {
            if (cell.State == CellState.Revealed) _game.Chord(r, c);
            else _game.ToggleFlag(r, c);
        }
        else
        {
            if (_game.FirstClick) _started = DateTime.UtcNow;
            _game.Reveal(r, c);
        }
        if (_game.Status is GameStatus.Won or GameStatus.Lost && _ended is null) _ended = DateTime.UtcNow;
        Render();
    }

    private void OnLongPress(int r, int c)
    {
        if (_game.Status is GameStatus.Won or GameStatus.Lost) return;
        _game.ToggleFlag(r, c);
        Render();
    }

    private static readonly Color[] NumColors =
    {
        Color.FromArgb("#e9ecff"),
        Color.FromArgb("#4cc9f0"),
        Color.FromArgb("#6ef0a3"),
        Color.FromArgb("#ff5c8d"),
        Color.FromArgb("#b388ff"),
        Color.FromArgb("#ffb454"),
        Color.FromArgb("#4ad7d1"),
        Color.FromArgb("#e9ecff"),
        Color.FromArgb("#8d92c7"),
    };

    private void Render()
    {
        if (_btns is null) return;
        for (int r = 0; r < _game.Rows; r++)
            for (int c = 0; c < _game.Cols; c++)
            {
                var cell = _game.Cells[r, c];
                var btn = _btns[r, c];
                btn.Text = "";
                btn.TextColor = Color.FromArgb("#e9ecff");
                btn.BackgroundColor = Color.FromArgb("#353a78");
                if (cell.WrongFlag) { btn.Text = "✕"; btn.TextColor = Color.FromArgb("#ff5c8d"); btn.BackgroundColor = Color.FromArgb("#0f1330"); }
                else if (cell.State == CellState.Flagged) { btn.Text = "⚑"; btn.TextColor = Color.FromArgb("#b388ff"); }
                else if (cell.State == CellState.Questioned) { btn.Text = "?"; btn.TextColor = Color.FromArgb("#ffb454"); }
                else if (cell.State == CellState.Revealed)
                {
                    btn.BackgroundColor = cell.Exploded ? Color.FromArgb("#6b0e2a") : (cell.Mine ? Color.FromArgb("#2a0f1c") : Color.FromArgb("#0f1330"));
                    if (cell.Mine) { btn.Text = "✱"; btn.TextColor = Color.FromArgb("#ff5c8d"); }
                    else if (cell.Adjacent > 0) { btn.Text = cell.Adjacent.ToString(); btn.TextColor = NumColors[cell.Adjacent]; }
                }
            }

        if (_game.Status == GameStatus.Won)
        {
            _banner.Text = "✨ VICTORY ✨";
            _banner.TextColor = Color.FromArgb("#6ef0a3");
            _banner.IsVisible = true;
        }
        else if (_game.Status == GameStatus.Lost)
        {
            _banner.Text = "💥 BOOM 💥";
            _banner.TextColor = Color.FromArgb("#ff5c8d");
            _banner.IsVisible = true;
        }
        else _banner.IsVisible = false;

        RefreshHud();
    }

    private void RefreshHud()
    {
        _minesLbl.Text = _game.MinesRemaining.ToString("D3");
        _timerLbl.Text = _game.ElapsedSeconds.ToString("D3");
        _faceBtn.Text = _game.Status switch
        {
            GameStatus.Lost => "😵",
            GameStatus.Won => "😎",
            _ => "🙂",
        };
    }
}
