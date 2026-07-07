using System.Collections.ObjectModel;
using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.User;
using NovelryDTO.DTOs.UserBook;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Review;
using NovelryMAUIApp.Repositories.User;
using NovelryMAUIApp.Repositories.UserBook;

namespace NovelryMAUIApp.ViewModels
{
    public partial class DashboardPageViewModel : ObservableObject
    {
        public int PercentBarWidth => 300;

        #region Private/Cached variables
        private List<UserBookDto> _userBooks = new();
        #endregion

        #region Services
        private readonly IUserSessionService _userSessionService;
        private readonly IAuthService _loginService;
        private readonly IAlertService _alertService;
        private readonly INavigationService _navigationService;
        #endregion

        #region Repositories
        private readonly IUserBookRepository _userBookRepository;
        private readonly ITimerRepository _timerRepository;
        private readonly IBookRepository _bookRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly IUserRepository _userRepository;
        #endregion

        #region Properties
        [ObservableProperty]
        private UserDto? _currentUser;

        [ObservableProperty]
        private UserBookDto? _currentlyReadingBook;

        [ObservableProperty]
        private int _booksReadCount;

        [ObservableProperty]
        private int _currentlyReadingCount;

        [ObservableProperty]
        private int _wantToReadCount;

        [ObservableProperty]
        private ObservableCollection<BookWithReviewDto> _latestReviews = new();
        #endregion

        public DashboardPageViewModel(
            IAlertService alertService,
            IBookRepository bookRepository,
            IAuthService loginService,
            INavigationService navigationService,
            IUserRepository userRepository,
            ITimerRepository timerRepository,
            IReviewRepository reviewRepository,
            IUserBookRepository userBookRepository,
            IUserSessionService userSessionService
        )
        {
            _userSessionService = userSessionService;
            _loginService = loginService;
            _alertService = alertService;
            _navigationService = navigationService;

            _userBookRepository = userBookRepository;
            _timerRepository = timerRepository;
            _bookRepository = bookRepository;
            _reviewRepository = reviewRepository;
            _userRepository = userRepository;

            _currentUser = _userSessionService.CurrentUser;
        }

        public async Task UpdateDashboardDataAsync()
        {
            if (CurrentUser == null)
                return;

            await LoadAllUserBooksAsync();

            ComputeBooksReadCount();
            ComputeCurrentReadingCount();
            ComputeWantToReadCount();

            await Task.WhenAll(GetCurrentlyReadingBookAsync(), GetLatestReviewsAsync());
        }

        private async Task LoadAllUserBooksAsync()
        {
            if (CurrentUser == null)
                return;
            _userBooks = await _userBookRepository.GetAllUserBooksByUserIdAsync(CurrentUser.Id);
        }

        private void ComputeBooksReadCount()
        {
            BooksReadCount = _userBooks.Count(b => b.Status == UserBookStatus.Read);
        }

        private void ComputeCurrentReadingCount()
        {
            CurrentlyReadingCount = _userBooks.Count(b => b.Status == UserBookStatus.Reading);
        }

        private void ComputeWantToReadCount()
        {
            WantToReadCount = _userBooks.Count(b => b.Status == UserBookStatus.WantToRead);
        }

        private async Task GetCurrentlyReadingBookAsync()
        {
            if (CurrentUser == null)
                return;

            var readingBook =
                _userBooks.FirstOrDefault(ub => ub.Status == UserBookStatus.Reading)
                ?? _userBooks.FirstOrDefault(ub => ub.Status == UserBookStatus.WantToRead)
                ?? _userBooks.FirstOrDefault(ub => ub.Status == UserBookStatus.Read);

            if (readingBook != null)
            {
                if (readingBook.Book == null)
                    readingBook.Book = await _bookRepository.GetBookByIdAsync(readingBook.BookId);

                CurrentlyReadingBook = readingBook;

                if (readingBook.Status == UserBookStatus.Read)
                    readingBook.CurrentPage =
                        readingBook.Book?.TotalPages ?? readingBook.CurrentPage;

                OnPropertyChanged(nameof(CurrentlyReadingBook));
            }
            else
            {
                CurrentlyReadingBook = null;
            }
        }

        private async Task GetLatestReviewsAsync()
        {
            if (LatestReviews.Count > 0)
                return;

            var latestBooksWithReviews = await _bookRepository.GetLatestBooksWithReviewsAsync();

            LatestReviews.Clear();

            foreach (var dto in latestBooksWithReviews)
                LatestReviews.Add(dto);
        }

        #region Commands
        [RelayCommand]
        private async Task GoBackToLoginPage()
        {
            await _loginService.LogoutAsync();
            await _navigationService.NavigateToAsync("//WelcomePage");
        }

        [RelayCommand]
        private async Task LogoutAsync()
        {
            bool confirm = await _alertService.ShowConfirmationAsync(
                "Log out?",
                "Would you like to log out?",
                "Yes",
                "No"
            );

            if (!confirm)
                return;

            await _loginService.LogoutAsync();
            await _navigationService.NavigateToAsync("//WelcomePage");
        }

        [RelayCommand]
        private async Task GoToScanPageAsync()
        {
            await _navigationService.NavigateToAsync("//ScanPage");
        }

        [RelayCommand]
        private async Task GoToSearchAsync()
        {
            await _navigationService.NavigateToAsync("//ExplorePage");
        }

        [RelayCommand]
        private async Task GoToProfilePageAsync()
        {
            await _navigationService.NavigateToAsync("//ProfilePage");
        }

        [RelayCommand]
        private async Task GoToBookDetailAsync(int bookId)
        {
            await _navigationService.NavigateToAsync(
                $"{nameof(BookInfoPage)}",
                new Dictionary<string, object>() { { "bookId", bookId } }
            );
        }

        [RelayCommand]
        private async Task GoToUserBookDetail(int bookId)
        {
            await _navigationService.NavigateToAsync(
                $"{nameof(UserBookDetailPage)}",
                new Dictionary<string, object>() { { "bookId", bookId } }
            );
        }

        [RelayCommand]
        private async Task GoToReviewsAsync()
        {
            await _navigationService.NavigateToAsync("//ReviewsPage");
        }
        #endregion
    }
}
