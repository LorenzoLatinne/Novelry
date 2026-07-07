using NovelryDTO.DTOs.Book;

namespace NovelryMAUIApp.Repositories.Review
{
    public interface IReviewRepository
    {
        // Create
        Task<ReviewDto?> CreateReviewAsync(CreateReviewDto review, int userId, string username);

        // Read
        Task<List<ReviewDto>> GetAllReviewsAsync();
        Task<List<ReviewDto>> GetAllReviewsForBookAsync(int bookId);
        Task<List<ReviewDto>> GetAllReviewsByUsernameAsync(string username);
        Task<List<ReviewDto>> GetAllReviewsByUserIdAsync(int userId);
        Task<ReviewDto?> GetReviewByIdAsync(int id);

        Task<List<ReviewDto>> GetLastFiveReviews();
        Task<List<ReviewDto>> GetLastTwentyReviewsAsync();

        // Update
        Task<ReviewDto?> UpdateReviewAsync(UpdateReviewDto review);

        // Delete
        Task<bool> DeleteReviewByIdAsync(int id);
    }
}
