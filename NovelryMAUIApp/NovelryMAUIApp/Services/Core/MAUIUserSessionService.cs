using NovelryDTO.DTOs.User;

namespace NovelryMAUIApp.Services.Core
{
    public class MAUIUserSessionService : IUserSessionService
    {
        public UserDto? CurrentUser { get; set; }
    }
}
