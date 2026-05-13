namespace Minesweeper.Maui;

public partial class App : Application
{
    public App()
    {
        MainPage = new NavigationPage(new MainPage())
        {
            BarBackgroundColor = Color.FromArgb("#0c1024"),
            BarTextColor = Color.FromArgb("#e9ecff"),
        };
    }
}
