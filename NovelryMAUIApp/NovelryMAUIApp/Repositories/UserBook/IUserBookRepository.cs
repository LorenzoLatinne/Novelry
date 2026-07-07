using NovelryDTO.DTOs.UserBook;

namespace NovelryMAUIApp.Repositories.UserBook
{
    public interface IUserBookRepository
    {
        // Create
        Task<UserBookDto?> CreateUserBookAsync(CreateUserBookDto userBook);

        // Read
        Task<UserBookDto?> GetUserBookById(int id);
        Task<List<UserBookDto>> GetAllUserBooksByUserIdAsync(int userId);
        Task<List<UserBookDto>> GetAllUserBooksByUsernameAsync(string username);

        Task<UserBookDto?> GetUserBookByUserIdAndBookId(int userId, int bookId);

        // Update
        Task<UserBookDto?> UpdateUserBookAsync(UpdateUserBookDto userBook);

        // Delete
        Task<bool> DeleteUserBookByIdAsync(int id);
    }
}
