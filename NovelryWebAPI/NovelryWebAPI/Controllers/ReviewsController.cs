using Microsoft.AspNetCore.Mvc;
using NovelryDTO.DTOs.Book;
using NovelryWebAPI.Repositories.Reviews;

namespace NovelryWebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ReviewsController(IReviewRepository reviewRepository) : ControllerBase
    {
        private readonly IReviewRepository _reviewRepository = reviewRepository;

        [HttpGet]
        public async Task<List<ReviewDto>> GetAll()
        {
            return await _reviewRepository.GetAllReviewsAsync();
        }

        [HttpGet("{id}")]
        public async Task<ReviewDto?> GetById(int id)
        {
            return await _reviewRepository.GetReviewByIdAsync(id);
        }

        [HttpGet("book/{bookId}")]
        public async Task<List<ReviewDto>> GetByBook(int bookId)
        {
            return await _reviewRepository.GetAllReviewsForBookAsync(bookId);
        }

        [HttpGet("user/{userId}")]
        public async Task<List<ReviewDto>> GetByUser(int userId)
        {
            return await _reviewRepository.GetAllReviewsByUserIdAsync(userId);
        }

        [HttpGet("lastfive")]
        public async Task<List<ReviewDto>> GetLastFive()
        {
            return await _reviewRepository.GetLastFiveReviewsAsync();
        }

        [HttpGet("lasttwenty")]
        public async Task<List<ReviewDto>> GetLastTwenty()
        {
            return await _reviewRepository.GetLastTwentyReviewsAsync();
        }

        [HttpPost("{userId}")]
        public async Task<ReviewDto?> Create(CreateReviewDto review, int userId)
        {
            return await _reviewRepository.CreateReviewAsync(review, userId);
        }

        [HttpPut("{id}")]
        public async Task<ReviewDto?> Update(int id, UpdateReviewDto review)
        {
            if (id != review.Id)
                return null;
            return await _reviewRepository.UpdateReviewAsync(review);
        }

        [HttpDelete("{id}")]
        public async Task<bool> Delete(int id)
        {
            return await _reviewRepository.DeleteReviewByIdAsync(id);
        }
    }
}
