using NovelryDTO.DTOs.Achievement;
using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.User;
using NovelryDTO.DTOs.UserBook;
using NovelryMAUIApp.Repositories.Review;
using NovelryMAUIApp.Repositories.UserAchievement;
using NovelryMAUIApp.Repositories.UserBook;

namespace NovelryMAUIApp.ViewModels
{
    public partial class ProfileViewModel : ObservableObject
    {
        #region Repositories and Services
        private readonly IUserBookRepository _userBookRepository;
        private readonly IUserAchievementRepository _userAchievementRepository;
        private readonly IReviewRepository _reviewRepository;

        private readonly INavigationService _navigationService;
        private readonly IUserSessionService _userSessionService;
        #endregion

        #region Properties
        [ObservableProperty]
        private UserDto _user;

        [ObservableProperty]
        private List<UserBookDto>? _booksRead;

        [ObservableProperty]
        private List<ReviewDto>? _reviewsWritten;

        [ObservableProperty]
        private string _averageRating;

        [ObservableProperty]
        private List<UserAchievementDto>? _achievementsEarned;
        #endregion

        public ProfileViewModel(
            IUserBookRepository userBookRepository,
            IReviewRepository reviewRepository,
            IUserAchievementRepository userAchievementRepository,
            INavigationService navigationService,
            IUserSessionService userSessionService
        )
        {
            _userBookRepository = userBookRepository;
            _userAchievementRepository = userAchievementRepository;
            _reviewRepository = reviewRepository;

            _navigationService = navigationService;
            _userSessionService = userSessionService;
        }

        public async Task LoadData()
        {
            if (_userSessionService.CurrentUser != null)
                User = _userSessionService.CurrentUser;
            else
            {
                await _navigationService.NavigateToAsync("LoginPage");
                return;
            }

            BooksRead = (await _userBookRepository.GetAllUserBooksByUserIdAsync(User.Id))
                .Where(ub => ub.Status == UserBookStatus.Read)
                .ToList();
            ReviewsWritten = await _reviewRepository.GetAllReviewsByUserIdAsync(User.Id);
            AverageRating =
                (ReviewsWritten != null && ReviewsWritten.Count > 0)
                    ? ReviewsWritten?.Average(r => r.Rating).ToString("n2") ?? "0"
                    : "0";
            AchievementsEarned = await _userAchievementRepository.GetUserAchievementsByIdAsync(
                User.Id
            );
        }

        #region Commands
        [RelayCommand]
        public async Task GoToDashboardAsync()
        {
            await _navigationService.NavigateToAsync("//DashboardPage");
        }

        [RelayCommand]
        public async Task LogOutAsync()
        {
            _userSessionService.CurrentUser = null;
            await _navigationService.NavigateToAsync("//LoginPage");
        }
        #endregion
    }
}
