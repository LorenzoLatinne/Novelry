using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.Genre;
using NovelryDTO.DTOs.User;
using NovelryDTO.DTOs.UserBook;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Genre;
using NovelryMAUIApp.Repositories.Review;
using NovelryMAUIApp.Repositories.UserBook;

namespace NovelryMAUIApp.ViewModels
{
    public partial class ExplorePageViewModel : ObservableObject
    {
        #region Services and repos
        private readonly IBookRepository _bookRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly IGenreRepository _genreRepository;
        private readonly IUserBookRepository _userBookRepository;

        private readonly INavigationService _navigationService;
        private readonly IUserSessionService _userSessionService;
        #endregion

        #region Private variables
        private CancellationTokenSource _searchCts = new();

        private List<(int Id, string Title, string AuthorNames)> _searchIndex = new();

        [ObservableProperty]
        private List<BookDto> _books = new();

        [ObservableProperty]
        private List<ReviewDto> _reviews = new();

        [ObservableProperty]
        private List<GenreDto> _genres = new();

        [ObservableProperty]
        private List<BookWithReviewDto> _reviewsWithBooks = new();

        [ObservableProperty]
        private List<BookWithReviewDto> _trendingBooks = new();

        [ObservableProperty]
        private List<BookWithReviewDto> _newReleases = new();

        [ObservableProperty]
        private List<BookWithReviewDto> _forYouBooks = new();

        [ObservableProperty]
        private UserDto? _currentUser;

        [ObservableProperty]
        private string _searchText = string.Empty;

        [ObservableProperty]
        private List<BookWithReviewDto> _searchResults = new();

        [ObservableProperty]
        private bool _isSearching = false;
        #endregion

        public ExplorePageViewModel(
            IBookRepository bookrepository,
            IReviewRepository reviewRepository,
            IGenreRepository genreRepository,
            IUserBookRepository userBookRepository,
            INavigationService navigationService,
            IUserSessionService userSessionService
        )
        {
            _bookRepository = bookrepository;
            _reviewRepository = reviewRepository;
            _genreRepository = genreRepository;
            _userBookRepository = userBookRepository;

            _navigationService = navigationService;
            _userSessionService = userSessionService;

            CurrentUser = _userSessionService.CurrentUser;
        }

        public async Task UpdateExplorePage()
        {
            Genres = (await _genreRepository.GetAllGenresAsync()).OrderBy(g => g.Name).ToList();

            var allBooksWithReviews = await _bookRepository.GetAllBooksWithReviewsAsync();

            var userBooks =
                CurrentUser != null
                    ? await _userBookRepository.GetAllUserBooksByUserIdAsync(CurrentUser.Id)
                    : new();
            var userBookIds = userBooks.Select(ub => ub.BookId);

            ReviewsWithBooks = new(
                allBooksWithReviews.Where(b => b.Book != null && !userBookIds.Contains(b.Book.Id))
            );

            _searchIndex = new(
                allBooksWithReviews
                    .Where(b => b.Book != null)
                    .Select(b =>
                        (
                            b.Book!.Id,
                            Title: b.Book.Title?.ToLower() ?? "",
                            AuthorNames: string.Join(
                                    " ",
                                    b.Book.Authors.Select(a => $"{a.FirstName} {a.LastName}")
                                )
                                .ToLower()
                        )
                    )
            );

            TrendingBooks = new(
                allBooksWithReviews
                    .Where(b => b.Book != null && !userBookIds.Contains(b.Book.Id))
                    .OrderByDescending(b =>
                    {
                        if (b.Reviews == null || b.Reviews.Count == 0)
                            return DateTime.MinValue;
                        return b.Reviews.Max(r => r.CreatedAt);
                    })
                    .ThenByDescending(b =>
                        double.TryParse(b.AverageRating, out double avg) ? avg : 0
                    )
                    .Take(5)
            );

            NewReleases = new(
                allBooksWithReviews
                    .Where(b => b.Book != null && !userBookIds.Contains(b.Book.Id))
                    .OrderByDescending(b => b.Book!.Id)
                    .Take(5)
            );

            if (CurrentUser != null)
            {
                var userGenres = new List<int>(
                    userBooks.SelectMany(ub =>
                        allBooksWithReviews
                            .FirstOrDefault(b => b.Book!.Id == ub.BookId)
                            ?.Book!.Genres.Select(g => g.Id)
                        ?? new List<int>()
                    )
                );

                ForYouBooks = new(
                    allBooksWithReviews
                        .Where(b => b.Book != null && !userBookIds.Contains(b.Book.Id))
                        .Select(b => new
                        {
                            Book = b,
                            MatchCount = b.Book?.Genres.Count(g => userGenres.Contains(g.Id)) ?? 0,
                        })
                        .OrderByDescending(x => x.MatchCount)
                        .ThenByDescending(x =>
                            double.TryParse(x.Book.AverageRating, out double avg) ? avg : 0
                        )
                        .Take(5)
                        .Select(x => x.Book)
                );
            }
            else
            {
                ForYouBooks = TrendingBooks;
            }
        }

        partial void OnSearchTextChanged(string value)
        {
            UpdateSearchResults(value);
        }

        private async void UpdateSearchResults(string query)
        {
            _searchCts.Cancel();
            _searchCts = new CancellationTokenSource();
            var token = _searchCts.Token;

            if (string.IsNullOrWhiteSpace(query))
            {
                await MainThread.InvokeOnMainThreadAsync(() =>
                {
                    IsSearching = false;
                    SearchResults.Clear();
                });
                return;
            }

            try
            {
                await Task.Delay(350, token);
                if (token.IsCancellationRequested)
                    return;

                var results = await _bookRepository.SearchBooksAsync(query);
                if (token.IsCancellationRequested)
                    return;

                await MainThread.InvokeOnMainThreadAsync(() =>
                {
                    SearchResults = results;
                    IsSearching = true;
                });
            }
            catch (TaskCanceledException) { }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Search error: {ex}");
            }
        }

        #region Commands
        [RelayCommand]
        public async Task GoToDashboardAsync()
        {
            await _navigationService.NavigateToAsync("//DashboardPage");
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
        private async Task FilterBooksByCategoryAsync(GenreDto genre)
        {
            await _navigationService.NavigateToAsync(
                $"//{nameof(FilteredBooksPage)}",
                new Dictionary<string, object>() { { "genre", genre } }
            );
        }
        #endregion
    }
}
