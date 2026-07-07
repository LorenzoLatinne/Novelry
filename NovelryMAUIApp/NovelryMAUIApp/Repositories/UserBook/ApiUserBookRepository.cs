using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using NovelryDTO.DTOs.UserBook;

namespace NovelryMAUIApp.Repositories.UserBook
{
    public class ApiUserBookRepository : IUserBookRepository
    {
        private readonly HttpClient _client;

        public ApiUserBookRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<UserBookDto?> CreateUserBookAsync(CreateUserBookDto userBook)
        {
            var response = await _client.PostAsJsonAsync("/userbooks", userBook);

            if (!response.IsSuccessStatusCode)
                return null;

            if (response.Content.Headers.ContentLength == 0)
                return null;

            return await response.Content.ReadFromJsonAsync<UserBookDto>();
        }

        public async Task<bool> DeleteUserBookByIdAsync(int id)
        {
            var response = await _client.DeleteAsync($"/userbooks/{id}");
            return response.IsSuccessStatusCode;
        }

        public async Task<List<UserBookDto>> GetAllUserBooksByUserIdAsync(int userId)
        {
            return await _client.GetFromJsonAsync<List<UserBookDto>>($"/userbooks/user/{userId}")
                ?? new List<UserBookDto>();
        }

        public async Task<List<UserBookDto>> GetAllUserBooksByUsernameAsync(string username)
        {
            return await _client.GetFromJsonAsync<List<UserBookDto>>(
                    $"/userbooks/username/{username}"
                ) ?? new List<UserBookDto>();
        }

        public async Task<UserBookDto?> GetUserBookById(int id)
        {
            return await _client.GetFromJsonAsync<UserBookDto>($"/userbooks/{id}");
        }

        public async Task<UserBookDto?> GetUserBookByUserIdAndBookId(int userId, int bookId)
        {
            var response = await _client.GetAsync($"/userbooks/user/{userId}/book/{bookId}");

            if (!response.IsSuccessStatusCode)
                return null;

            if (response.Content.Headers.ContentLength == 0)
                return null;

            await using var stream = await response.Content.ReadAsStreamAsync();
            if (stream == null || stream.Length == 0)
                return null;

            return await JsonSerializer.DeserializeAsync<UserBookDto>(
                stream,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
        }

        public async Task<UserBookDto?> UpdateUserBookAsync(UpdateUserBookDto userBook)
        {
            var response = await _client.PutAsJsonAsync($"/userbooks/{userBook.Id}", userBook);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<UserBookDto>();
        }
    }
}
