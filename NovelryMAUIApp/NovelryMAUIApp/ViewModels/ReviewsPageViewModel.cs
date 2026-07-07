using NovelryDTO.DTOs.Book;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Review;

namespace NovelryMAUIApp.ViewModels
{
    public partial class ReviewsPageViewModel : ObservableObject
    {
        private readonly INavigationService _navigationService;
        private readonly IReviewRepository _reviewRepository;
        private readonly IBookRepository _bookRepository;

        [ObservableProperty]
        private List<ReviewDto> _reviewsDetail = new();

        [ObservableProperty]
        private List<BookDto> _booksDetail = new();

        [ObservableProperty]
        private List<BookWithReviewDto?> _reviewsWithBooks = new();

        public ReviewsPageViewModel(
            INavigationService navigationService,
            IReviewRepository reviewRepository,
            IBookRepository bookRepository
        )
        {
            _navigationService = navigationService;
            _reviewRepository = reviewRepository;
            _bookRepository = bookRepository;
        }

        public async Task UpdateReviewsDataAsync()
        {
            await GetReviews();
        }

        private async Task GetReviews()
        {
            ReviewsDetail = await _reviewRepository.GetLastTwentyReviewsAsync();
            List<BookWithReviewDto?> latestReviews = new();

            foreach (var review in ReviewsDetail)
            {
                if (!latestReviews.Any(rb => rb?.Book?.Id == review.BookId))
                {
                    latestReviews.Add(
                        new()
                        {
                            Book = await _bookRepository.GetBookByIdAsync(review.BookId),
                            Reviews = await _reviewRepository.GetAllReviewsForBookAsync(
                                review.BookId
                            ),
                        }
                    );
                }
            }
            ReviewsWithBooks = latestReviews;
        }

        #region Commands
        [RelayCommand]
        public async Task GoToDashboard()
        {
            await _navigationService.NavigateToAsync("//DashboardPage");
        }
        #endregion
    }
}
