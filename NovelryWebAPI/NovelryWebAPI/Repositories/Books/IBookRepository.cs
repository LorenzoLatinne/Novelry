using NovelryDTO.DTOs.Book;

namespace NovelryWebAPI.Repositories.Books
{
    public interface IBookRepository
    {
        // Create
        Task<BookDto?> CreateBookAsync(CreateBookDto book);

        // Read
        Task<List<BookDto>> GetAllBooksAsync();
        Task<BookDto?> GetBookByISBNAsync(string isbn);
        Task<List<BookDto>> GetBooksByAuthorAsync(string authorName);
        Task<List<BookDto>> GetBooksByGenreAsync(string genreName);
        Task<BookDto?> GetBookByIdAsync(int id);
        Task<BookDto?> GetBookByTitleAsync(string title);
        Task<List<BookWithReviewDto>> SearchBooksAsync(string query, int limit = 30);

        Task<List<BookWithReviewDto>> GetAllBooksWithReviewsAsync();

        Task<List<BookWithReviewDto>> GetLatestBooksWithReviewsAsync(int count = 5);

        // Update
        Task<BookDto?> UpdateBookAsync(UpdateBookDto book);

        // Delete
        Task<bool> DeleteBookByIdAsync(int id);
    }
}
