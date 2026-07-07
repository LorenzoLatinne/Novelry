namespace NovelryMAUIApp.Pages;

public partial class BookInfoPage : ContentPage
{
    public BookInfoPage(BookInfoViewModel vm)
    {
        InitializeComponent();
        _ = new MauiIcon();
        BindingContext = vm;
    }

    protected override bool OnBackButtonPressed()
    {
        if (BindingContext is BookInfoViewModel vm)
            _ = vm.GoBackCommand.ExecuteAsync(null);
        return true;
    }
}
