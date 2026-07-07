using Microsoft.EntityFrameworkCore;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Data.DefaultData
{
    public static class SeedData
    {
        public static async Task LoadData(WebApplication app)
        {
            await using var scope = app.Services.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await context.Database.MigrateAsync();

            var (books, authors, genres) = DefaultData.LoadAll();

            if (!context.Genres.Any())
            {
                await context.Genres.AddRangeAsync(genres);
                await context.SaveChangesAsync();
            }

            if (!context.Authors.Any())
            {
                await context.Authors.AddRangeAsync(authors);
                await context.SaveChangesAsync();
            }

            if (!context.Books.Any())
            {
                await context.Books.AddRangeAsync(books);
                await context.SaveChangesAsync();
            }

            if (!context.Users.Any())
            {
                await context.Users.AddRangeAsync(DefaultData.Users);
                await context.SaveChangesAsync();
            }

            if (!context.Achievements.Any())
            {
                await context.Achievements.AddRangeAsync(DefaultData.Achievements);
                await context.SaveChangesAsync();
            }

            var allBooks = await context.Books.ToListAsync();
            var allUsers = await context
                .Users.Include(u => u.Books)
                .Include(u => u.Achievements)
                .ToListAsync();
            var allAchievements = await context.Achievements.ToListAsync();

            var random = new Random();

            foreach (var user in allUsers)
            {
                if (user.Books.Count == 0)
                {
                    var userBooks = allBooks.OrderBy(_ => random.Next()).Take(15).ToList();
                    foreach (var book in userBooks)
                    {
                        var status = (UserBookStatus)random.Next(0, 3);
                        int currentPage = status switch
                        {
                            UserBookStatus.WantToRead => 0,
                            UserBookStatus.Reading => random.Next(1, book.TotalPages),
                            UserBookStatus.Completed => book.TotalPages,
                            _ => 0,
                        };

                        user.Books.Add(
                            new UserBook
                            {
                                UserId = user.UserId,
                                BookId = book.BookId,
                                Status = status,
                                CurrentPage = currentPage,
                                IsCompleted = status == UserBookStatus.Completed,
                                AddedAt = DateTime.UtcNow.AddDays(-random.Next(1, 60)),
                            }
                        );
                    }
                }

                if (user.Achievements.Count == 0)
                {
                    var count = random.Next(1, 4);
                    var userAchievements = allAchievements
                        .OrderBy(_ => random.Next())
                        .Take(count)
                        .ToList();

                    foreach (var achievement in userAchievements)
                    {
                        user.Achievements.Add(
                            new UserAchievement
                            {
                                UserId = user.UserId,
                                AchievementId = achievement.AchievementId,
                                AchievedAt = DateTime.UtcNow.AddDays(-random.Next(1, 60)),
                            }
                        );
                    }
                }

                if (!context.Reviews.Any())
                {
                    var booksToReview = allBooks.OrderBy(_ => random.Next()).Take(10).ToList();
                    int maxBookId = allBooks.Max(b => b.BookId);

                    foreach (var book in booksToReview)
                    {
                        if (
                            await context.Reviews.AnyAsync(r =>
                                r.BookId == book.BookId && r.UserId == user.UserId
                            )
                        )
                            continue;

                        double bias = 1.0 - ((double)book.BookId / maxBookId);

                        double rating = Math.Clamp(
                            GenerateWeightedRating(random, bias, book.BookId),
                            1.0,
                            5.0
                        );

                        string comment =
                            rating >= 4.5 ? "This is one of my favorites! A true masterpiece!"
                            : rating >= 4 ? "Loved this book — definitely worth reading."
                            : rating >= 3 ? "It was fine, but didn’t really stick with me."
                            : rating >= 2 ? "Wouldn’t recommend it, but I managed to finish it."
                            : "I couldn’t get into this one at all.";

                        context.Reviews.Add(
                            new Review
                            {
                                UserId = user.UserId,
                                BookId = book.BookId,
                                Rating = Math.Round(rating, 1),
                                Comment = comment,
                                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 30)),
                            }
                        );
                    }
                }

                if (!context.Timers.Any())
                {
                    var booksToTime = allBooks.OrderBy(_ => random.Next()).Take(2).ToList();
                    foreach (var book in booksToTime)
                    {
                        var start = DateTime
                            .UtcNow.AddDays(-random.Next(1, 30))
                            .AddHours(-random.Next(1, 5));
                        var end = start.AddMinutes(random.Next(10, 120));

                        context.Timers.Add(
                            new Models.Timer
                            {
                                UserId = user.UserId,
                                BookId = book.BookId,
                                StartTime = start,
                                EndTime = end,
                            }
                        );
                    }
                }
            }

            await context.SaveChangesAsync();
        }

        static double GenerateWeightedRating(Random random, double bias, int bookId)
        {
            double baseValue = random.NextDouble();
            double weighted = Math.Pow(baseValue, 1.0 + (1.5 * (1.0 - bias)));

            double rawRating = 1.0 + weighted * 4.0;

            double minRating;
            if (bookId <= 50)
            {
                minRating = 3.8 + (random.NextDouble() * 1.2);
            }
            else if (bookId <= 200)
            {
                minRating = 2.8 + (bias * 2.0);
            }
            else
            {
                minRating = 1.0;
            }

            return Math.Clamp(Math.Max(rawRating, minRating), 1.0, 5.0);
        }
    }
}
