using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace Minesweeper.Unity
{
    /// <summary>
    /// Bootstraps the entire Minesweeper UI at runtime so the project works
    /// without manually wiring a scene. Attach this script to a GameObject in
    /// an empty scene; it builds a Canvas, HUD, board and behaviour.
    /// </summary>
    public class MinesweeperBootstrap : MonoBehaviour
    {
        Game _game;
        Preset _preset = Preset.All[0];
        Button[,] _btns;
        TMP_Text[,] _labels;
        TMP_Text _minesLbl, _timerLbl;
        TMP_Text _faceLbl;
        GameObject _banner;
        TMP_Text _bannerLbl;
        RectTransform _boardRect;

        static readonly Color BgC = new Color32(12, 16, 36, 255);
        static readonly Color PanelC = new Color32(22, 26, 58, 255);
        static readonly Color HiddenC = new Color32(53, 58, 120, 255);
        static readonly Color RevealedC = new Color32(15, 19, 48, 255);
        static readonly Color MineC = new Color32(42, 15, 28, 255);
        static readonly Color ExplodedC = new Color32(107, 14, 42, 255);
        static readonly Color Accent = new Color32(76, 201, 240, 255);
        static readonly Color Accent2 = new Color32(179, 136, 255, 255);
        static readonly Color Danger = new Color32(255, 92, 141, 255);
        static readonly Color Good = new Color32(110, 240, 163, 255);

        static readonly Color[] NumColors = {
            new Color32(233,236,255,255),
            new Color32(76,201,240,255),
            new Color32(110,240,163,255),
            new Color32(255,92,141,255),
            new Color32(179,136,255,255),
            new Color32(255,180,84,255),
            new Color32(74,215,209,255),
            new Color32(233,236,255,255),
            new Color32(141,146,199,255),
        };

        const int CELL = 32;

        void Start()
        {
            Camera.main.backgroundColor = BgC;
            BuildUi();
            NewGame(_preset);
            StartCoroutine(Tick());
        }

        IEnumerator Tick()
        {
            while (true) { RefreshHud(); yield return new WaitForSeconds(0.25f); }
        }

        void BuildUi()
        {
            var canvasGo = new GameObject("Canvas");
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGo.AddComponent<GraphicRaycaster>();

            // HUD
            var hud = NewPanel("HUD", canvasGo.transform, PanelC);
            var hudR = hud.GetComponent<RectTransform>();
            hudR.anchorMin = new Vector2(0, 1); hudR.anchorMax = new Vector2(1, 1);
            hudR.pivot = new Vector2(0.5f, 1);
            hudR.sizeDelta = new Vector2(-40, 100);
            hudR.anchoredPosition = new Vector2(0, -20);

            _minesLbl = NewLabel(hud.transform, "000", 32, Danger);
            var mr = _minesLbl.rectTransform;
            mr.anchorMin = new Vector2(0, 0.5f); mr.anchorMax = new Vector2(0, 0.5f);
            mr.anchoredPosition = new Vector2(80, 0);

            _timerLbl = NewLabel(hud.transform, "000", 32, Accent);
            var tr = _timerLbl.rectTransform;
            tr.anchorMin = new Vector2(1, 0.5f); tr.anchorMax = new Vector2(1, 0.5f);
            tr.anchoredPosition = new Vector2(-80, 0);

            var faceBtn = NewButton(hud.transform, ":)", 32, () => NewGame(_preset));
            _faceLbl = faceBtn.GetComponentInChildren<TMP_Text>();
            var fr = faceBtn.GetComponent<RectTransform>();
            fr.sizeDelta = new Vector2(60, 60);
            fr.anchoredPosition = Vector2.zero;

            // Preset bar
            var bar = new GameObject("Presets");
            bar.transform.SetParent(canvasGo.transform, false);
            var brr = bar.AddComponent<RectTransform>();
            brr.anchorMin = new Vector2(0.5f, 1); brr.anchorMax = new Vector2(0.5f, 1);
            brr.pivot = new Vector2(0.5f, 1);
            brr.sizeDelta = new Vector2(600, 40);
            brr.anchoredPosition = new Vector2(0, -130);
            var hg = bar.AddComponent<HorizontalLayoutGroup>();
            hg.spacing = 8; hg.childAlignment = TextAnchor.MiddleCenter;
            hg.childForceExpandWidth = false; hg.childForceExpandHeight = false;
            foreach (var p in Preset.All)
            {
                var local = p;
                NewButton(bar.transform, p.Name, 16, () => NewGame(local));
            }

            // Board container
            var boardGo = new GameObject("Board");
            boardGo.transform.SetParent(canvasGo.transform, false);
            _boardRect = boardGo.AddComponent<RectTransform>();
            _boardRect.anchorMin = _boardRect.anchorMax = new Vector2(0.5f, 0.5f);
            _boardRect.pivot = new Vector2(0.5f, 0.5f);

            // Banner
            _banner = new GameObject("Banner");
            _banner.transform.SetParent(canvasGo.transform, false);
            var br = _banner.AddComponent<RectTransform>();
            br.anchorMin = Vector2.zero; br.anchorMax = Vector2.one;
            br.offsetMin = Vector2.zero; br.offsetMax = Vector2.zero;
            var bgImg = _banner.AddComponent<Image>(); bgImg.color = new Color(0.03f, 0.04f, 0.12f, 0.7f);
            _bannerLbl = NewLabel(_banner.transform, "", 56, Good);
            _banner.SetActive(false);
        }

        Image NewPanel(string name, Transform parent, Color c)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>(); img.color = c;
            go.AddComponent<RectTransform>();
            return img;
        }

        TMP_Text NewLabel(Transform parent, string text, int size, Color c)
        {
            var go = new GameObject("Label");
            go.transform.SetParent(parent, false);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.text = text; t.fontSize = size; t.color = c;
            t.alignment = TextAlignmentOptions.Center;
            t.fontStyle = FontStyles.Bold;
            t.rectTransform.sizeDelta = new Vector2(180, 60);
            return t;
        }

        Button NewButton(Transform parent, string label, int size, System.Action onClick)
        {
            var go = new GameObject("Btn");
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>(); img.color = new Color32(31, 36, 82, 255);
            var btn = go.AddComponent<Button>();
            btn.onClick.AddListener(() => onClick());
            var lblT = NewLabel(go.transform, label, size, new Color32(233, 236, 255, 255));
            var lr = lblT.rectTransform;
            lr.anchorMin = Vector2.zero; lr.anchorMax = Vector2.one;
            lr.offsetMin = Vector2.zero; lr.offsetMax = Vector2.zero;
            var rt = go.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(140, 36);
            return btn;
        }

        void NewGame(Preset p)
        {
            _preset = p;
            _game = new Game(p);

            foreach (Transform c in _boardRect) Destroy(c.gameObject);
            _btns = new Button[p.Rows, p.Cols];
            _labels = new TMP_Text[p.Rows, p.Cols];

            float w = p.Cols * CELL + (p.Cols - 1) * 2;
            float h = p.Rows * CELL + (p.Rows - 1) * 2;
            _boardRect.sizeDelta = new Vector2(w, h);

            for (int r = 0; r < p.Rows; r++)
                for (int c = 0; c < p.Cols; c++)
                {
                    int rr = r, cc = c;
                    var go = new GameObject($"C{r}_{c}");
                    go.transform.SetParent(_boardRect, false);
                    var img = go.AddComponent<Image>(); img.color = HiddenC;
                    var btn = go.AddComponent<Button>();
                    btn.onClick.AddListener(() => OnTap(rr, cc));
                    var rt = go.GetComponent<RectTransform>();
                    rt.sizeDelta = new Vector2(CELL, CELL);
                    rt.anchorMin = rt.anchorMax = new Vector2(0, 1);
                    rt.pivot = new Vector2(0, 1);
                    rt.anchoredPosition = new Vector2(c * (CELL + 2), -r * (CELL + 2));
                    var lbl = NewLabel(go.transform, "", 18, NumColors[0]);
                    var lr = lbl.rectTransform;
                    lr.anchorMin = Vector2.zero; lr.anchorMax = Vector2.one;
                    lr.offsetMin = Vector2.zero; lr.offsetMax = Vector2.zero;
                    _btns[r, c] = btn;
                    _labels[r, c] = lbl;

                    // Right-click via EventTrigger for flag
                    var trig = go.AddComponent<UnityEngine.EventSystems.EventTrigger>();
                    var entry = new UnityEngine.EventSystems.EventTrigger.Entry
                    {
                        eventID = UnityEngine.EventSystems.EventTriggerType.PointerClick
                    };
                    entry.callback.AddListener((data) =>
                    {
                        var pe = (UnityEngine.EventSystems.PointerEventData)data;
                        if (pe.button == UnityEngine.EventSystems.PointerEventData.InputButton.Right)
                            OnFlag(rr, cc);
                        else if (pe.button == UnityEngine.EventSystems.PointerEventData.InputButton.Middle)
                            OnChord(rr, cc);
                    });
                    trig.triggers.Add(entry);
                }
            _banner.SetActive(false);
            Render();
        }

        void OnTap(int r, int c)
        {
            var cell = _game.Cells[r, c];
            if (cell.State == CellState.Revealed && cell.Adjacent > 0) _game.Chord(r, c);
            else _game.Reveal(r, c);
            Render();
        }
        void OnFlag(int r, int c) { _game.ToggleFlag(r, c); Render(); }
        void OnChord(int r, int c) { _game.Chord(r, c); Render(); }

        void Render()
        {
            for (int r = 0; r < _game.Rows; r++)
                for (int c = 0; c < _game.Cols; c++)
                {
                    var cell = _game.Cells[r, c];
                    var img = _btns[r, c].GetComponent<Image>();
                    var lbl = _labels[r, c];
                    lbl.text = "";
                    img.color = HiddenC;
                    lbl.color = NumColors[0];
                    if (cell.WrongFlag) { lbl.text = "X"; lbl.color = Danger; img.color = RevealedC; }
                    else if (cell.State == CellState.Flagged) { lbl.text = "F"; lbl.color = Accent2; }
                    else if (cell.State == CellState.Questioned) { lbl.text = "?"; lbl.color = new Color32(255, 180, 84, 255); }
                    else if (cell.State == CellState.Revealed)
                    {
                        img.color = cell.Exploded ? ExplodedC : (cell.Mine ? MineC : RevealedC);
                        if (cell.Mine) { lbl.text = "*"; lbl.color = Danger; }
                        else if (cell.Adjacent > 0) { lbl.text = cell.Adjacent.ToString(); lbl.color = NumColors[cell.Adjacent]; }
                    }
                }

            if (_game.Status == GameStatus.Won) { _bannerLbl.text = "VICTORY"; _bannerLbl.color = Good; _banner.SetActive(true); }
            else if (_game.Status == GameStatus.Lost) { _bannerLbl.text = "BOOM"; _bannerLbl.color = Danger; _banner.SetActive(true); }
            else _banner.SetActive(false);

            RefreshHud();
        }

        void RefreshHud()
        {
            if (_minesLbl == null) return;
            _minesLbl.text = _game.MinesRemaining.ToString("D3");
            _timerLbl.text = _game.ElapsedSeconds.ToString("D3");
            if (_faceLbl != null)
                _faceLbl.text = _game.Status == GameStatus.Lost ? "X(" :
                                _game.Status == GameStatus.Won ? "B)" : ":)";
        }
    }
}
