using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.Achievement;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Repositories.Achievements
{
    public class AchievementRepository : IAchievementRepository
    {
        private readonly AppDbContext _context;

        public AchievementRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<AchievementDto>> GetAllAsync()
        {
            return await _context
                .Achievements.Select(a => new AchievementDto
                {
                    Id = a.AchievementId,
                    Name = a.Name,
                    Description = a.Description,
                    TargetValue = a.TargetValue,
                    TriggerType = a.TriggerType,
                    Icon = a.ImageUrl,
                })
                .ToListAsync();
        }

        public async Task<AchievementDto?> GetByIdAsync(int id)
        {
            var a = await _context.Achievements.FindAsync(id);
            if (a == null)
                return null;
            return new AchievementDto
            {
                Id = a.AchievementId,
                Name = a.Name,
                Description = a.Description,
                TargetValue = a.TargetValue,
                TriggerType = a.TriggerType,
                Icon = a.ImageUrl,
            };
        }

        public async Task<AchievementDto?> GetByNameAsync(string name)
        {
            var a = await _context.Achievements.FirstOrDefaultAsync(x => x.Name == name);
            if (a == null)
                return null;
            return new AchievementDto
            {
                Id = a.AchievementId,
                Name = a.Name,
                Description = a.Description,
                TargetValue = a.TargetValue,
                TriggerType = a.TriggerType,
                Icon = a.ImageUrl,
            };
        }

        public async Task<AchievementDto?> CreateAsync(CreateAchievementDto achievement)
        {
            var entity = new Achievement
            {
                Name = achievement.Name,
                Description = achievement.Description,
                TargetValue = achievement.TargetValue,
                TriggerType = achievement.TriggerType,
                ImageUrl = achievement.Icon,
            };

            _context.Achievements.Add(entity);
            await _context.SaveChangesAsync();

            var response = new AchievementDto()
            {
                Id = entity.AchievementId,
                Name = entity.Name,
                Description = entity.Description,
                Icon = entity.ImageUrl,
                TargetValue = entity.TargetValue,
                TriggerType = entity.TriggerType,
            };

            return response;
        }

        public async Task<AchievementDto?> UpdateAsync(int id, UpdateAchievementDto achievement)
        {
            var existing = await _context.Achievements.FindAsync(id);
            if (existing == null)
                return null;

            existing.Name = achievement.Name;
            existing.Description = achievement.Description;
            existing.TriggerType = achievement.TriggerType;
            existing.TargetValue = achievement.TargetValue;
            existing.ImageUrl = achievement.Icon;

            await _context.SaveChangesAsync();

            var response = new AchievementDto()
            {
                Id = existing.AchievementId,
                Name = existing.Name,
                Description = existing.Description,
                Icon = existing.ImageUrl,
                TargetValue = existing.TargetValue,
                TriggerType = existing.TriggerType,
            };

            return response;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var achievement = await _context.Achievements.FindAsync(id);
            if (achievement == null)
                return false;

            _context.Achievements.Remove(achievement);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
