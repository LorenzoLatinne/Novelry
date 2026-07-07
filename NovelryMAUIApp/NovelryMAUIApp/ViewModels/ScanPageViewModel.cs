using System.Net;
using NovelryMAUIApp.Repositories.Book;

namespace NovelryMAUIApp.ViewModels
{
    public partial class ScanPageViewModel : ObservableObject
    {
        private readonly IAlertService _alertService;
        private readonly INavigationService _navigationService;
        private readonly IScanService _scanService;

        private readonly IBookRepository _bookRepository;

        private bool _isBusy = false;

        public ScanPageViewModel(
            IAlertService alertService,
            INavigationService navigationService,
            IScanService scanService,
            IBookRepository bookRepository
        )
        {
            _alertService = alertService;
            _navigationService = navigationService;
            _scanService = scanService;

            _bookRepository = bookRepository;
        }

        [RelayCommand]
        private async Task GoBackAsync()
        {
            bool confirm = await _alertService.ShowConfirmationAsync(
                "Go back",
                "Would you like to go back to dashboard?",
                "Yes",
                "No"
            );

            if (!confirm)
                return;
            await _navigationService.NavigateToAsync("//DashboardPage");
        }

        [RelayCommand]
        public async Task OnBarcodeDetected(string barcodeValue)
        {
            if (_isBusy)
                return;

            _isBusy = true;

            try
            {
                if (string.IsNullOrEmpty(_scanService.ISBN))
                {
                    _scanService.ISBN = barcodeValue;
                }
                var exists = await _bookRepository.GetBookByISBNAsync(_scanService.ISBN);

                if (exists != null)
                    await _navigationService.NavigateToAsync(
                        $"//BookInfoPage",
                        new Dictionary<string, object>() { { "bookId", exists.Id } }
                    );
                else
                {
                    await _alertService.ShowMessageAsync(
                        "No match",
                        "Sorry, we couldn't find a match for the ISBN you scanned.",
                        "Ok"
                    );
                    await _navigationService.NavigateToAsync("//DashboardPage");
                }
            }
            finally
            {
                _isBusy = false;
                _scanService.ISBN = string.Empty;
            }
        }
    }
}
