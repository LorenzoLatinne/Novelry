using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.Book;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Repositories.Reviews
{
    public class ReviewRepository(AppDbContext context) : IReviewRepository
    {
        private readonly AppDbContext _context = context;

        public async Task<ReviewDto?> CreateReviewAsync(CreateReviewDto review, int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return null;

            var book = await _context.Books.FindAsync(review.BookId);
            if (book == null)
                return null;

            var entity = new Review
            {
                UserId = userId,
                BookId = review.BookId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Reviews.Add(entity);
            await _context.SaveChangesAsync();

            return new ReviewDto
            {
                Id = entity.ReviewId,
                UserId = user.UserId,
                BookId = book.BookId,
                Username = user.Username,
                ProfileUrl = user.ImageUrl,
                Rating = entity.Rating,
                Comment = entity.Comment,
                CreatedAt = entity.CreatedAt,
            };
        }

        public async Task<bool> DeleteReviewByIdAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
                return false;

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<ReviewDto>> GetAllReviewsAsync()
        {
            return await _context
                .Reviews.Include(r => r.Book)
                .Include(r => r.User)
                .Select(r => new ReviewDto
                {
                    Id = r.ReviewId,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    Username = r.User!.Username,
                    ProfileUrl = r.User.ImageUrl,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                })
                .ToListAsync();
        }

        public async Task<List<ReviewDto>> GetAllReviewsForBookAsync(int bookId)
        {
            return await _context
                .Reviews.Include(r => r.User)
                .Where(r => r.BookId == bookId)
                .Select(r => new ReviewDto
                {
                    Id = r.ReviewId,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    Username = r.User!.Username,
                    ProfileUrl = r.User.ImageUrl,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                })
                .ToListAsync();
        }

        public async Task<List<ReviewDto>> GetAllReviewsByUserIdAsync(int userId)
        {
            return await _context
                .Reviews.Include(r => r.Book)
                .Where(r => r.UserId == userId)
                .Select(r => new ReviewDto
                {
                    Id = r.ReviewId,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    Username = r.User!.Username,
                    ProfileUrl = r.User.ImageUrl,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                })
                .ToListAsync();
        }

        public async Task<ReviewDto?> GetReviewByIdAsync(int id)
        {
            var review = await _context
                .Reviews.Include(r => r.User)
                .Include(r => r.Book)
                .FirstOrDefaultAsync(r => r.ReviewId == id);

            if (review == null)
                return null;

            return new ReviewDto
            {
                Id = review.ReviewId,
                UserId = review.UserId,
                BookId = review.BookId,
                Username = review.User!.Username,
                ProfileUrl = review.User.ImageUrl,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt,
            };
        }

        public async Task<List<ReviewDto>> GetLastFiveReviewsAsync()
        {
            return await _context
                .Reviews.Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .Take(5)
                .Select(r => new ReviewDto
                {
                    Id = r.ReviewId,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    Username = r.User!.Username,
                    ProfileUrl = r.User.ImageUrl,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                })
                .ToListAsync();
        }

        public async Task<ReviewDto?> UpdateReviewAsync(UpdateReviewDto review)
        {
            var existing = await _context.Reviews.FindAsync(review.Id);
            if (existing == null)
                return null;

            if (review.Rating.HasValue)
                existing.Rating = review.Rating.Value;

            if (!string.IsNullOrWhiteSpace(review.Comment))
                existing.Comment = review.Comment;

            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(existing.UserId);

            return new ReviewDto
            {
                Id = existing.ReviewId,
                UserId = existing.UserId,
                BookId = existing.BookId,
                Username = user?.Username ?? string.Empty,
                ProfileUrl = user?.ImageUrl,
                Rating = existing.Rating,
                Comment = existing.Comment,
                CreatedAt = existing.CreatedAt,
            };
        }

        public async Task<List<ReviewDto>> GetLastTwentyReviewsAsync()
        {
            return await _context
                .Reviews.Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .Take(20)
                .Select(r => new ReviewDto
                {
                    Id = r.ReviewId,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    Username = r.User!.Username,
                    ProfileUrl = r.User.ImageUrl,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                })
                .ToListAsync();
        }
    }
}
