namespace NovelryMAUIApp.Services.Core
{
    public class MAUIAlertService : IAlertService
    {
        public Task<bool> ShowConfirmationAsync(
            string title,
            string message,
            string accept,
            string cancel
        )
        {
            return MainThread.InvokeOnMainThreadAsync(() =>
                Shell.Current.DisplayAlert(title, message, accept, cancel)
            );
        }

        public Task ShowMessageAsync(string title, string message, string cancel)
        {
            return MainThread.InvokeOnMainThreadAsync(() =>
                Shell.Current.DisplayAlert(title, message, cancel)
            );
        }
    }
}
