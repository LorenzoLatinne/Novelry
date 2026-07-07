namespace NovelryMAUIApp.Services.Core
{
    public class MAUINavigationService : INavigationService
    {
        public async Task GoBackAsync()
        {
            var nav = Shell.Current.Navigation;

            if (nav.ModalStack.Count > 0)
            {
                await nav.PopModalAsync();
            }
            else if (nav.NavigationStack.Count > 1)
            {
                await nav.PopAsync();
            }
            else
            {
                await Shell.Current.GoToAsync("//Main");
            }
        }

        public async Task NavigateToAsync(
            string route,
            IDictionary<string, object>? parameters = null
        )
        {
            if (parameters is not null)
                await Shell.Current.GoToAsync(route, parameters);
            else
                await Shell.Current.GoToAsync(route);
        }

        public async Task GoToModalAsync(Page page)
        {
            await Shell.Current.Navigation.PushModalAsync(page, true);
        }

        public async Task PopModalAsync()
        {
            var nav = Shell.Current.Navigation;
            if (nav.ModalStack.Count > 0)
                await nav.PopModalAsync(true);
        }
    }
}
