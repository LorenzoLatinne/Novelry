using NovelryDTO.DTOs.UserBook;

namespace NovelryWebAPI.Repositories.UserBooks
{
    public interface IUserBookRepository
    {
        // Create
        Task<UserBookDto?> CreateUserBookAsync(CreateUserBookDto userBook);

        // Read
        Task<UserBookDto?> GetUserBookByIdAsync(int id);
        Task<UserBookDto?> GetUserBookByUserIdAndBookIdAsync(int userId, int bookId);
        Task<List<UserBookDto>> GetAllUserBooksByUserIdAsync(int userId);
        Task<List<UserBookDto>> GetAllUserBooksByUsernameAsync(string username);

        // Update
        Task<UserBookDto?> UpdateUserBookAsync(UpdateUserBookDto userBook);

        // Delete
        Task<bool> DeleteUserBookByIdAsync(int id);
    }
}
