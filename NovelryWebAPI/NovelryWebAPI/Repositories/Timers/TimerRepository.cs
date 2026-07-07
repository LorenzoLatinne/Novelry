using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.Timer;
using NovelryWebAPI.Data;

namespace NovelryWebAPI.Repositories.Timers
{
    public class TimerRepository : ITimerRepository
    {
        private readonly AppDbContext _context;

        public TimerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TimerDto?> CreateTimerAsync(CreateTimerDto timer)
        {
            var user = await _context.Users.FindAsync(timer.UserId);
            var book = await _context.Books.FindAsync(timer.BookId);

            if (user == null || book == null)
                return null;

            var newEntity = new Models.Timer
            {
                UserId = timer.UserId,
                BookId = timer.BookId,
                StartTime = timer.StartTime,
            };

            _context.Timers.Add(newEntity);
            await _context.SaveChangesAsync();

            return new TimerDto
            {
                Id = newEntity.TimerId,
                UserId = newEntity.UserId,
                BookId = newEntity.BookId,
                StartTime = newEntity.StartTime,
                EndTime = newEntity.EndTime,
            };
        }

        public async Task<bool> DeleteTimerByIdAsync(int id)
        {
            var entity = await _context.Timers.FindAsync(id);
            if (entity == null)
                return false;

            _context.Timers.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<TimerDto>> GetAllTimersAsync()
        {
            return await _context
                .Timers.Select(t => new TimerDto
                {
                    Id = t.TimerId,
                    UserId = t.UserId,
                    BookId = t.BookId,
                    StartTime = t.StartTime,
                    EndTime = t.EndTime,
                })
                .ToListAsync();
        }

        public async Task<List<TimerDto>> GetAllTimersByUserIdAsync(int userId)
        {
            return await _context
                .Timers.Where(t => t.UserId == userId)
                .Select(t => new TimerDto
                {
                    Id = t.TimerId,
                    UserId = t.UserId,
                    BookId = t.BookId,
                    StartTime = t.StartTime,
                    EndTime = t.EndTime,
                })
                .ToListAsync();
        }

        public async Task<List<TimerDto>> GetAllTimersByUsernameAsync(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == username.ToLower()
            );

            if (user == null)
                return new List<TimerDto>();

            return await GetAllTimersByUserIdAsync(user.UserId);
        }

        public async Task<List<TimerDto>> GetAllTimersByBookIdAsync(int bookId)
        {
            return await _context
                .Timers.Where(t => t.BookId == bookId)
                .Select(t => new TimerDto
                {
                    Id = t.TimerId,
                    UserId = t.UserId,
                    BookId = t.BookId,
                    StartTime = t.StartTime,
                    EndTime = t.EndTime,
                })
                .ToListAsync();
        }

        public async Task<TimerDto?> GetTimerByIdAsync(int id)
        {
            var entity = await _context.Timers.FindAsync(id);
            if (entity == null)
                return null;

            return new TimerDto
            {
                Id = entity.TimerId,
                UserId = entity.UserId,
                BookId = entity.BookId,
                StartTime = entity.StartTime,
                EndTime = entity.EndTime,
            };
        }

        public async Task<TimerDto?> UpdateTimerAsync(UpdateTimerDto timer)
        {
            var existing = await _context.Timers.FindAsync(timer.Id);
            if (existing == null)
                return null;

            existing.EndTime = timer.EndTime;

            await _context.SaveChangesAsync();

            return new TimerDto
            {
                Id = existing.TimerId,
                UserId = existing.UserId,
                BookId = existing.BookId,
                StartTime = existing.StartTime,
                EndTime = existing.EndTime,
            };
        }
    }
}
