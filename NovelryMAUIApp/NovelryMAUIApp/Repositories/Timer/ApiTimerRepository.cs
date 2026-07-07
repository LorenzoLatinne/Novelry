using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Timer;

namespace NovelryMAUIApp.Repositories.Timer
{
    public class ApiTimerRepository : ITimerRepository
    {
        private readonly HttpClient _client;

        public ApiTimerRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<TimerDto?> CreateTimerAsync(CreateTimerDto timer)
        {
            var response = await _client.PostAsJsonAsync("api/timers", timer);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<TimerDto>();
        }

        public async Task<bool> DeleteTimerByIdAsync(int id)
        {
            var response = await _client.DeleteAsync($"api/timers/{id}");
            return response.IsSuccessStatusCode;
        }

        public async Task<List<TimerDto>> GetAllTimersAsync()
        {
            return await _client.GetFromJsonAsync<List<TimerDto>>("api/timers") ?? new();
        }

        public async Task<List<TimerDto>> GetAllTimersByBookAsync(string bookTitle)
        {
            return await _client.GetFromJsonAsync<List<TimerDto>>($"api/timers/book/{bookTitle}")
                ?? new();
        }

        public async Task<List<TimerDto>> GetAllTimersByUserIdAndBookIdAsync(int userId, int bookId)
        {
            // API endpoint doesn't exist for combined filters, filter client-side
            var allUserTimers = await GetAllTimersByUserIdAsync(userId);
            return allUserTimers.Where(t => t.BookId == bookId).ToList();
        }

        public async Task<List<TimerDto>> GetAllTimersByUserIdAsync(int userId)
        {
            return await _client.GetFromJsonAsync<List<TimerDto>>($"api/timers/user/{userId}")
                ?? new();
        }

        public async Task<List<TimerDto>> GetAllTimersByUsernameAsync(string username)
        {
            return await _client.GetFromJsonAsync<List<TimerDto>>($"api/timers/username/{username}")
                ?? new();
        }

        public async Task<TimerDto?> GetTimerByIdAsync(int id)
        {
            return await _client.GetFromJsonAsync<TimerDto>($"api/timers/{id}");
        }

        public async Task<TimerDto?> UpdateTimerAsync(UpdateTimerDto timer)
        {
            var response = await _client.PutAsJsonAsync("api/timers", timer);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<TimerDto>();
        }
    }
}
