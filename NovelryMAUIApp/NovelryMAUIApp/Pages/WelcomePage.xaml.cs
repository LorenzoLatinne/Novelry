using System.Threading.Tasks;

namespace NovelryMAUIApp.Pages;

public partial class WelcomePage : ContentPage
{
    private readonly WelcomePageViewModel _vm;

    public WelcomePage(WelcomePageViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    private async void CreateAccountButtonClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(SignupPage), true);
    }

    private async void SignInButtonClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(LoginPage), true);
    }

    protected override bool OnBackButtonPressed()
    {
        if (BindingContext is WelcomePageViewModel vm)
            _ = vm.ExitProgramCommand.ExecuteAsync(null);
        return true;
    }
}
