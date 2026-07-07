using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.UserBook;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.UserBook;

namespace NovelryMAUIApp.ViewModels
{
    public partial class LibraryViewModel : ObservableObject
    {
        public const int PercentBarWidth = 300;

        #region Repositories
        private readonly IBookRepository _bookRepository;
        private readonly IUserBookRepository _userBookRepository;
        #endregion

        #region Services
        private readonly IUserSessionService _userSessionService;
        private readonly INavigationService _navigationService;
        #endregion

        #region Properties
        [ObservableProperty]
        private List<UserBookDto> _userBooks = new();

        [ObservableProperty]
        private string _percentageText = "";
        #endregion

        public LibraryViewModel(
            IBookRepository bookRepository,
            IUserBookRepository userBookRepository,
            IUserSessionService userServiceSession,
            INavigationService navigationService
        )
        {
            _bookRepository = bookRepository;
            _userBookRepository = userBookRepository;
            _userSessionService = userServiceSession;
            _navigationService = navigationService;
        }

        public async Task GetUserBooks()
        {
            UserBooks = await _userBookRepository.GetAllUserBooksByUserIdAsync(
                _userSessionService.CurrentUser!.Id
            );

            foreach (var userBook in UserBooks)
            {
                var matchedBook = await _bookRepository.GetBookByIdAsync(userBook.BookId);
                userBook.Book = matchedBook;
            }
        }

        #region Commands
        [RelayCommand]
        private async Task GoToUserBookDetail(int bookId)
        {
            await _navigationService.NavigateToAsync(
                $"UserBookDetailPage",
                new Dictionary<string, object>() { { "bookId", bookId } }
            );
        }

        [RelayCommand]
        public async Task GoToDashboardAsync()
        {
            await _navigationService.NavigateToAsync("//DashboardPage");
        }
        #endregion
    }
}
