using NovelryDTO.DTOs.Timer;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.User;

namespace NovelryMAUIApp.Repositories.Timer
{
    public class MockTimerRepository : ITimerRepository
    {
        private readonly IBookRepository _bookRepository;
        private readonly IUserRepository _userRepository;
        private readonly List<TimerDto> _timers = new()
        {
            new()
            {
                Id = 1,
                BookId = 1,
                UserId = 1,
                StartTime = DateTime.UtcNow.AddDays(-1) - TimeSpan.FromMinutes(189),
                EndTime = DateTime.UtcNow.AddDays(-1),
            },
            new()
            {
                Id = 2,
                BookId = 2,
                UserId = 2,
                StartTime = DateTime.UtcNow + TimeSpan.FromHours(1) - TimeSpan.FromMinutes(13),
                EndTime = DateTime.UtcNow + TimeSpan.FromHours(1),
            },
        };

        public MockTimerRepository(IBookRepository bookRepository, IUserRepository userRepository)
        {
            _bookRepository = bookRepository;
            _userRepository = userRepository;
        }

        public Task<TimerDto?> CreateTimerAsync(CreateTimerDto timer)
        {
            if (timer == null)
                return Task.FromResult<TimerDto?>(null);

            TimerDto newTimer = new()
            {
                Id = _timers.Any() ? _timers.Max(t => t.Id) + 1 : 1,
                BookId = timer.BookId,
                UserId = timer.UserId,
                StartTime = timer.StartTime,
            };

            _timers.Add(newTimer);

            return Task.FromResult(newTimer ?? null);
        }

        public Task<bool> DeleteTimerByIdAsync(int id)
        {
            var timer = _timers.First(t => t.Id == id);
            if (timer == null)
                return Task.FromResult(false);

            _timers.Remove(timer);
            return Task.FromResult(true);
        }

        public Task<List<TimerDto>> GetAllTimersAsync()
        {
            return Task.FromResult(_timers.ToList());
        }

        public async Task<List<TimerDto>> GetAllTimersByBookAsync(string bookTitle)
        {
            var book = await _bookRepository.GetBookByTitleAsync(bookTitle);
            if (book == null)
                return new();

            return _timers.Where(t => t.BookId == book.Id).ToList();
        }

        public async Task<List<TimerDto>> GetAllTimersByUserIdAndBookIdAsync(int userId, int bookId)
        {
            return _timers.Where(t => t.UserId == userId && t.BookId == bookId).ToList();
        }

        public async Task<List<TimerDto>> GetAllTimersByUserIdAsync(int userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
                return new();

            return _timers.Where(t => t.UserId == userId).ToList();
        }

        public async Task<List<TimerDto>> GetAllTimersByUsernameAsync(string username)
        {
            var user = await _userRepository.GetUserByUsernameAsync(username);
            if (user == null)
                return new();

            return _timers.Where(t => t.UserId == user.Id).ToList();
        }

        public Task<TimerDto?> GetTimerByIdAsync(int id)
        {
            return Task.FromResult(_timers.FirstOrDefault(t => t.Id == id) ?? null);
        }

        public Task<TimerDto?> UpdateTimerAsync(UpdateTimerDto timer)
        {
            var existing = _timers.FirstOrDefault(t => t.Id == timer.Id);
            if (existing == null)
                return Task.FromResult<TimerDto?>(null);

            if (!string.IsNullOrEmpty(timer.EndTime.ToString()))
                existing.EndTime = timer.EndTime;

            return Task.FromResult(existing ?? null);
        }
    }
}
