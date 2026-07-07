using NovelryDTO.DTOs.User;

namespace NovelryMAUIApp.Services.Interfaces
{
    public interface IUserSessionService
    {
        UserDto? CurrentUser { get; set; }
    }
}
