namespace NovelryMAUIApp.Pages;

public partial class UserBookDetailPage : ContentPage
{
    private readonly UserBookDetailViewModel _vm;

    public UserBookDetailPage(UserBookDetailViewModel vm)
    {
        InitializeComponent();
        _ = new MauiIcon();
        BindingContext = _vm = vm;
    }

    protected override bool OnBackButtonPressed()
    {
        _ = _vm.GoBackCommand.ExecuteAsync(null);
        return true;
    }

    protected override async void OnAppearing()
    {
        await _vm.LoadData();
        base.OnAppearing();
    }

    private async void CurrentPageEntry_Completed(object sender, EventArgs e)
    {
        if (BindingContext is not UserBookDetailViewModel vm)
            return;

        var entry = sender as Entry;
        if (entry == null)
            return;

        await vm.UpdateCurrentPage(entry.Text);
    }
}
