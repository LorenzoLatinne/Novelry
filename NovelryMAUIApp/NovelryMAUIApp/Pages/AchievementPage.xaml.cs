using System.Threading.Tasks;

namespace NovelryMAUIApp.Pages;

public partial class AchievementPage : ContentPage
{
    private readonly AchievementViewModel _vm;

    public AchievementPage(AchievementViewModel vm)
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
}
