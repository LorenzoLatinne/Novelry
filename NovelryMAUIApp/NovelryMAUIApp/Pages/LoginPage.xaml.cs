namespace NovelryMAUIApp.Pages;

public partial class LoginPage : ContentPage
{
	public LoginPage(LoginViewModel vm)
	{
		InitializeComponent();
		_ = new MauiIcon();
		BindingContext = vm;
    }
}