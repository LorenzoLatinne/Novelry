using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Genre;

namespace NovelryMAUIApp.Repositories.Genre
{
    public class ApiGenreRepository : IGenreRepository
    {
        private readonly HttpClient _client;

        public ApiGenreRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<GenreDto?> CreateGenreAsync(CreateGenreDto genre)
        {
            var response = await _client.PostAsJsonAsync("/genres", genre);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<GenreDto>();
        }

        public async Task<bool> DeleteGenreById(int id)
        {
            var response = await _client.DeleteAsync($"/genres/{id}");
            return response.IsSuccessStatusCode;
        }

        public async Task<List<GenreDto>> GetAllGenresAsync()
        {
            return await _client.GetFromJsonAsync<List<GenreDto>>("/genres")
                ?? new List<GenreDto>();
        }

        public async Task<GenreDto?> GetGenreByIdAsync(int id)
        {
            return await _client.GetFromJsonAsync<GenreDto>($"/genres/{id}");
        }

        public async Task<GenreDto?> GetGenreByNameAsync(string name)
        {
            return await _client.GetFromJsonAsync<GenreDto>(
                $"/genres/name/{Uri.EscapeDataString(name)}"
            );
        }

        public async Task<GenreDto?> UpdateGenreAsync(UpdateGenreDto genre)
        {
            var response = await _client.PutAsJsonAsync($"/genres/{genre.Id}", genre);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<GenreDto>();
        }
    }
}
