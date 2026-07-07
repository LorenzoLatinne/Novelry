using NovelryMAUIApp.Repositories.Achievement;
using NovelryMAUIApp.Repositories.Author;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Genre;
using NovelryMAUIApp.Repositories.Mock;
using NovelryMAUIApp.Repositories.Review;
using NovelryMAUIApp.Repositories.Timer;
using NovelryMAUIApp.Repositories.User;
using NovelryMAUIApp.Repositories.UserAchievement;
using NovelryMAUIApp.Repositories.UserBook;

namespace NovelryMAUIApp.Extensions
{
    public static class DIExtensions
    {
        public static void AddRepositories(this IServiceCollection Services)
        {
            Services.AddSingleton<IAuthorRepository, ApiAuthorRepository>();
            Services.AddSingleton<IGenreRepository, ApiGenreRepository>();
            Services.AddSingleton<IAchievementRepository, ApiAchievementRepository>();
            Services.AddSingleton<IBookRepository, ApiBookRepository>();
            Services.AddSingleton<IUserRepository, ApiUserRepository>();
            Services.AddSingleton<IUserBookRepository, ApiUserBookRepository>();
            Services.AddSingleton<IUserAchievementRepository, ApiUserAchievementRepository>();
            Services.AddSingleton<ITimerRepository, ApiTimerRepository>();
            Services.AddSingleton<IReviewRepository, ApiReviewRepository>();
        }

        public static void AddAppServices(this IServiceCollection Services)
        {
            // Core app-level services
            Services.AddSingleton<INavigationService, MAUINavigationService>();
            Services.AddSingleton<IUserSessionService, MAUIUserSessionService>();
            Services.AddSingleton<IAlertService, MAUIAlertService>();
            Services.AddSingleton<IScanService, MAUIScanService>();

            // HttpClient
            Services.AddScoped(sp => new HttpClient()
            {
                BaseAddress = new Uri("https://hmzwgb51-7299.euw.devtunnels.ms/"),
            });

            // Authentication & user session
            Services.AddSingleton<IAuthService, MAUIAuthService>();
        }

        public static void AddViewModels(this IServiceCollection Services)
        {
            Services.AddTransient<AchievementViewModel>();
            Services.AddTransient<BookInfoViewModel>();
            Services.AddTransient<DashboardPageViewModel>();
            Services.AddTransient<ExplorePageViewModel>();
            Services.AddTransient<FilteredBooksViewModel>();
            Services.AddTransient<LibraryViewModel>();
            Services.AddTransient<LoginViewModel>();
            Services.AddTransient<ProfileViewModel>();
            Services.AddTransient<ReviewsPageViewModel>();
            Services.AddTransient<ScanPageViewModel>();
            Services.AddTransient<SettingsViewModel>();
            Services.AddTransient<SignUpViewModel>();
            Services.AddTransient<UserBookDetailViewModel>();
            Services.AddTransient<WelcomePageViewModel>();
            Services.AddTransient<WriteReviewViewModel>();
        }

        public static void AddPages(this IServiceCollection Services)
        {
            Services.AddTransient<ExplorePage>();
            Services.AddTransient<AchievementPage>();
            Services.AddTransient<BookInfoPage>();
            Services.AddTransient<DashboardPage>();
            Services.AddTransient<FilteredBooksPage>();
            Services.AddTransient<LibraryPage>();
            Services.AddTransient<LoginPage>();
            Services.AddTransient<ProfilePage>();
            Services.AddTransient<ReviewsPage>();
            Services.AddTransient<ScanPage>();
            Services.AddTransient<SignupPage>();
            Services.AddTransient<UserBookDetailPage>();
            Services.AddTransient<WelcomePage>();
            Services.AddTransient<WriteReviewPage>();
        }
    }
}
