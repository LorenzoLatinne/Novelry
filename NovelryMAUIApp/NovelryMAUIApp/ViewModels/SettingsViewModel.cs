using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryMAUIApp.ViewModels
{
    public partial class SettingsViewModel : ObservableObject
    {
        public ObservableCollection<string> AccentColors { get; } =
            new() { "#2973C7", "#16A34A", "#EB6B2D", "#D9A33F", "#D90202" };

        [ObservableProperty]
        private string selectedAccentColor;

        public SettingsViewModel()
        {
            SelectedAccentColor = Preferences.Get("AccentColor", "#2973C7");
        }

        [RelayCommand]
        private async Task ChangeColorAsync()
        {
            string result = await Application.Current.MainPage.DisplayActionSheet(
                "Choose Accent Color",
                "Cancel",
                null,
                "Blue",
                "Green",
                "Orange",
                "Gold",
                "Red"
            );

            if (string.IsNullOrEmpty(result) || result == "Cancel")
                return;

            string colorHex = result switch
            {
                "Blue" => "#2973C7",
                "Green" => "#16A34A",
                "Orange" => "#EB6B2D",
                "Gold" => "#D9A33F",
                "Red" => "#D90202",
                _ => "#2973C7",
            };

            ApplyAccentColor(colorHex);
            Preferences.Set("AccentColor", colorHex);
            SelectedAccentColor = colorHex;
        }

        public static void ApplyAccentColor(string colorHex)
        {
            Application.Current.Resources["Primary"] = Color.FromArgb(colorHex);
            Application.Current.Resources["PrimaryBrush"] = new SolidColorBrush(
                Color.FromArgb(colorHex)
            );
        }

        [RelayCommand]
        private async Task ChangeFontAsync()
        {
            string result = await Application.Current.MainPage.DisplayActionSheet(
                "Choose Font Style",
                "Cancel",
                null,
                "Inter",
                "OpenSansRegular",
                "Outfit",
                "PlayFair"
            );

            if (string.IsNullOrEmpty(result) || result == "Cancel")
                return;

            ApplyFont(result);
            Preferences.Set("AppFontFamily", result);
        }

        public static void ApplyFont(string fontAlias)
        {
            Application.Current.Resources["AppFontFamily"] = fontAlias;
        }
    }
}
