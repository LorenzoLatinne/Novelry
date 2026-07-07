namespace NovelryMAUIApp.Pages;

public partial class FilteredBooksPage : ContentPage
{
    private readonly FilteredBooksViewModel _vm;

    public FilteredBooksPage(FilteredBooksViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override bool OnBackButtonPressed()
    {
        _ = _vm.GoToExplorePageCommand.ExecuteAsync(null);
        return true;
    }
}
