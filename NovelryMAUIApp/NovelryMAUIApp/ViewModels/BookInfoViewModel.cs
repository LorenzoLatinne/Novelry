using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.User;
using NovelryDTO.DTOs.UserBook;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Review;
using NovelryMAUIApp.Repositories.User;
using NovelryMAUIApp.Repositories.UserBook;

namespace NovelryMAUIApp.ViewModels
{
    public partial class BookInfoViewModel : ObservableObject, IQueryAttributable
    {
        #region Private variables / DI
        private readonly IBookRepository _bookRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly IUserBookRepository _userBookRepository;
        private readonly IUserRepository _userRepository;

        private readonly INavigationService _navigationService;
        private readonly IUserSessionService _userSessionService;
        private readonly IAlertService _alertService;
        #endregion

        #region Properties
        [ObservableProperty]
        private BookDto _selectedBook;

        [ObservableProperty]
        private double _selectedBookRating;

        [ObservableProperty]
        private List<ReviewDto> _selectedBookReviews;

        [ObservableProperty]
        private BookWithReviewDto _selectedBookWithReview;

        [ObservableProperty]
        private UserDto _reviewer;

        [ObservableProperty]
        private UserDto _currentUser;
        #endregion

        public BookInfoViewModel(
            IBookRepository bookRepository,
            IReviewRepository reviewRepository,
            IUserBookRepository userBookRepository,
            IUserRepository userRepository,
            INavigationService navigationService,
            IUserSessionService userSessionService,
            IAlertService alertService
        )
        {
            _bookRepository = bookRepository;
            _reviewRepository = reviewRepository;
            _userBookRepository = userBookRepository;
            _userRepository = userRepository;

            _navigationService = navigationService;
            _userSessionService = userSessionService;
            _alertService = alertService;
        }

        public async void ApplyQueryAttributes(IDictionary<string, object> query)
        {
            if (query["bookId"] is int bookId)
            {
                SelectedBook = await _bookRepository.GetBookByIdAsync(bookId) ?? new();
                SelectedBookReviews = await _reviewRepository.GetAllReviewsForBookAsync(bookId);
                double? average = SelectedBookReviews.Any()
                    ? SelectedBookReviews.Average(r => r.Rating)
                    : null;
                SelectedBookWithReview = new BookWithReviewDto()
                {
                    Book = SelectedBook,
                    Reviews = SelectedBookReviews,
                    AverageRating = average?.ToString("n2") ?? "No rating",
                };

                for (int i = 0; i < SelectedBookWithReview.Reviews.Count; i++)
                {
                    SelectedBookWithReview.Reviews[i].ProfileUrl =
                        (
                            await _userRepository.GetUserByIdAsync(
                                SelectedBookWithReview.Reviews[i].UserId
                            )
                        )?.ImageUrl
                        ?? null;
                }

                if (_userSessionService.CurrentUser != null)
                    CurrentUser = _userSessionService.CurrentUser;
            }
        }

        #region Commands
        [RelayCommand]
        private async Task GoBackAsync()
        {
            await _navigationService.GoBackAsync();
        }

        [RelayCommand]
        private async Task AddBookToLibraryAsync(int bookId)
        {
            var book = await _bookRepository.GetBookByIdAsync(bookId);
            var existing = await _userBookRepository.GetUserBookByUserIdAndBookId(
                CurrentUser.Id,
                bookId
            );

            if (existing == null)
            {
                var bookToAdd = new CreateUserBookDto()
                {
                    UserId = CurrentUser.Id,
                    BookId = bookId,
                    Status = UserBookStatus.WantToRead,
                };

                await _userBookRepository.CreateUserBookAsync(bookToAdd);
                await _alertService.ShowMessageAsync(
                    "Success!",
                    $"{book.Title} has been added to your library.",
                    "Ok"
                );
                await _navigationService.NavigateToAsync($"//{nameof(ExplorePage)}");
            }
            else
            {
                await _alertService.ShowMessageAsync(
                    "Oops!",
                    "You already have this book in your library.",
                    "Ok"
                );
            }
        }
        #endregion
    }
}
