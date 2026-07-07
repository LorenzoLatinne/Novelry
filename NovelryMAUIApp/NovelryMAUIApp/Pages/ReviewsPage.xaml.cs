namespace NovelryMAUIApp.Pages;

public partial class ReviewsPage : ContentPage
{
    private readonly ReviewsPageViewModel _vm;

    public ReviewsPage(ReviewsPageViewModel vm)
    {
        InitializeComponent();
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
        await _vm.UpdateReviewsDataAsync();
    }
}
