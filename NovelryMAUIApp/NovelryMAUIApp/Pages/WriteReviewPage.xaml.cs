namespace NovelryMAUIApp.Pages;

public partial class WriteReviewPage : ContentPage
{
    private readonly WriteReviewViewModel _vm;

    public WriteReviewPage(WriteReviewViewModel vm)
    {
        InitializeComponent();
        _ = new MauiIcon();
        BindingContext = _vm = vm;
    }

    private void Button_Clicked(object sender, EventArgs e) { }

    protected override bool OnBackButtonPressed()
    {
        _ = _vm.GoBackCommand.ExecuteAsync(null);
        return true;
    }
}
