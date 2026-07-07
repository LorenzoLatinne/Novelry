using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Author;

namespace NovelryMAUIApp.Repositories.Author
{
    public class ApiAuthorRepository : IAuthorRepository
    {
        private readonly HttpClient _client;

        public ApiAuthorRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<AuthorDto?> CreateAuthorAsync(CreateAuthorDto author)
        {
            var response = await _client.PostAsJsonAsync("/authors", author);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<AuthorDto>();
        }

        public async Task<bool> DeleteAuthorByIdAsync(int id)
        {
            var response = await _client.DeleteAsync($"/authors/{id}");
            return response.IsSuccessStatusCode;
        }

        public async Task<List<AuthorDto>> GetAllAuthorsAsync()
        {
            return await _client.GetFromJsonAsync<List<AuthorDto>>("/authors")
                ?? new List<AuthorDto>();
        }

        public async Task<AuthorDto?> GetAuthorByIdAsync(int id)
        {
            return await _client.GetFromJsonAsync<AuthorDto>($"/authors/{id}");
        }

        public async Task<AuthorDto?> GetAuthorByNameAsync(string name)
        {
            return await _client.GetFromJsonAsync<AuthorDto>(
                $"/authors/name/{Uri.EscapeDataString(name)}"
            );
        }

        public async Task<AuthorDto?> UpdateAuthorAsync(UpdateAuthorDto? author)
        {
            if (author == null)
                return null;

            var response = await _client.PutAsJsonAsync($"/authors/{author.Id}", author);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<AuthorDto>();
        }
    }
}
