namespace NovelryMAUIApp.Services.Interfaces
{
    public interface INavigationService
    {
        Task GoBackAsync();
        Task NavigateToAsync(string route, IDictionary<string, object>? parameters = null);
        Task GoToModalAsync(Page page);
        Task PopModalAsync();
    }
}
