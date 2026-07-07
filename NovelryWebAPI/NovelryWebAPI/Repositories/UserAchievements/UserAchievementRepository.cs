using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.Achievement;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Repositories.UserAchievements
{
    public class UserAchievementRepository : IUserAchievementRepository
    {
        private readonly AppDbContext _context;

        public UserAchievementRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserAchievementDto>> GetUserAchievementsByUserIdAsync(int userId)
        {
            return await _context
                .UserAchievements.Where(ua => ua.UserId == userId)
                .Select(ua => new UserAchievementDto
                {
                    Id = ua.UserAchievementId,
                    UserId = ua.UserId,
                    AchievementId = ua.AchievementId,
                    AchievedAt = ua.AchievedAt,
                })
                .ToListAsync();
        }

        public async Task<List<UserAchievementDto>> GetUserAchievementsByUsernameAsync(
            string username
        )
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == username.ToLower()
            );
            if (user == null)
                return new List<UserAchievementDto>();

            return await GetUserAchievementsByUserIdAsync(user.UserId);
        }

        public async Task<UserAchievementDto?> GrantAchievementAsync(CreateUserAchievementDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            var achievement = await _context.Achievements.FindAsync(dto.AchievementId);

            if (user == null || achievement == null)
                return null;

            var exists = await _context.UserAchievements.AnyAsync(ua =>
                ua.UserId == dto.UserId && ua.AchievementId == dto.AchievementId
            );

            if (exists)
                return null;

            var newUserAchievement = new UserAchievement
            {
                UserId = dto.UserId,
                AchievementId = dto.AchievementId,
                AchievedAt = DateTime.UtcNow,
            };

            _context.UserAchievements.Add(newUserAchievement);
            await _context.SaveChangesAsync();

            return new UserAchievementDto
            {
                Id = newUserAchievement.UserAchievementId,
                UserId = newUserAchievement.UserId,
                AchievementId = newUserAchievement.AchievementId,
                AchievedAt = newUserAchievement.AchievedAt,
            };
        }
    }
}
