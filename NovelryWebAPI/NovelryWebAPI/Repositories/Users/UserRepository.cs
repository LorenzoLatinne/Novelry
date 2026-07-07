using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.User;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Repositories.Users
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserDto?> AuthenticateAsync(string email, string password)
        {
            var userEntity = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == email.ToLower()
            );

            if (userEntity == null)
                return null;

            if (!PasswordHelper.VerifyPassword(password, userEntity.PasswordHash))
                return null;

            return MapToDto(userEntity);
        }

        public async Task<UserDto?> CreateUserAsync(CreateUserDto user)
        {
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == user.Email.ToLower()))
                return null;

            var newUser = new User
            {
                Username = user.Username,
                Email = user.Email,
                CreatedAt = DateTime.UtcNow,
                PasswordHash = PasswordHelper.HashPassword(user.Password),
                ImageUrl = null,
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return MapToDto(newUser);
        }

        public async Task<bool> DeleteUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            return await _context.Users.Select(u => MapToDto(u)).ToListAsync();
        }

        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == email.ToLower()
            );
            return user != null ? MapToDto(user) : null;
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user != null ? MapToDto(user) : null;
        }

        public async Task<UserDto?> GetUserByUsernameAsync(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == username.ToLower()
            );
            return user != null ? MapToDto(user) : null;
        }

        public async Task<UserDto?> UpdateUserAsync(UpdateUserDto user)
        {
            var entity = await _context.Users.FindAsync(user.Id);
            if (entity == null)
                return null;

            if (!string.IsNullOrWhiteSpace(user.Username))
                entity.Username = user.Username;
            if (!string.IsNullOrWhiteSpace(user.Email))
                entity.Email = user.Email;
            if (!string.IsNullOrWhiteSpace(user.ImageUrl))
                entity.ImageUrl = user.ImageUrl;
            if (!string.IsNullOrWhiteSpace(user.Password))
                entity.PasswordHash = PasswordHelper.HashPassword(user.Password);

            await _context.SaveChangesAsync();
            return MapToDto(entity);
        }

        private static UserDto MapToDto(User u) =>
            new UserDto
            {
                Id = u.UserId,
                Username = u.Username,
                Email = u.Email,
                CreatedAt = u.CreatedAt,
                ImageUrl = u.ImageUrl,
            };
    }
}
