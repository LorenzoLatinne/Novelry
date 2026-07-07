using NovelryWebAPI.Repositories.Achievements;
using NovelryWebAPI.Repositories.Authors;
using NovelryWebAPI.Repositories.Books;
using NovelryWebAPI.Repositories.Genres;
using NovelryWebAPI.Repositories.Reviews;
using NovelryWebAPI.Repositories.Timers;
using NovelryWebAPI.Repositories.UserAchievements;
using NovelryWebAPI.Repositories.UserBooks;
using NovelryWebAPI.Repositories.Users;

namespace NovelryWebAPI.Extensions
{
    public static class DIExtensions
    {
        public static void AddRepositories(this IServiceCollection Services)
        {
            Services.AddScoped<IAchievementRepository, AchievementRepository>();
            Services.AddScoped<IAuthorRepository, AuthorRepository>();
            Services.AddScoped<IBookRepository, BookRepository>();
            Services.AddScoped<IGenreRepository, GenreRepository>();
            Services.AddScoped<IReviewRepository, ReviewRepository>();
            Services.AddScoped<ITimerRepository, TimerRepository>();
            Services.AddScoped<IUserAchievementRepository, UserAchievementRepository>();
            Services.AddScoped<IUserBookRepository, UserBookRepository>();
            Services.AddScoped<IUserRepository, UserRepository>();
        }
    }
}
