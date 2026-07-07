namespace NovelryMAUIApp.Pages;

public partial class SettingsPage : ContentPage
{
    public SettingsPage(SettingsViewModel vm)
    {
        InitializeComponent();
        BindingContext = vm;
        _ = new MauiIcon();
    }
}
