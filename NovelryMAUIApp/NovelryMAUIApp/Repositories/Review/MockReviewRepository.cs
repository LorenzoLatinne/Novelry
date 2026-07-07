using NovelryDTO.DTOs.Book;

namespace NovelryMAUIApp.Repositories.Review
{
    public class MockReviewRepository : IReviewRepository
    {
        private readonly List<ReviewDto> _reviews = new()
        {
            new()
            {
                Id = 1,
                BookId = 1,
                UserId = 1,
                Username = "John Doe",
                Comment = "Amazing book!",
                Rating = 5,
                CreatedAt = DateTime.UtcNow.AddDays(-25),
            },
            new()
            {
                Id = 2,
                BookId = 2,
                UserId = 2,
                Username = "Jane Doe",
                Comment = "Very funny and insightful.",
                Rating = 4.4,
                CreatedAt = DateTime.UtcNow.AddDays(-20),
            },
        };

        public Task<ReviewDto?> CreateReviewAsync(
            CreateReviewDto review,
            int userId,
            string username
        )
        {
            if (review == null)
                return Task.FromResult<ReviewDto?>(null);

            var newReview = new ReviewDto()
            {
                Id = _reviews.Any() ? _reviews.Max(r => r.Id) + 1 : 1,
                BookId = review.BookId,
                UserId = userId,
                Username = username,
                Comment = review.Comment,
                Rating = review.Rating,
                CreatedAt = DateTime.UtcNow,
            };

            _reviews.Add(newReview);
            return Task.FromResult(newReview ?? null);
        }

        public Task<bool> DeleteReviewByIdAsync(int id)
        {
            var review = _reviews.FirstOrDefault(r => r.Id == id);
            if (review == null)
                return Task.FromResult(false);

            _reviews.Remove(review);
            return Task.FromResult(true);
        }

        public Task<List<ReviewDto>> GetAllReviewsAsync()
        {
            return Task.FromResult(_reviews.ToList() ?? new());
        }

        public Task<List<ReviewDto>> GetAllReviewsByUserIdAsync(int userId)
        {
            var reviews = _reviews.Where(r => r.UserId == userId);
            return Task.FromResult(reviews?.ToList() ?? new());
        }

        public Task<List<ReviewDto>> GetAllReviewsByUsernameAsync(string username)
        {
            var reviews = _reviews.Where(r =>
                r.Username.Equals(username, StringComparison.OrdinalIgnoreCase)
            );
            return Task.FromResult(reviews?.ToList() ?? new());
        }

        public Task<List<ReviewDto>> GetAllReviewsForBookAsync(int bookId)
        {
            var reviews = _reviews.Where(r => r.BookId == bookId);
            return Task.FromResult(reviews.ToList() ?? new());
        }

        public Task<List<ReviewDto>> GetLastFiveReviews()
        {
            return Task.FromResult(_reviews.OrderByDescending(r => r.CreatedAt).Take(5).ToList());
        }

        public Task<List<ReviewDto>> GetLastTwentyReviewsAsync()
        {
            return Task.FromResult(_reviews.OrderByDescending(r => r.CreatedAt).Take(20).ToList());
        }

        public Task<ReviewDto?> GetReviewByIdAsync(int id)
        {
            var review = _reviews.FirstOrDefault(r => r.Id == id);
            return Task.FromResult(review != null ? review : null);
        }

        public Task<ReviewDto?> UpdateReviewAsync(UpdateReviewDto review)
        {
            if (review == null)
                return Task.FromResult<ReviewDto?>(null);

            var newReview = new ReviewDto();

            if (!string.IsNullOrWhiteSpace(review.Comment))
                newReview.Comment = review.Comment;
            if (review.Rating != null)
                newReview.Rating = (double)review.Rating;

            return Task.FromResult(newReview != null ? newReview : null);
        }
    }
}
