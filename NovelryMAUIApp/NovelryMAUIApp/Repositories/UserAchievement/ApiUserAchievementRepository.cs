using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Achievement;

namespace NovelryMAUIApp.Repositories.UserAchievement
{
    public class ApiUserAchievementRepository : IUserAchievementRepository
    {
        private readonly HttpClient _client;

        public ApiUserAchievementRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<List<UserAchievementDto>> GetUserAchievementsByIdAsync(int id)
        {
            var response = await _client.GetFromJsonAsync<List<UserAchievementDto>>(
                $"api/UserAchievements/user/{id}"
            );
            return response ?? new List<UserAchievementDto>();
        }

        public async Task<List<UserAchievementDto>> GetUserAchievementsByUsernameAsync(
            string username
        )
        {
            var response = await _client.GetFromJsonAsync<List<UserAchievementDto>>(
                $"api/UserAchievements/username/{username}"
            );
            return response ?? new List<UserAchievementDto>();
        }

        public async Task<UserAchievementDto?> GrantAchievementAsync(int userId, int achievementId)
        {
            var dto = new CreateUserAchievementDto
            {
                UserId = userId,
                AchievementId = achievementId,
            };
            var response = await _client.PostAsJsonAsync("api/UserAchievements", dto);

            if (!response.IsSuccessStatusCode)
                return null;

            var result = await response.Content.ReadFromJsonAsync<UserAchievementDto>();
            return result;
        }
    }
}
