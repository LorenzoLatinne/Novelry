using ExcelDataReader;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Data.DefaultData
{
    public static class DefaultData
    {
        internal static string _top500Books =
            $"{Environment.CurrentDirectory}/Data/Top500Books.xlsx";

        public static (
            IEnumerable<Book> Books,
            IEnumerable<Author> Authors,
            IEnumerable<Genre> Genres
        ) LoadAll()
        {
            var books = new List<Book>();
            var authors = new List<Author>();
            var genres = new List<Genre>();

            using var stream = File.Open(_top500Books, FileMode.Open, FileAccess.Read);
            using var reader = ExcelReaderFactory.CreateReader(stream);

            do
            {
                while (reader.Read())
                {
                    if (reader.Depth == 0 || reader.GetValue(0) == null)
                        continue;

                    var title = reader.GetValue(0)?.ToString()?.Trim();
                    var authorCell = reader.GetValue(1)?.ToString()?.Trim();
                    var description = reader.GetValue(3)?.ToString()?.Trim();
                    var isbn = reader.GetValue(4)?.ToString()?.Trim();
                    var genreCell = reader.GetValue(5)?.ToString()?.Trim();
                    var pages = reader.GetValue(6)?.ToString()?.Trim() ?? "0";
                    var publishDate = reader.GetValue(7)?.ToString()?.Trim();
                    var firstPublishDate = reader.GetValue(8)?.ToString()?.Trim();
                    var imageUrl = reader.GetValue(11)?.ToString()?.Trim();

                    if (string.IsNullOrEmpty(title))
                        continue;

                    var bookAuthors = new List<Author>();
                    if (!string.IsNullOrEmpty(authorCell))
                    {
                        foreach (var fullName in authorCell.Split(',').Select(a => a.Trim()))
                        {
                            if (string.IsNullOrEmpty(fullName))
                                continue;

                            var parts = fullName.Split(' ', 2);
                            var firstName = parts[0];
                            var lastName = parts.Length > 1 ? parts[1] : "";

                            var author = authors.FirstOrDefault(a =>
                                a.FirstName == firstName && a.LastName == lastName
                            );
                            if (author == null)
                            {
                                author = new Author { FirstName = firstName, LastName = lastName };
                                authors.Add(author);
                            }
                            bookAuthors.Add(author);
                        }
                    }

                    var bookGenres = new List<Genre>();
                    if (!string.IsNullOrEmpty(genreCell))
                    {
                        foreach (var g in genreCell.Split(',').Select(s => s.Trim()))
                        {
                            if (string.IsNullOrEmpty(g))
                                continue;

                            var genre = genres.FirstOrDefault(x => x.Name == g);
                            if (genre == null)
                            {
                                genre = new Genre { Name = g };
                                genres.Add(genre);
                            }
                            bookGenres.Add(genre);
                        }
                    }

                    var book = new Book
                    {
                        Title = title,
                        Description = description ?? "",
                        ISBN = isbn ?? "",
                        Authors = bookAuthors,
                        Genres = bookGenres,
                        ImageUrl = imageUrl ?? "/images/covers/noverly_logo.png",
                        TotalPages = int.Parse(pages),
                        PublishedDate =
                            firstPublishDate != null
                                ? DateOnly.FromDateTime(DateTime.Parse(firstPublishDate))
                            : publishDate != null
                                ? DateOnly.FromDateTime(DateTime.Parse(publishDate))
                            : DateOnly.FromDateTime(DateTime.Now),
                    };

                    books.Add(book);
                }
            } while (reader.NextResult());

            return (books, authors, genres);
        }

        public static IEnumerable<User> Users =>
            [
                new()
                {
                    Username = "John",
                    Email = "john@example.com",
                    PasswordHash = PasswordHelper.HashPassword("Password123@"),
                    ImageUrl = "/images/users/user1.jpg",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                },
                new()
                {
                    Username = "Jane",
                    Email = "jane@example.com",
                    PasswordHash = PasswordHelper.HashPassword("Password123@"),
                    ImageUrl = "/images/users/user2.jpg",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                },
                new()
                {
                    Username = "Smith",
                    Email = "smith@example.com",
                    PasswordHash = PasswordHelper.HashPassword("Password123@"),
                    ImageUrl = "/images/users/user3.jpg",
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                },
                new()
                {
                    Username = "Amber",
                    Email = "amber@example.com",
                    PasswordHash = PasswordHelper.HashPassword("Password123@"),
                    ImageUrl = "/images/users/user4.jpg",
                    CreatedAt = DateTime.UtcNow.AddDays(-14),
                },
                new()
                {
                    Username = "Sarah",
                    Email = "sarah@example.com",
                    PasswordHash = PasswordHelper.HashPassword("Password123@"),
                    ImageUrl = "/images/users/user5.jpg",
                    CreatedAt = DateTime.UtcNow.AddMonths(-1),
                },
            ];

        public static IEnumerable<Achievement> Achievements =>
            [
                new()
                {
                    Name = "First Book",
                    Description = "Add your first book to your library",
                    ImageUrl = "/images/achievements/first_book.png",
                    TriggerType = "UserBookCount",
                    TargetValue = 1,
                },
                new()
                {
                    Name = "Bookworm",
                    Description = "Complete 10 books",
                    ImageUrl = "/images/achievements/bookworm.png",
                    TriggerType = "BooksCompleted",
                    TargetValue = 10,
                },
                new()
                {
                    Name = "Marathon Reader",
                    Description = "Read for 10 hours total",
                    ImageUrl = "/images/achievements/marathon_reader.png",
                    TriggerType = "ReadingTime",
                    TargetValue = 10 * 60,
                },
            ];
    }
}
