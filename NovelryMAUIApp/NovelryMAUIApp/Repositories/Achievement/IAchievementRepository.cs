using NovelryDTO.DTOs.Achievement;

namespace NovelryMAUIApp.Repositories.Achievement
{
    public interface IAchievementRepository
    {
        // Create
        Task<AchievementDto?> CreateAchievementAsync(AchievementDto achievement);

        // Read
        Task<List<AchievementDto>> GetAllAchievementsAsync();
        Task<AchievementDto?> GetAchievementByIdAsync(int id);
        Task<AchievementDto?> GetAchievementByNameAsync(string name);

        // Update
        Task<AchievementDto?> UpdateAchievementAsync(AchievementDto? achievement);

        // Delete
        Task<bool> DeleteAchievementByIdAsync(int id);
    }
}
