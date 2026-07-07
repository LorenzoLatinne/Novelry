using NovelryDTO.DTOs.Achievement;
using NovelryMAUIApp.Repositories.Achievement;
using NovelryMAUIApp.Repositories.User;

namespace NovelryMAUIApp.Repositories.UserAchievement
{
    public class MockUserAchievementRepository : IUserAchievementRepository
    {
        private readonly IUserRepository _userRepository;
        private readonly IAchievementRepository _achievementRepository;

        private readonly List<UserAchievementDto> _userAchievements = new()
        {
            new()
            {
                Id = 1,
                AchievementId = 1,
                UserId = 1,
                AchievedAt = DateTime.Now,
            },
            new()
            {
                Id = 2,
                AchievementId = 2,
                UserId = 2,
                AchievedAt = DateTime.Now,
            },
        };

        public MockUserAchievementRepository(
            IUserRepository userRepository,
            IAchievementRepository achievementRepository
        )
        {
            _userRepository = userRepository;
            _achievementRepository = achievementRepository;
        }

        public Task<List<UserAchievementDto>> GetUserAchievementsByIdAsync(int id)
        {
            return Task.FromResult(_userAchievements.Where(ua => ua.Id == id).ToList());
        }

        public async Task<List<UserAchievementDto>> GetUserAchievementsByUsernameAsync(
            string username
        )
        {
            var user = await _userRepository.GetUserByUsernameAsync(username);
            if (user == null)
                return new();

            return _userAchievements.Where(ua => ua.UserId == user.Id).ToList();
        }

        public async Task<UserAchievementDto?> GrantAchievementAsync(int userId, int achievementId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            var achievement = await _achievementRepository.GetAchievementByIdAsync(achievementId);

            if (user == null || achievement == null)
                return null;

            var userAchievement = new UserAchievementDto()
            {
                Id = _userAchievements.Any() ? _userAchievements.Max(ua => ua.Id) + 1 : 1,
                AchievementId = achievementId,
                UserId = userId,
                AchievedAt = DateTime.UtcNow,
            };

            _userAchievements.Add(userAchievement);

            return userAchievement;
        }
    }
}
