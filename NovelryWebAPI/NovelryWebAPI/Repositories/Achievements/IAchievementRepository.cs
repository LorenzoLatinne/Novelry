using NovelryDTO.DTOs.Achievement;

namespace NovelryWebAPI.Repositories.Achievements
{
    public interface IAchievementRepository
    {
        Task<List<AchievementDto>> GetAllAsync();
        Task<AchievementDto?> GetByIdAsync(int id);
        Task<AchievementDto?> GetByNameAsync(string name);
        Task<AchievementDto?> CreateAsync(CreateAchievementDto achievement);
        Task<AchievementDto?> UpdateAsync(int id, UpdateAchievementDto achievement);
        Task<bool> DeleteAsync(int id);
    }
}
