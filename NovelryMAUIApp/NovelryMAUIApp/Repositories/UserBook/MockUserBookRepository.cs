using NovelryDTO.DTOs.UserBook;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.User;

namespace NovelryMAUIApp.Repositories.UserBook
{
    public class MockUserBookRepository : IUserBookRepository
    {
        private readonly IUserRepository _userRepository;
        private readonly IBookRepository _bookRepository;

        private readonly List<UserBookDto> _userBooks = new()
        {
            new()
            {
                Id = 1,
                UserId = 1,
                BookId = 1,
                AddedAt = DateTime.UtcNow,
                CurrentPage = 146,
                IsCompleted = false,
                Status = UserBookStatus.Reading,
            },
            new()
            {
                Id = 2,
                UserId = 2,
                BookId = 2,
                AddedAt = DateTime.UtcNow,
                CurrentPage = 86,
                IsCompleted = false,
                Status = UserBookStatus.Reading,
            },
        };

        public MockUserBookRepository(
            IUserRepository userRepository,
            IBookRepository bookRepository
        )
        {
            _userRepository = userRepository;
            _bookRepository = bookRepository;
        }

        public async Task<UserBookDto?> CreateUserBookAsync(CreateUserBookDto userBook)
        {
            var bookDto = await _bookRepository.GetBookByIdAsync(userBook.BookId) ?? null;
            if (bookDto == null)
                return null;

            var newBook = new UserBookDto()
            {
                Id = _userBooks.Any() ? _userBooks.Max(ub => ub.Id) + 1 : 1,
                UserId = userBook.UserId,
                BookId = userBook.BookId,
                AddedAt = DateTime.UtcNow,
                Status = userBook.Status,
                IsCompleted = userBook.Status == UserBookStatus.Read,
                CurrentPage = userBook.Status == UserBookStatus.Read ? bookDto.TotalPages : 0,
            };
            _userBooks.Add(newBook);

            return newBook;
        }

        public Task<bool> DeleteUserBookByIdAsync(int id)
        {
            var userBook = _userBooks.FirstOrDefault(ub => ub.Id == id);
            if (userBook == null)
                return Task.FromResult(false);

            _userBooks.Remove(userBook);
            return Task.FromResult(true);
        }

        public async Task<List<UserBookDto>> GetAllUserBooksByUserIdAsync(int userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
                return new();

            return _userBooks.Where(ub => ub.UserId == user.Id).ToList();
        }

        public async Task<List<UserBookDto>> GetAllUserBooksByUsernameAsync(string username)
        {
            var user = await _userRepository.GetUserByUsernameAsync(username);
            if (user == null)
                return new();

            return _userBooks.Where(ub => ub.UserId == user.Id).ToList();
        }

        public Task<UserBookDto?> GetUserBookById(int id)
        {
            return Task.FromResult(_userBooks.FirstOrDefault(ub => ub.Id == id) ?? null);
        }

        public Task<UserBookDto?> GetUserBookByUserIdAndBookId(int userId, int bookId)
        {
            return Task.FromResult(
                _userBooks.FirstOrDefault(ub => ub.BookId == bookId && ub.UserId == userId) ?? null
            );
        }

        public Task<UserBookDto?> UpdateUserBookAsync(UpdateUserBookDto userBook)
        {
            var existing = _userBooks.FirstOrDefault(ub => ub.Id == userBook.Id);
            if (existing == null)
                return Task.FromResult<UserBookDto?>(null);

            if (existing.CurrentPage != userBook.CurrentPage && userBook.CurrentPage != null)
                existing.CurrentPage = (int)userBook.CurrentPage;

            if (existing.IsCompleted != userBook.IsCompleted && userBook.IsCompleted != null)
                existing.IsCompleted = (bool)userBook.IsCompleted;

            if (existing.Status != userBook.Status && userBook.Status != null)
                existing.Status = (UserBookStatus)userBook.Status;

            return Task.FromResult(existing ?? null);
        }
    }
}
