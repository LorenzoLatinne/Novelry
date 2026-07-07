namespace NovelryMAUIApp.Services.Interfaces
{
    public interface IAlertService
    {
        Task<bool> ShowConfirmationAsync(
            string title,
            string message,
            string accept,
            string cancel
        );
        Task ShowMessageAsync(string title, string message, string cancel);
    }
}
