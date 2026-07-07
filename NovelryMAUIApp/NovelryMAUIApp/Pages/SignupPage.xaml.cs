namespace NovelryMAUIApp.Pages;

public partial class SignupPage : ContentPage
{
    private readonly SignUpViewModel _vm;

    public SignupPage(SignUpViewModel vm)
    {
        InitializeComponent();
        _ = new MauiIcon();
        BindingContext = _vm = vm;
    }

    private void CheckPassword(object sender, TextChangedEventArgs e)
    {
        _vm.LengthRequirementIcon =
            _vm.Password.Length >= 8 ? FontAwesomeSolidIcons.Check : FontAwesomeSolidIcons.X;
        _vm.LengthRequirementColor = _vm.Password.Length >= 8 ? Colors.Green : Colors.Red;

        _vm.UppercaseRequirementIcon = _vm.Password.Any(char.IsUpper)
            ? FontAwesomeSolidIcons.Check
            : FontAwesomeSolidIcons.X;
        _vm.UppercaseRequirementColor = _vm.Password.Any(char.IsUpper) ? Colors.Green : Colors.Red;

        _vm.NumberRequirementIcon = _vm.Password.Any(char.IsDigit)
            ? FontAwesomeSolidIcons.Check
            : FontAwesomeSolidIcons.X;
        _vm.NumberRequirementColor = _vm.Password.Any(char.IsDigit) ? Colors.Green : Colors.Red;
    }

    private void HidePassword(object sender, FocusEventArgs e)
    {
        _vm.HidePassword = true;
    }

    private void HideConfirmPassword(object sender, FocusEventArgs e)
    {
        _vm.HideConfirmPassword = true;
    }
}
