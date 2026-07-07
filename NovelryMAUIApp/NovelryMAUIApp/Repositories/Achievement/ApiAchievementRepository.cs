using System.Net.Http.Json;
using NovelryDTO.DTOs.Achievement;

namespace NovelryMAUIApp.Repositories.Achievement
{
    public class ApiAchievementRepository : IAchievementRepository
    {
        private readonly HttpClient _client;

        public ApiAchievementRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<AchievementDto?> CreateAchievementAsync(AchievementDto achievement)
        {
            var response = await _client.PostAsJsonAsync("/achievements", achievement);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<AchievementDto>();
        }

        public async Task<bool> DeleteAchievementByIdAsync(int id)
        {
            var response = await _client.DeleteAsync($"/achievements/{id}");
            return response.IsSuccessStatusCode;
        }

        public async Task<List<AchievementDto>> GetAllAchievementsAsync()
        {
            return await _client.GetFromJsonAsync<List<AchievementDto>>("/achievements")
                ?? new List<AchievementDto>();
        }

        public async Task<AchievementDto?> GetAchievementByIdAsync(int id)
        {
            return await _client.GetFromJsonAsync<AchievementDto>($"/achievements/{id}");
        }

        public async Task<AchievementDto?> GetAchievementByNameAsync(string name)
        {
            return await _client.GetFromJsonAsync<AchievementDto>(
                $"/achievements/name/{Uri.EscapeDataString(name)}"
            );
        }

        public async Task<AchievementDto?> UpdateAchievementAsync(AchievementDto? achievement)
        {
            if (achievement == null)
                return null;

            var response = await _client.PutAsJsonAsync(
                $"/achievements/{achievement.Id}",
                achievement
            );
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<AchievementDto>();
        }
    }
}
