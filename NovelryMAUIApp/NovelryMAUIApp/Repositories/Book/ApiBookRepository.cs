using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Book;

namespace NovelryMAUIApp.Repositories.Book
{
    public class ApiBookRepository : IBookRepository
    {
        private readonly HttpClient _client;

        public ApiBookRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<BookDto?> CreateBookAsync(CreateBookDto book)
        {
            var response = await _client.PostAsJsonAsync("/books", book);
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<BookDto>();
        }

        public async Task<List<BookWithReviewDto>> SearchBooksAsync(string query)
        {
            Debug.WriteLine($"Calling: books/search?query={Uri.EscapeDataString(query)}");

            if (string.IsNullOrWhiteSpace(query))
                return new List<BookWithReviewDto>();

            var response = await _client.GetAsync(
                $"books/search?query={Uri.EscapeDataString(query)}"
            );
            if (!response.IsSuccessStatusCode)
                return new List<BookWithReviewDto>();

            var books = await response.Content.ReadFromJsonAsync<List<BookWithReviewDto>>();
            return books ?? new List<BookWithReviewDto>();
        }

        public async Task<bool> DeleteBookByIdAsync(int id)
        {
            var response = await _client.DeleteAsync($"/books/{id}");
            return response.IsSuccessStatusCode;
        }

        public async Task<List<BookDto>> GetAllBooksAsync()
        {
            var books = await _client.GetFromJsonAsync<List<BookDto>>("/books");
            return books ?? new List<BookDto>();
        }

        public async Task<BookDto?> GetBookByIdAsync(int id)
        {
            var response = await _client.GetAsync($"/books/{id}");
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<BookDto>();
        }

        public async Task<BookDto?> GetBookByISBNAsync(string isbn)
        {
            var response = await _client.GetAsync($"/books/isbn/{isbn}");
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<BookDto>();
        }

        public async Task<BookDto?> GetBookByTitleAsync(string title)
        {
            var response = await _client.GetAsync($"/books/title/{title}");
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<BookDto>();
        }

        public async Task<List<BookDto>> GetBooksByAuthorAsync(string authorName)
        {
            var books = await _client.GetFromJsonAsync<List<BookDto>>(
                $"/books/author/{authorName}"
            );
            return books ?? new List<BookDto>();
        }

        public async Task<List<BookDto>> GetBooksByGenreAsync(string genreName)
        {
            var books = await _client.GetFromJsonAsync<List<BookDto>>($"/books/genre/{genreName}");
            return books ?? new List<BookDto>();
        }

        public Task<BookDto?> UpdateBookAsync(UpdateBookDto book)
        {
            return _client
                .PutAsJsonAsync($"/books/{book.Id}", book)
                .ContinueWith(t =>
                {
                    if (!t.Result.IsSuccessStatusCode)
                        return null;
                    return t.Result.Content.ReadFromJsonAsync<BookDto>().Result;
                });
        }

        public async Task<List<BookWithReviewDto>> GetLatestBooksWithReviewsAsync()
        {
            var result = await _client.GetFromJsonAsync<List<BookWithReviewDto>>(
                "/books/latest-reviews"
            );
            return result ?? new List<BookWithReviewDto>();
        }

        public async Task<List<BookWithReviewDto>> GetAllBooksWithReviewsAsync()
        {
            var result = await _client.GetFromJsonAsync<List<BookWithReviewDto>>(
                "/books/all-with-reviews"
            );
            return result ?? new List<BookWithReviewDto>();
        }
    }
}
