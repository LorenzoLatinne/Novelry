namespace NovelryMAUIApp.Services.Interfaces
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(string username, string email, string password);
        Task<bool> LoginAsync(string email, string password);
        Task LogoutAsync();
    }
}
