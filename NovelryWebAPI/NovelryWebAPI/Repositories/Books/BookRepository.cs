using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.Author;
using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.Genre;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Repositories.Books
{
    public class BookRepository(AppDbContext context) : IBookRepository
    {
        private readonly AppDbContext _context = context;

        public async Task<BookDto?> CreateBookAsync(CreateBookDto book)
        {
            var newBook = new Book
            {
                Title = book.Title,
                ISBN = book.ISBN,
                TotalPages = book.TotalPages,
                Description = book.Description,
                PublishedDate = book.PublishedDate,
                ImageUrl = book.ImageUrl,
            };

            if (book.AuthorIds?.Count > 0)
            {
                var authors = await _context
                    .Authors.Where(a => book.AuthorIds.Contains(a.AuthorId))
                    .ToListAsync();
                newBook.Authors = authors;
            }

            if (book.GenreIds?.Count > 0)
            {
                var genres = await _context
                    .Genres.Where(g => book.GenreIds.Contains(g.GenreId))
                    .ToListAsync();
                newBook.Genres = genres;
            }

            _context.Books.Add(newBook);
            await _context.SaveChangesAsync();

            return MapToDto(newBook);
        }

        public async Task<bool> DeleteBookByIdAsync(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
                return false;

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<BookDto>> GetAllBooksAsync()
        {
            var books = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .ToListAsync();

            return [.. books.Select(MapToDto)];
        }

        public async Task<BookDto?> GetBookByIdAsync(int id)
        {
            var book = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .FirstOrDefaultAsync(b => b.BookId == id);

            return book != null ? MapToDto(book) : null;
        }

        public async Task<BookDto?> GetBookByISBNAsync(string isbn)
        {
            var book = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .FirstOrDefaultAsync(b => b.ISBN == isbn);

            return book != null ? MapToDto(book) : null;
        }

        public async Task<BookDto?> GetBookByTitleAsync(string title)
        {
            var book = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .FirstOrDefaultAsync(b =>
                    b.Title.Equals(title, StringComparison.CurrentCultureIgnoreCase)
                );

            return book != null ? MapToDto(book) : null;
        }

        public async Task<List<BookDto>> GetBooksByAuthorAsync(string authorName)
        {
            var lowerAuthor = authorName.Trim().ToLower();

            var books = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .Where(b =>
                    b.Authors!.Any(a =>
                        (a.FirstName + " " + a.LastName).Equals(
                            lowerAuthor,
                            StringComparison.CurrentCultureIgnoreCase
                        )
                    )
                )
                .ToListAsync();

            return [.. books.Select(MapToDto)];
        }

        public async Task<List<BookDto>> GetBooksByGenreAsync(string genreName)
        {
            var lowerGenre = genreName.Trim().ToLower();

            var books = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .Where(b => b.Genres.Any(g => g.Name.ToLower() == lowerGenre))
                .ToListAsync();

            return books.Select(MapToDto).ToList();
        }

        public async Task<BookDto?> UpdateBookAsync(UpdateBookDto book)
        {
            var existing = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .FirstOrDefaultAsync(b => b.BookId == book.Id);

            if (existing == null)
                return null;

            if (!string.IsNullOrWhiteSpace(book.Title))
                existing.Title = book.Title;
            if (!string.IsNullOrWhiteSpace(book.ISBN))
                existing.ISBN = book.ISBN;
            if (book.TotalPages > 0)
                existing.TotalPages = book.TotalPages;
            if (!string.IsNullOrWhiteSpace(book.Description))
                existing.Description = book.Description;
            if (!string.IsNullOrWhiteSpace(book.ImageUrl))
                existing.ImageUrl = book.ImageUrl;
            if (book.PublishedDate != default)
                existing.PublishedDate = book.PublishedDate;

            if (book.AuthorIds?.Count > 0)
            {
                var authors = await _context
                    .Authors.Where(a => book.AuthorIds.Contains(a.AuthorId))
                    .ToListAsync();
                existing.Authors = authors;
            }

            if (book.GenreIds?.Count > 0)
            {
                var genres = await _context
                    .Genres.Where(g => book.GenreIds.Contains(g.GenreId))
                    .ToListAsync();
                existing.Genres = genres;
            }

            await _context.SaveChangesAsync();
            return MapToDto(existing);
        }

        public async Task<List<BookWithReviewDto>> GetAllBooksWithReviewsAsync()
        {
            var books = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .Include(b => b.Reviews)
                    .ThenInclude(r => r.User)
                .AsSplitQuery()
                .ToListAsync();

            return
            [
                .. books.Select(book =>
                {
                    var reviews = book
                        .Reviews.Select(r => new ReviewDto
                        {
                            Id = r.ReviewId,
                            UserId = r.UserId,
                            Username = r.User!.Username,
                            ProfileUrl = r.User.ImageUrl,
                            Rating = r.Rating,
                            Comment = r.Comment,
                            CreatedAt = r.CreatedAt,
                        })
                        .ToList();

                    double? average = reviews.Count > 0 ? reviews.Average(r => r.Rating) : null;

                    return new BookWithReviewDto
                    {
                        Book = new BookDto
                        {
                            Id = book.BookId,
                            Title = book.Title,
                            ISBN = book.ISBN,
                            Description = book.Description,
                            PublishedDate = book.PublishedDate,
                            TotalPages = book.TotalPages,
                            ImageUrl = book.ImageUrl,
                            Authors =
                            [
                                .. book.Authors!.Select(a => new AuthorDto
                                {
                                    Id = a.AuthorId,
                                    FirstName = a.FirstName,
                                    LastName = a.LastName,
                                }),
                            ],
                            Genres =
                            [
                                .. book.Genres.Select(g => new GenreDto
                                {
                                    Id = g.GenreId,
                                    Name = g.Name,
                                }),
                            ],
                        },
                        Reviews = reviews,
                        AverageRating = average?.ToString("n2") ?? "No rating.",
                    };
                }),
            ];
        }

        public async Task<List<BookWithReviewDto>> GetLatestBooksWithReviewsAsync(int count = 5)
        {
            var latestReviews = await _context
                .Reviews.Include(r => r.User)
                .Include(r => r.Book)
                    .ThenInclude(b => b!.Authors)
                .Include(r => r.Book)
                    .ThenInclude(b => b!.Genres)
                .OrderByDescending(r => r.CreatedAt)
                .Take(count)
                .ToListAsync();

            var grouped = latestReviews
                .GroupBy(r => r.BookId)
                .Select(g =>
                {
                    var book = g.First().Book;

                    return new BookWithReviewDto
                    {
                        Book = new BookDto
                        {
                            Id = book!.BookId,
                            Title = book.Title,
                            ISBN = book.ISBN,
                            Description = book.Description,
                            PublishedDate = book.PublishedDate,
                            TotalPages = book.TotalPages,
                            ImageUrl = book.ImageUrl,
                            Authors =
                            [
                                .. book!.Authors!.Select(a => new AuthorDto
                                {
                                    Id = a.AuthorId,
                                    FirstName = a.FirstName,
                                    LastName = a.LastName,
                                }),
                            ],
                            Genres =
                            [
                                .. book.Genres.Select(gen => new GenreDto
                                {
                                    Id = gen.GenreId,
                                    Name = gen.Name,
                                }),
                            ],
                        },
                        Reviews =
                        [
                            .. g.Select(r => new ReviewDto
                            {
                                Id = r.ReviewId,
                                Rating = r.Rating,
                                Comment = r.Comment,
                                CreatedAt = r.CreatedAt,
                                UserId = r.UserId,
                                Username = r.User!.Username,
                                ProfileUrl = r.User.ImageUrl,
                            }),
                        ],
                    };
                })
                .ToList();

            return grouped;
        }

        public async Task<List<BookWithReviewDto>> SearchBooksAsync(string query, int limit = 30)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new List<BookWithReviewDto>();

            var lowerQuery = query.Trim().ToLower();

            var books = await _context
                .Books.Include(b => b.Authors)
                .Include(b => b.Genres)
                .Include(b => b.Reviews)
                    .ThenInclude(r => r.User)
                .Where(b =>
                    EF.Functions.Like(b.Title.ToLower(), $"%{lowerQuery}%")
                    || b.Authors.Any(a =>
                        EF.Functions.Like(
                            (a.FirstName + " " + a.LastName).ToLower(),
                            $"%{lowerQuery}%"
                        )
                    )
                )
                .OrderByDescending(b => b.Reviews.Max(r => r.CreatedAt))
                .Take(limit)
                .AsSplitQuery()
                .ToListAsync();

            return books
                .Select(book =>
                {
                    var reviews = book
                        .Reviews.Select(r => new ReviewDto
                        {
                            Id = r.ReviewId,
                            UserId = r.UserId,
                            Username = r.User!.Username,
                            ProfileUrl = r.User.ImageUrl,
                            Rating = r.Rating,
                            Comment = r.Comment,
                            CreatedAt = r.CreatedAt,
                        })
                        .ToList();

                    double? avg = reviews.Count > 0 ? reviews.Average(r => r.Rating) : null;

                    return new BookWithReviewDto
                    {
                        Book = new BookDto
                        {
                            Id = book.BookId,
                            Title = book.Title,
                            ISBN = book.ISBN,
                            Description = book.Description,
                            PublishedDate = book.PublishedDate,
                            TotalPages = book.TotalPages,
                            ImageUrl = book.ImageUrl,
                            Authors = book
                                .Authors.Select(a => new AuthorDto
                                {
                                    Id = a.AuthorId,
                                    FirstName = a.FirstName,
                                    LastName = a.LastName,
                                })
                                .ToList(),
                            Genres = book
                                .Genres.Select(g => new GenreDto { Id = g.GenreId, Name = g.Name })
                                .ToList(),
                        },
                        Reviews = reviews,
                        AverageRating = avg?.ToString("n2") ?? "No rating.",
                    };
                })
                .ToList();
        }

        private BookDto MapToDto(Book b)
        {
            return new BookDto
            {
                Id = b.BookId,
                Title = b.Title,
                ISBN = b.ISBN,
                Authors =
                [
                    .. b.Authors!.Select(a => new AuthorDto
                    {
                        Id = a.AuthorId,
                        FirstName = a.FirstName,
                        LastName = a.LastName,
                    }),
                ],
                Description = b.Description,
                PublishedDate = b.PublishedDate,
                TotalPages = b.TotalPages,
                Genres = [.. b.Genres.Select(g => new GenreDto { Id = g.GenreId, Name = g.Name })],
                ImageUrl = b.ImageUrl,
            };
        }
    }
}
