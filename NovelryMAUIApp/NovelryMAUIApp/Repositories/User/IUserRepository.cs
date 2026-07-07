using NovelryDTO.DTOs.User;

namespace NovelryMAUIApp.Repositories.User
{
    public interface IUserRepository
    {
        Task<UserDto?> AuthenticateAsync(string email, string password);
        Task<bool> DeleteUserByIdAsync(int id);
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto?> CreateUserAsync(CreateUserDto user);
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserDto?> GetUserByUsernameAsync(string username);
        Task<UserDto?> UpdateUserAsync(UpdateUserDto user);
    }
}
