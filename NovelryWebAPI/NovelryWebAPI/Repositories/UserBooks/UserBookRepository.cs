using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.UserBook;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Repositories.UserBooks
{
    public class UserBookRepository : IUserBookRepository
    {
        private readonly AppDbContext _context;

        public UserBookRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserBookDto?> CreateUserBookAsync(CreateUserBookDto userBook)
        {
            var user = await _context.Users.FindAsync(userBook.UserId);
            var book = await _context.Books.FindAsync(userBook.BookId);

            if (user == null || book == null)
                return null;

            var exists = await _context.UserBooks.AnyAsync(ub =>
                ub.UserId == userBook.UserId && ub.BookId == userBook.BookId
            );

            if (exists)
                return null;

            var modelStatus = MapDtoStatusToModel(userBook.Status);

            var newEntity = new UserBook
            {
                UserId = userBook.UserId,
                BookId = userBook.BookId,
                Status = modelStatus,
                IsCompleted = modelStatus == Models.UserBookStatus.Completed,
                CurrentPage = modelStatus == Models.UserBookStatus.Completed ? book.TotalPages : 0,
                AddedAt = DateTime.UtcNow,
            };

            _context.UserBooks.Add(newEntity);
            await _context.SaveChangesAsync();

            return MapToDto(newEntity);
        }

        public async Task<bool> DeleteUserBookByIdAsync(int id)
        {
            var entity = await _context.UserBooks.FindAsync(id);
            if (entity == null)
                return false;

            _context.UserBooks.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserBookDto?> GetUserBookByIdAsync(int id)
        {
            var entity = await _context
                .UserBooks.Include(ub => ub.Book)
                    .ThenInclude(b => b.Authors)
                .Include(ub => ub.Book)
                    .ThenInclude(b => b.Genres)
                .FirstOrDefaultAsync(ub => ub.UserBookId == id);

            return MapToDto(entity);
        }

        public async Task<UserBookDto?> GetUserBookByUserIdAndBookIdAsync(int userId, int bookId)
        {
            var entity = await _context
                .UserBooks.Include(ub => ub.Book)
                    .ThenInclude(b => b.Authors)
                .Include(ub => ub.Book)
                    .ThenInclude(b => b.Genres)
                .FirstOrDefaultAsync(ub => ub.UserId == userId && ub.BookId == bookId);

            return MapToDto(entity);
        }

        public async Task<List<UserBookDto>> GetAllUserBooksByUserIdAsync(int userId)
        {
            var entities = await _context
                .UserBooks.Include(ub => ub.Book)
                    .ThenInclude(b => b.Authors)
                .Include(ub => ub.Book)
                    .ThenInclude(b => b.Genres)
                .Where(ub => ub.UserId == userId)
                .ToListAsync();

            return entities.Select(MapToDto).ToList();
        }

        public async Task<List<UserBookDto>> GetAllUserBooksByUsernameAsync(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == username.ToLower()
            );

            if (user == null)
                return new List<UserBookDto>();

            return await GetAllUserBooksByUserIdAsync(user.UserId);
        }

        public async Task<UserBookDto?> UpdateUserBookAsync(UpdateUserBookDto userBook)
        {
            var existing = await _context
                .UserBooks.Include(ub => ub.Book)
                    .ThenInclude(b => b.Authors)
                .Include(ub => ub.Book)
                    .ThenInclude(b => b.Genres)
                .FirstOrDefaultAsync(ub => ub.UserBookId == userBook.Id);

            if (existing == null)
                return null;

            if (userBook.CurrentPage.HasValue)
                existing.CurrentPage = userBook.CurrentPage.Value;

            if (userBook.IsCompleted.HasValue)
                existing.IsCompleted = userBook.IsCompleted.Value;

            if (userBook.Status.HasValue)
                existing.Status = MapDtoStatusToModel(userBook.Status.Value);

            SyncUserBook(existing);

            await _context.SaveChangesAsync();
            return MapToDto(existing);
        }

        private UserBookDto? MapToDto(UserBook? entity)
        {
            if (entity == null)
                return null;

            return new UserBookDto
            {
                Id = entity.UserBookId,
                UserId = entity.UserId,
                BookId = entity.BookId,
                CurrentPage = entity.CurrentPage,
                IsCompleted = entity.IsCompleted,
                Status = MapModelStatusToDto(entity.Status),
                AddedAt = entity.AddedAt,
                Book =
                    entity.Book == null
                        ? null
                        : new NovelryDTO.DTOs.Book.BookDto
                        {
                            Id = entity.Book.BookId,
                            ISBN = entity.Book.ISBN,
                            Title = entity.Book.Title,
                            Description = entity.Book.Description,
                            TotalPages = entity.Book.TotalPages,
                            ImageUrl = entity.Book.ImageUrl,
                            PublishedDate = entity.Book.PublishedDate,
                            Authors = entity
                                .Book.Authors.Select(a => new NovelryDTO.DTOs.Author.AuthorDto()
                                {
                                    Id = a.AuthorId,
                                    FirstName = a.FirstName,
                                    LastName = a.LastName,
                                })
                                .ToList(),
                            Genres = entity
                                .Book.Genres.Select(g => new NovelryDTO.DTOs.Genre.GenreDto()
                                {
                                    Id = g.GenreId,
                                    Name = g.Name,
                                })
                                .ToList(),
                        },
            };
        }

        private Models.UserBookStatus MapDtoStatusToModel(NovelryDTO.Enums.UserBookStatus dtoStatus)
        {
            return dtoStatus switch
            {
                NovelryDTO.Enums.UserBookStatus.WantToRead => Models.UserBookStatus.WantToRead,
                NovelryDTO.Enums.UserBookStatus.Reading => Models.UserBookStatus.Reading,
                NovelryDTO.Enums.UserBookStatus.Read => Models.UserBookStatus.Completed,
                _ => Models.UserBookStatus.WantToRead,
            };
        }

        private NovelryDTO.Enums.UserBookStatus MapModelStatusToDto(
            Models.UserBookStatus modelStatus
        )
        {
            return modelStatus switch
            {
                Models.UserBookStatus.WantToRead => NovelryDTO.Enums.UserBookStatus.WantToRead,
                Models.UserBookStatus.Reading => NovelryDTO.Enums.UserBookStatus.Reading,
                Models.UserBookStatus.Completed => NovelryDTO.Enums.UserBookStatus.Read,
                _ => NovelryDTO.Enums.UserBookStatus.WantToRead,
            };
        }

        private void SyncUserBook(UserBook entity)
        {
            if (entity.Book == null)
                return;

            if (entity.CurrentPage >= entity.Book.TotalPages)
            {
                entity.CurrentPage = entity.Book.TotalPages;
                entity.Status = Models.UserBookStatus.Completed;
                entity.IsCompleted = true;
            }
            else if (entity.CurrentPage > 0)
            {
                entity.Status = Models.UserBookStatus.Reading;
                entity.IsCompleted = false;
            }
            else
            {
                entity.Status = Models.UserBookStatus.WantToRead;
                entity.IsCompleted = false;
            }
        }
    }
}
