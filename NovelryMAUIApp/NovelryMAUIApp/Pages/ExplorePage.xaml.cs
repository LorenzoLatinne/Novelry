namespace NovelryMAUIApp.Pages;

public partial class ExplorePage : ContentPage
{
    private readonly ExplorePageViewModel _vm;

    public ExplorePage(ExplorePageViewModel vm)
    {
        InitializeComponent();
        _ = new MauiIcon();
        BindingContext = _vm = vm;
    }

    protected override bool OnBackButtonPressed()
    {
        _ = _vm.GoToDashboardCommand.ExecuteAsync(null);
        return true;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.UpdateExplorePage();
    }
}
