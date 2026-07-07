using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NovelryDTO.DTOs.UserBook;
using NovelryWebAPI.Repositories.UserBooks;

namespace NovelryWebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserBooksController : ControllerBase
    {
        private readonly IUserBookRepository _userBookRepository;

        public UserBooksController(IUserBookRepository userBookRepository)
        {
            _userBookRepository = userBookRepository;
        }

        [HttpGet("{id}")]
        public async Task<UserBookDto?> GetById(int id)
        {
            return await _userBookRepository.GetUserBookByIdAsync(id);
        }

        [HttpGet("user/{userId}")]
        public async Task<List<UserBookDto>> GetByUserId(int userId)
        {
            return await _userBookRepository.GetAllUserBooksByUserIdAsync(userId);
        }

        [HttpGet("username/{username}")]
        public async Task<List<UserBookDto>> GetByUsername(string username)
        {
            return await _userBookRepository.GetAllUserBooksByUsernameAsync(username);
        }

        [HttpGet("user/{userId}/book/{bookId}")]
        public async Task<UserBookDto?> GetByUserAndBook(int userId, int bookId)
        {
            return await _userBookRepository.GetUserBookByUserIdAndBookIdAsync(userId, bookId);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateUserBookDto userBook)
        {
            var result = await _userBookRepository.CreateUserBookAsync(userBook);

            if (result == null)
                return BadRequest("UserBook could not be created.");

            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<UserBookDto?> Update(int id, UpdateUserBookDto userBook)
        {
            if (id != userBook.Id)
                return null;

            return await _userBookRepository.UpdateUserBookAsync(userBook);
        }

        [HttpDelete("{id}")]
        public async Task<bool> Delete(int id)
        {
            return await _userBookRepository.DeleteUserBookByIdAsync(id);
        }
    }
}
