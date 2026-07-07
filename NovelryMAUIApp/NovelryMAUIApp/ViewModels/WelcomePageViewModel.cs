namespace NovelryMAUIApp.ViewModels
{
    public partial class WelcomePageViewModel : ObservableObject
    {
        private readonly INavigationService _navigationService;
        private readonly IAlertService _alertService;
        private readonly HttpClient _client;

        public WelcomePageViewModel(
            INavigationService navigationService,
            IAlertService alertService,
            HttpClient client
        )
        {
            _navigationService = navigationService;
            _alertService = alertService;

            _client = client;
        }

        [RelayCommand]
        public async Task ExitProgramAsync()
        {
            bool confirm = await _alertService.ShowConfirmationAsync(
                "Exit program",
                "Would you like to quit the program?",
                "Yes",
                "No"
            );

            if (!confirm)
                return;

            if (Application.Current != null)
                Application.Current.Quit();
        }
    }
}
