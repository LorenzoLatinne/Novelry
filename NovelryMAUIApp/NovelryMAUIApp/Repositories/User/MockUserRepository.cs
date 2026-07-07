using NovelryDTO.DTOs.User;
using NovelryMAUIApp.Helpers;

namespace NovelryMAUIApp.Repositories.User
{
    public class MockUserRepository : IUserRepository
    {
        private readonly List<(UserDto User, string Password)> _users = new()
        {
            (
                new UserDto()
                {
                    Id = 1,
                    Username = "John",
                    Email = "John@example.com",
                    CreatedAt = DateTime.UtcNow - TimeSpan.FromDays(20),
                    ImageUrl = "johndoe",
                },
                "password"
            ),
            (
                new UserDto()
                {
                    Id = 2,
                    Username = "Jane",
                    Email = "Jane@example.com",
                    CreatedAt = DateTime.UtcNow - TimeSpan.FromDays(25),
                    ImageUrl = "janesmith",
                },
                "password"
            ),
            (
                new UserDto()
                {
                    Id = 3,
                    Username = "Lorenzo",
                    Email = "Lorenzo@example.com",
                    CreatedAt = DateTime.UtcNow,
                    ImageUrl = null,
                },
                "password"
            ),
        };

        public Task<UserDto?> CreateUserAsync(CreateUserDto user)
        {
            UserDto newUser = new()
            {
                Id = _users.Any() ? _users.Max(u => u.User.Id) + 1 : 1,
                Username = user.Username,
                Email = user.Email,
                CreatedAt = DateTime.UtcNow,
                ImageUrl = null,
            };

            string password = PasswordHelper.HashPassword(user.Password);

            _users.Add((newUser, password));
            return Task.FromResult(newUser ?? null);
        }

        public Task<bool> DeleteUserByIdAsync(int id)
        {
            var user = _users.FirstOrDefault(u => u.User.Id == id);
            if (user.User == null)
                return Task.FromResult(false);

            _users.Remove(user);
            return Task.FromResult(true);
        }

        public Task<List<UserDto>> GetAllUsersAsync()
        {
            return Task.FromResult(_users.Select(u => u.User).ToList());
        }

        public Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = _users.FirstOrDefault(u => u.User.Id == id).User;
            if (user == null)
                return Task.FromResult<UserDto?>(null);

            return Task.FromResult(user ?? null);
        }

        public Task<UserDto?> GetUserByUsernameAsync(string username)
        {
            var user = _users.FirstOrDefault(u => u.User.Username == username);
            return Task.FromResult(user.User ?? null);
        }

        public Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var user = _users.FirstOrDefault(u =>
                u.User.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
            );
            return Task.FromResult(user.User ?? null);
        }

        public Task<UserDto?> UpdateUserAsync(UpdateUserDto user)
        {
            var index = _users.FindIndex(u => u.User.Id == user.Id);
            if (index < 0)
                return Task.FromResult<UserDto?>(null);

            var (userRecord, passwordHash) = _users[index];

            if (!string.IsNullOrWhiteSpace(user.Username))
                userRecord.Username = user.Username;

            if (!string.IsNullOrWhiteSpace(user.Email))
                userRecord.Email = user.Email;

            if (!string.IsNullOrWhiteSpace(user.ImageUrl))
                userRecord.ImageUrl = user.ImageUrl;

            if (!string.IsNullOrWhiteSpace(user.Password))
                //TODO: hash
                passwordHash = user.Password;

            _users[index] = (userRecord, passwordHash);

            return Task.FromResult(userRecord ?? null);
        }

        public Task<UserDto?> AuthenticateAsync(string email, string password)
        {
            var entry = _users.FirstOrDefault(u =>
                u.User.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
                && password == u.Password
            );

            return Task.FromResult(entry.User != null ? entry.User : null);
        }
    }
}
