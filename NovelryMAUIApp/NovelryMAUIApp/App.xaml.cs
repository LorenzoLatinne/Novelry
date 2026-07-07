using MauiIcons.Core;
using NovelryMAUIApp.Pages;

namespace NovelryMAUIApp
{
    public partial class App : Application
    {
        public App()
        {
            InitializeComponent();

            if (Preferences.ContainsKey("AccentColor"))
            {
                var savedColor = Preferences.Get("AccentColor", "#2973C7");
                SettingsViewModel.ApplyAccentColor(savedColor);
            }

            if (Preferences.ContainsKey("AppFontFamily"))
            {
                var savedFont = Preferences.Get("AppFontFamily", "Inter");
                SettingsViewModel.ApplyFont(savedFont);
            }

            _ = new MauiIcon();
        }

        protected override Window CreateWindow(IActivationState? activationState)
        {
            return new Window(new AppShell());
        }
    }
}
