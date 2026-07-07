using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.User;
using NovelryDTO.DTOs.UserBook;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Review;
using NovelryMAUIApp.Repositories.User;

namespace NovelryMAUIApp.ViewModels
{
    public partial class WriteReviewViewModel : ObservableObject, IQueryAttributable
    {
        private readonly IBookRepository _bookRepository;
        private readonly IUserRepository _userRepository;
        private readonly IReviewRepository _reviewRepository;

        private readonly IUserSessionService _userSessionService;
        private readonly INavigationService _navigationService;
        private readonly IAlertService _alertService;

        [ObservableProperty]
        private BookDto? _selectedBook = new();

        [ObservableProperty]
        private string _reviewTextBoxPlaceholder = string.Empty;

        [ObservableProperty]
        private string _reviewComment = string.Empty;

        [ObservableProperty]
        private int _givenRating;

        [ObservableProperty]
        private UserDto? _currentUser = new();

        [ObservableProperty]
        private bool _isFirstStarFilled;

        [ObservableProperty]
        private bool _isSecondStarFilled;

        [ObservableProperty]
        private bool _isThirdStarFilled;

        [ObservableProperty]
        private bool _isFourthStarFilled;

        [ObservableProperty]
        private bool _isFifthStarFilled;

        public WriteReviewViewModel(
            IBookRepository bookRepository,
            IUserRepository userRepository,
            IReviewRepository reviewRepository,
            IUserSessionService userSessionService,
            INavigationService navigationService,
            IAlertService alertService
        )
        {
            _bookRepository = bookRepository;
            _userRepository = userRepository;
            _reviewRepository = reviewRepository;

            _userSessionService = userSessionService;
            _navigationService = navigationService;
            _alertService = alertService;

            _currentUser = _userSessionService.CurrentUser ?? null;
            GivenRating = 1;
        }

        public void ApplyQueryAttributes(IDictionary<string, object> query)
        {
            if (query["book"] is BookDto selectedBook)
            {
                SelectedBook = selectedBook;
                ReviewTextBoxPlaceholder = $"Write your toughts about '{SelectedBook?.Title}'.";
            }
        }

        [RelayCommand]
        private static async Task GoBack() => await Shell.Current.Navigation.PopToRootAsync(true);

        [RelayCommand]
        private async Task SubmitReview()
        {
            if (SelectedBook != null && CurrentUser != null)
            {
                var newReview = new CreateReviewDto()
                {
                    BookId = SelectedBook.Id,
                    Comment = ReviewComment,
                    Rating = GivenRating,
                };

                var response = await _reviewRepository.CreateReviewAsync(
                    newReview,
                    CurrentUser.Id,
                    CurrentUser.Username
                );

                if (response != null)
                {
                    await _alertService.ShowMessageAsync(
                        "Review added",
                        "You've succesfully added a review to this book.",
                        "Ok"
                    );
                    await Shell.Current.Navigation.PopToRootAsync(true);
                }
                else
                {
                    await _alertService.ShowMessageAsync(
                        "Review failed",
                        "Something went wrong trying to add your review, please try again later.",
                        "Ok"
                    );
                }
            }
            else
            {
                await _alertService.ShowMessageAsync(
                    "Oops!",
                    "Either a book has not been selected, or something went wrong fetching your info. Please try again later.",
                    "Ok"
                );
            }
        }

        [RelayCommand]
        private void SetRating(string rating)
        {
            GivenRating = int.Parse(rating);
            UpdateStarIcons();
        }

        private void UpdateStarIcons()
        {
            IsFirstStarFilled = GivenRating >= 1;
            IsSecondStarFilled = GivenRating >= 2;
            IsThirdStarFilled = GivenRating >= 3;
            IsFourthStarFilled = GivenRating >= 4;
            IsFifthStarFilled = GivenRating >= 5;
        }
    }
}
