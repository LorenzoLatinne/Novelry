using NovelryDTO.DTOs.Achievement;
using NovelryMAUIApp.Repositories.Achievement;

namespace NovelryMAUIApp.Repositories.Mock
{
    public class MockAchievementRepository : IAchievementRepository
    {
        private readonly List<AchievementDto> _achievements = new()
        {
            new AchievementDto
            {
                Id = 1,
                Name = "First Book",
                Description = "Read your first book",
                Icon = new MauiIcon { Icon = FontAwesomeSolidIcons.Trophy }.ToString(),
            },
            new AchievementDto
            {
                Id = 2,
                Name = "Bookworm",
                Description = "Read 10 books",
                Icon = new MauiIcon { Icon = FontAwesomeSolidIcons.School }.ToString(),
            },
        };

        public Task<AchievementDto?> CreateAchievementAsync(AchievementDto achievement)
        {
            achievement.Id = _achievements.Any() ? _achievements.Max(a => a.Id) + 1 : 1;
            _achievements.Add(achievement);
            return Task.FromResult(achievement == null ? null : achievement);
        }

        public Task<bool> DeleteAchievementByIdAsync(int id)
        {
            var achievement = _achievements.FirstOrDefault(a => a.Id == id);
            if (achievement == null)
                return Task.FromResult(false);

            _achievements.Remove(achievement);
            return Task.FromResult(true);
        }

        public Task<AchievementDto?> GetAchievementByIdAsync(int id)
        {
            var achievement = _achievements.FirstOrDefault(a => a.Id == id);
            return Task.FromResult(achievement);
        }

        public Task<AchievementDto?> GetAchievementByNameAsync(string name)
        {
            var achievement = _achievements.FirstOrDefault(a => a.Name == name);
            return Task.FromResult(achievement);
        }

        public Task<List<AchievementDto>> GetAllAchievementsAsync()
        {
            return Task.FromResult(_achievements);
        }

        public Task<AchievementDto?> UpdateAchievementAsync(AchievementDto? achievement)
        {
            if (achievement == null)
                return Task.FromResult<AchievementDto?>(null);

            var existing = _achievements.FirstOrDefault(a => a.Id == achievement.Id);
            if (existing == null)
                return Task.FromResult<AchievementDto?>(null);

            if (!string.IsNullOrWhiteSpace(achievement.Name))
                existing.Name = achievement.Name;

            if (!string.IsNullOrWhiteSpace(achievement.Description))
                existing.Description = achievement.Description;

            if (!string.IsNullOrWhiteSpace(achievement.Icon?.ToString()))
                existing.Icon = achievement.Icon;

            return Task.FromResult<AchievementDto?>(existing);
        }
    }
}
