using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Book;

namespace NovelryMAUIApp.Repositories.Review
{
    public class ApiReviewRepository : IReviewRepository
    {
        private readonly HttpClient _client;

        public ApiReviewRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<ReviewDto?> CreateReviewAsync(
            CreateReviewDto review,
            int userId,
            string username
        )
        {
            var response = await _client.PostAsJsonAsync($"/reviews/{userId}", review);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<ReviewDto>();
        }

        public async Task<bool> DeleteReviewByIdAsync(int id)
        {
            var response = await _client.DeleteAsync($"/reviews/{id}");
            return response.IsSuccessStatusCode;
        }

        public async Task<List<ReviewDto>> GetAllReviewsAsync()
        {
            return await _client.GetFromJsonAsync<List<ReviewDto>>("/reviews")
                ?? new List<ReviewDto>();
        }

        public async Task<List<ReviewDto>> GetAllReviewsForBookAsync(int bookId)
        {
            return await _client.GetFromJsonAsync<List<ReviewDto>>($"/reviews/book/{bookId}")
                ?? new List<ReviewDto>();
        }

        public async Task<List<ReviewDto>> GetAllReviewsByUsernameAsync(string username)
        {
            var reviews = await GetAllReviewsAsync();
            return reviews
                .Where(r => r.Username.Equals(username, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        public async Task<List<ReviewDto>> GetAllReviewsByUserIdAsync(int userId)
        {
            return await _client.GetFromJsonAsync<List<ReviewDto>>($"/reviews/user/{userId}")
                ?? new List<ReviewDto>();
        }

        public async Task<ReviewDto?> GetReviewByIdAsync(int id)
        {
            return await _client.GetFromJsonAsync<ReviewDto>($"/reviews/{id}");
        }

        public async Task<List<ReviewDto>> GetLastFiveReviews()
        {
            return await _client.GetFromJsonAsync<List<ReviewDto>>("/reviews/lastfive")
                ?? new List<ReviewDto>();
        }

        public async Task<ReviewDto?> UpdateReviewAsync(UpdateReviewDto review)
        {
            var response = await _client.PutAsJsonAsync($"/reviews/{review.Id}", review);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<ReviewDto>();
        }

        public async Task<List<ReviewDto>> GetLastTwentyReviewsAsync()
        {
            return await _client.GetFromJsonAsync<List<ReviewDto>>("/reviews/lasttwenty")
                ?? new List<ReviewDto>();
        }
    }
}
