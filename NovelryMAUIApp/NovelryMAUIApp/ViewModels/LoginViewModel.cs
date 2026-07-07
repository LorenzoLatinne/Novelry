using System.Diagnostics;
using NovelryMAUIApp.Repositories.User;

namespace NovelryMAUIApp.ViewModels
{
    public partial class LoginViewModel : ObservableObject
    {
        private readonly IAuthService _loginService;
        private readonly INavigationService _navigationService;
        private readonly IUserSessionService _userSessionService;
        private readonly IAlertService _alertService;

        private readonly IUserRepository _userRepository;

        public string Title { get; set; } = "Login";

        [ObservableProperty]
        private string _email = string.Empty;

        [ObservableProperty]
        private string _password = string.Empty;

        [ObservableProperty]
        private string _errorMessage = string.Empty;

        [ObservableProperty]
        private bool _isBusy;

        public LoginViewModel(
            IAuthService loginService,
            INavigationService navigationService,
            IUserSessionService userSessionService,
            IUserRepository userRepository,
            IAlertService alertService
        )
        {
            _loginService = loginService;
            _navigationService = navigationService;
            _userSessionService = userSessionService;
            _alertService = alertService;

            _userRepository = userRepository;
        }

        [RelayCommand]
        private async Task LoginAsync()
        {
            if (IsBusy)
                return;

            IsBusy = true;
            ErrorMessage = string.Empty;

            try
            {
                if (!await _loginService.LoginAsync(this.Email, this.Password))
                {
                    ErrorMessage = "Invalid email or password.";
                    await _alertService.ShowMessageAsync(
                        "Invalid credentials.",
                        "Wrong username or password.",
                        "Ok"
                    );
                    return;
                }

                var user = await _userRepository.GetUserByEmailAsync(this.Email);

                if (user != null)
                {
                    _userSessionService.CurrentUser = user;
                    await _navigationService.NavigateToAsync("//Main");
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Login failed: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }
    }
}
