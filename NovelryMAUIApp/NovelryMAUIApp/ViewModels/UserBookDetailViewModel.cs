using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.Timer;
using NovelryDTO.DTOs.User;
using NovelryDTO.DTOs.UserBook;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Review;
using NovelryMAUIApp.Repositories.User;
using NovelryMAUIApp.Repositories.UserBook;

namespace NovelryMAUIApp.ViewModels
{
    public partial class UserBookDetailViewModel : ObservableObject, IQueryAttributable
    {
        #region Services & Repositories
        private readonly IBookRepository _bookRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly ITimerRepository _timerRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserBookRepository _userBookRepository;

        private readonly INavigationService _navigationService;
        private readonly IUserSessionService _userSessionService;
        private readonly IAlertService _alertService;
        #endregion

        #region Properties
        [ObservableProperty]
        private UserDto _currentUser = new();

        [ObservableProperty]
        private UserBookDto _userBook = new();

        [ObservableProperty]
        private BookDto _selectedBook = new();

        [ObservableProperty]
        private List<ReviewDto> _selectedBookReviews = new();

        [ObservableProperty]
        private BookWithReviewDto _selectedBookWithReview = new();

        [ObservableProperty]
        private List<TimerDto> _selectedBookTimers = new();

        [ObservableProperty]
        private int _totalHours = new();

        [ObservableProperty]
        private int _longestSession = new();

        [ObservableProperty]
        private DateTime? _lastSession = new();

        [ObservableProperty]
        private string _currentPageText = string.Empty;

        [ObservableProperty]
        private UserBookStatus _status = new();

        [ObservableProperty]
        private int _totalPages = new();

        [ObservableProperty]
        private bool _isTimerRunning;

        [ObservableProperty]
        private TimeSpan? _elapsedTime;

        private TimerDto? _activeTimer;
        private System.Timers.Timer? _uiTimer;

        #endregion

        public UserBookDetailViewModel(
            INavigationService navigationService,
            IBookRepository bookRepository,
            IUserBookRepository userBookRepository,
            ITimerRepository timerRepository,
            IReviewRepository reviewRepository,
            IUserSessionService userSessionService,
            IUserRepository userRepository,
            IAlertService alertService
        )
        {
            _bookRepository = bookRepository;
            _reviewRepository = reviewRepository;
            _userBookRepository = userBookRepository;
            _timerRepository = timerRepository;
            _navigationService = navigationService;
            _userSessionService = userSessionService;
            _userRepository = userRepository;
            _alertService = alertService;
        }

        #region Lifecycle
        public async void ApplyQueryAttributes(IDictionary<string, object> query)
        {
            if (query["bookId"] is int bookId)
            {
                SelectedBook = await _bookRepository.GetBookByIdAsync(bookId) ?? new();
                TotalPages = SelectedBook.TotalPages;
                var average = await GetAverageRating(bookId);
                SelectedBookWithReview = CreateBookWithReviewDto(average);
            }
        }

        public async Task LoadData()
        {
            if (_userSessionService.CurrentUser == null)
            {
                await _navigationService.NavigateToAsync("//LoginPage");
                return;
            }

            CurrentUser = _userSessionService.CurrentUser;

            UserBook =
                (
                    await _userBookRepository.GetAllUserBooksByUserIdAsync(CurrentUser.Id)
                ).FirstOrDefault(ub => ub.Book?.Id == SelectedBook.Id) ?? new();

            SelectedBookTimers =
                await _timerRepository.GetAllTimersByUserIdAndBookIdAsync(
                    CurrentUser.Id,
                    SelectedBook.Id
                ) ?? new();

            if (SelectedBookTimers.Count > 0)
            {
                TotalHours = (int)(SelectedBookTimers.Sum(t => t.DurationMinutes ?? 0) / 60.0);
                LongestSession = (int)(SelectedBookTimers.Max(t => t.DurationMinutes ?? 0) / 60.0);
                LastSession = SelectedBookTimers
                    .OrderByDescending(t => t.EndTime)
                    .FirstOrDefault()
                    ?.EndTime;
            }
            else
            {
                TotalHours = 0;
                LongestSession = 0;
                LastSession = null;
            }

            Status = UserBook.Status;
            UpdateCurrentPageText();
        }
        #endregion

        #region Helpers
        private BookWithReviewDto CreateBookWithReviewDto(double? average) =>
            new()
            {
                Book = SelectedBook,
                Reviews = SelectedBookReviews,
                AverageRating = average?.ToString("n2") ?? "No rating",
            };

        private async Task<double?> GetAverageRating(int bookId)
        {
            SelectedBookReviews = await _reviewRepository.GetAllReviewsForBookAsync(bookId);
            return SelectedBookReviews.Any() ? SelectedBookReviews.Average(r => r.Rating) : null;
        }

        private UserBookStatus DetermineStatusFromPage(int page) =>
            page <= 0 ? UserBookStatus.WantToRead
            : page >= SelectedBook.TotalPages ? UserBookStatus.Read
            : UserBookStatus.Reading;

        private void UpdateCurrentPageText() =>
            CurrentPageText = $"{UserBook.CurrentPage} / {SelectedBook.TotalPages}";

        private async Task PersistUserBookChanges(int newPage, UserBookStatus derivedStatus)
        {
            var updateDto = new UpdateUserBookDto
            {
                Id = UserBook.Id,
                CurrentPage = newPage,
                Status = derivedStatus,
                IsCompleted = derivedStatus == UserBookStatus.Read,
            };

            var updated = await _userBookRepository.UpdateUserBookAsync(updateDto);
            if (updated == null)
                return;

            UserBook = new UserBookDto
            {
                Id = updated.Id,
                UserId = updated.UserId,
                BookId = updated.BookId,
                Book = updated.Book ?? await _bookRepository.GetBookByIdAsync(updated.BookId),
                CurrentPage = updated.CurrentPage,
                IsCompleted = updated.IsCompleted,
                Status = updated.Status,
                AddedAt = updated.AddedAt,
            };

            Status = UserBook.Status;
            UpdateCurrentPageText();
            await _navigationService.NavigateToAsync($"//{nameof(LibraryPage)}");
        }
        #endregion

        #region Commands

        [RelayCommand]
        private async Task GoBackAsync() => await _navigationService.GoBackAsync();

        [RelayCommand]
        public async Task UpdateCurrentPage(string? pageText)
        {
            if (
                UserBook == null
                || string.IsNullOrWhiteSpace(pageText)
                || !int.TryParse(pageText, out var newPage)
            )
                return;

            newPage = Math.Clamp(newPage, 0, SelectedBook.TotalPages);

            bool confirm = await _alertService.ShowConfirmationAsync(
                "Update Current Page",
                $"Do you want to update your current page to {newPage}?",
                "Yes",
                "No"
            );

            if (!confirm)
                return;

            var derivedStatus = DetermineStatusFromPage(newPage);
            UserBook.CurrentPage = newPage;
            UserBook.Status = derivedStatus;
            Status = derivedStatus;

            UpdateCurrentPageText();
            await PersistUserBookChanges(newPage, derivedStatus);
        }

        [RelayCommand]
        private async Task UpdateUserBook(UserBookStatus newStatus)
        {
            if (UserBook == null || UserBook.Id == 0)
                return;

            bool confirm = await _alertService.ShowConfirmationAsync(
                "Update",
                "Would you like to save the changes?",
                "Yes",
                "No"
            );

            if (!confirm)
                return;

            int newPage = newStatus switch
            {
                UserBookStatus.Reading when UserBook.Status == UserBookStatus.WantToRead => 1,
                UserBookStatus.WantToRead => 0,
                UserBookStatus.Read => SelectedBook.TotalPages,
                UserBookStatus.Reading when UserBook.CurrentPage >= SelectedBook.TotalPages =>
                    SelectedBook.TotalPages - 1,
                _ => UserBook.CurrentPage,
            };

            var derivedStatus = DetermineStatusFromPage(newPage);
            await PersistUserBookChanges(newPage, derivedStatus);
        }

        [RelayCommand]
        private async Task RemoveUserBookFromLibraryAsync(UserBookDto userBook)
        {
            if (UserBook == null || UserBook.Id == 0)
                return;

            bool confirm = await _alertService.ShowConfirmationAsync(
                "Update",
                "Would you like to remove this book?",
                "Yes",
                "No"
            );

            if (!confirm)
                return;

            await _userBookRepository.DeleteUserBookByIdAsync(userBook.Id);
            await _navigationService.NavigateToAsync($"//{nameof(LibraryPage)}");
        }

        [RelayCommand]
        private async Task StartReadingTimerAsync()
        {
            if (IsTimerRunning)
                return;

            var userBook = await _userBookRepository.GetUserBookByUserIdAndBookId(
                CurrentUser.Id,
                SelectedBook.Id
            );

            if (userBook == null)
                return;

            var newTimer = new CreateTimerDto
            {
                UserId = userBook.UserId,
                BookId = userBook.BookId,
                StartTime = DateTime.UtcNow,
            };

            try
            {
                var created = await _timerRepository.CreateTimerAsync(newTimer);
                if (created == null)
                {
                    await _alertService.ShowMessageAsync("Error", "Could not start timer.", "OK");
                    return;
                }

                _activeTimer = created;
                ElapsedTime = TimeSpan.Zero;
                IsTimerRunning = true;

                _uiTimer = new System.Timers.Timer(1000);
                _uiTimer.Elapsed += (s, e) =>
                {
                    MainThread.BeginInvokeOnMainThread(() =>
                    {
                        if (_activeTimer != null)
                            ElapsedTime = DateTime.UtcNow - _activeTimer.StartTime;
                    });
                };
                _uiTimer.Start();
            }
            catch (Exception ex)
            {
                await _alertService.ShowMessageAsync("Error", ex.Message, "OK");
            }
        }

        [RelayCommand]
        private async Task StopReadingTimerAsync()
        {
            if (!IsTimerRunning || _activeTimer == null)
                return;

            _uiTimer?.Stop();
            _uiTimer?.Dispose();

            if (_activeTimer.StartTime == null)
            {
                await _alertService.ShowMessageAsync(
                    "Error",
                    "Timer start time was missing or invalid.",
                    "OK"
                );
                return;
            }

            var endTime = DateTime.UtcNow;
            var duration = endTime - _activeTimer.StartTime.Value;

            var updateDto = new UpdateTimerDto { Id = _activeTimer.Id, EndTime = endTime };

            var updated = await _timerRepository.UpdateTimerAsync(updateDto);
            if (updated == null)
            {
                await _alertService.ShowMessageAsync("Error", "Failed to stop timer.", "OK");
                return;
            }

            IsTimerRunning = false;
            _activeTimer = null;

            await LoadData();

            await MainThread.InvokeOnMainThreadAsync(async () =>
            {
                var message =
                    $"You read for {Math.Floor(duration.TotalHours)}h {duration.Minutes}m. {duration.Seconds}s.";
                await _alertService.ShowMessageAsync("Reading session ended", message, "OK");
            });

            ElapsedTime = new();
        }

        [RelayCommand]
        private async Task ToggleReadingTimerAsync()
        {
            if (IsTimerRunning)
                await StopReadingTimerAsync();
            else
                await StartReadingTimerAsync();
        }

        [RelayCommand]
        private async Task GoToWriteReviewPage(BookDto selectedBook)
        {
            await _navigationService.NavigateToAsync(
                nameof(WriteReviewPage),
                new Dictionary<string, object>() { { "book", selectedBook } }
            );
        }
        #endregion
    }
}
