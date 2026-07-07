using NovelryDTO.DTOs.Book;

namespace NovelryMAUIApp.Repositories.Book
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
        Task<List<BookWithReviewDto>> GetLatestBooksWithReviewsAsync();
        Task<List<BookWithReviewDto>> GetAllBooksWithReviewsAsync();
        Task<List<BookWithReviewDto>> SearchBooksAsync(string query);

        // Update
        Task<BookDto?> UpdateBookAsync(UpdateBookDto book);

        // Delete
        Task<bool> DeleteBookByIdAsync(int id);
    }
}
