namespace NovelryMAUIApp.Pages;

public partial class ProfilePage : ContentPage
{
    private readonly ProfileViewModel _vm;

    public ProfilePage(ProfileViewModel vm)
    {
        InitializeComponent();
        _ = new MauiIcon();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        await _vm.LoadData();
        base.OnAppearing();
    }

    private async void SettingsButtonTapped(object sender, TappedEventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(SettingsPage), true);
    }

    private async void AchievementsButtonTapped(object sender, TappedEventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(AchievementPage), true);
    }

    protected override bool OnBackButtonPressed()
    {
        _ = _vm.GoToDashboardCommand.ExecuteAsync(null);
        return true;
    }

    private async void InfoButtonTapped(object sender, TappedEventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(IntroductionPage), true);
    }
}
