using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.Genre;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Review;

namespace NovelryMAUIApp.ViewModels
{
    public partial class FilteredBooksViewModel : ObservableObject, IQueryAttributable
    {
        #region Services & Repositories
        private readonly IBookRepository _bookRepository;
        private readonly IReviewRepository _reviewRepository;

        private readonly INavigationService _navigationService;
        private readonly IUserSessionService _userSessionService;
        #endregion

        #region Properties
        [ObservableProperty]
        private List<BookDto>? _books;

        [ObservableProperty]
        private List<BookWithReviewDto>? _booksWithReviews = new();
        #endregion

        public FilteredBooksViewModel(
            IBookRepository bookRepository,
            INavigationService navigationService,
            IUserSessionService userSessionService,
            IReviewRepository reviewRepository
        )
        {
            _bookRepository = bookRepository;
            _navigationService = navigationService;
            _userSessionService = userSessionService;
            _reviewRepository = reviewRepository;
        }

        #region Lifecycle
        public async void ApplyQueryAttributes(IDictionary<string, object> query)
        {
            if (query["genre"] is GenreDto genre)
            {
                Books = await _bookRepository.GetBooksByGenreAsync(genre.Name);
            }
        }
        #endregion

        #region Commands
        [RelayCommand]
        public async Task GoToExplorePageAsync()
        {
            await _navigationService.NavigateToAsync($"//{nameof(ExplorePage)}");
        }

        [RelayCommand]
        private async Task GoToBookDetailAsync(int bookId)
        {
            await _navigationService.NavigateToAsync(
                $"{nameof(BookInfoPage)}",
                new Dictionary<string, object>() { { "bookId", bookId } }
            );
        }
        #endregion
    }
}
