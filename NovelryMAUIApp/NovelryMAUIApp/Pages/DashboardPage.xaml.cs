namespace NovelryMAUIApp.Pages;

public partial class DashboardPage : ContentPage
{
    private readonly DashboardPageViewModel _vm;

    public DashboardPage(DashboardPageViewModel vm)
    {
        InitializeComponent();
        _ = new MauiIcon();
        BindingContext = _vm = vm;
    }

    protected override bool OnBackButtonPressed()
    {
        if (BindingContext is DashboardPageViewModel vm)
            _ = vm.LogoutCommand.ExecuteAsync(null);
        return true;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.UpdateDashboardDataAsync();
    }
}
