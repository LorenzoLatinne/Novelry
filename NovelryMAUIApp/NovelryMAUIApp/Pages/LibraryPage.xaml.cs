namespace NovelryMAUIApp.Pages;

public partial class LibraryPage : ContentPage
{
    private readonly LibraryViewModel _vm;

    public LibraryPage(LibraryViewModel vm)
    {
        InitializeComponent();
        _ = new MauiIcon();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.GetUserBooks();
    }

    protected override bool OnBackButtonPressed()
    {
        _ = _vm.GoToDashboardCommand.ExecuteAsync(null);
        return true;
    }
}
