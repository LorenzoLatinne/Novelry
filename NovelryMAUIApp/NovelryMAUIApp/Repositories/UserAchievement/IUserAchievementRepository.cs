using NovelryDTO.DTOs.Achievement;

namespace NovelryMAUIApp.Repositories.UserAchievement
{
    public interface IUserAchievementRepository
    {
        Task<List<UserAchievementDto>> GetUserAchievementsByIdAsync(int id);
        Task<List<UserAchievementDto>> GetUserAchievementsByUsernameAsync(string username);

        Task<UserAchievementDto?> GrantAchievementAsync(int userId, int achievementId);
    }
}
