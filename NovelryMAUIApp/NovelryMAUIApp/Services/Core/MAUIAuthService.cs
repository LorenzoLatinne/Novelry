using NovelryDTO.DTOs.User;
using NovelryMAUIApp.Repositories.User;

namespace NovelryMAUIApp.Services.Core
{
    public class MAUIAuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserSessionService _userSessionService;

        public MAUIAuthService(
            IUserRepository userRepository,
            IUserSessionService userSessionService
        )
        {
            _userRepository = userRepository;
            _userSessionService = userSessionService;
        }

        public async Task<bool> RegisterAsync(string username, string email, string password)
        {
            try
            {
                await _userRepository.CreateUserAsync(
                    new CreateUserDto()
                    {
                        Username = username,
                        Email = email,
                        Password = password,
                    }
                );
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return false;
            }
        }

        public async Task<bool> LoginAsync(string email, string password)
        {
            var response = await _userRepository.AuthenticateAsync(email, password);
            return response != null;
        }

        public Task LogoutAsync()
        {
            _userSessionService.CurrentUser = null;
            return Task.CompletedTask;
        }
    }
}
