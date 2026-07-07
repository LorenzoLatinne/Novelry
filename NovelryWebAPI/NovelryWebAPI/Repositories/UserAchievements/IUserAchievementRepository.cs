using NovelryDTO.DTOs.Achievement;

namespace NovelryWebAPI.Repositories.UserAchievements
{
    public interface IUserAchievementRepository
    {
        Task<List<UserAchievementDto>> GetUserAchievementsByUserIdAsync(int userId);
        Task<List<UserAchievementDto>> GetUserAchievementsByUsernameAsync(string username);
        Task<UserAchievementDto?> GrantAchievementAsync(CreateUserAchievementDto dto);
    }
}
