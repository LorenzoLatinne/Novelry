using NovelryDTO.DTOs.Book;

namespace NovelryWebAPI.Repositories.Reviews
{
    public interface IReviewRepository
    {
        // Create
        Task<ReviewDto?> CreateReviewAsync(CreateReviewDto review, int userId);

        // Read
        Task<List<ReviewDto>> GetAllReviewsAsync();
        Task<List<ReviewDto>> GetLastTwentyReviewsAsync();
        Task<List<ReviewDto>> GetAllReviewsForBookAsync(int bookId);
        Task<List<ReviewDto>> GetAllReviewsByUserIdAsync(int userId);
        Task<ReviewDto?> GetReviewByIdAsync(int id);
        Task<List<ReviewDto>> GetLastFiveReviewsAsync();

        // Update
        Task<ReviewDto?> UpdateReviewAsync(UpdateReviewDto review);

        // Delete
        Task<bool> DeleteReviewByIdAsync(int id);
    }
}
