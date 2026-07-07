using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NovelryDTO.DTOs.User;
using NovelryWebAPI.Repositories.Users;

namespace NovelryWebAPI.Controllers
{
    [ApiController]
    [Route("users")]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest login)
        {
            var user = await _userRepository.AuthenticateAsync(login.Email, login.Password);
            if (user == null)
                return Unauthorized();

            return Ok(user);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userRepository.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto user)
        {
            var created = await _userRepository.CreateUserAsync(user);
            if (created == null)
                return BadRequest("Email already exists.");

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto user)
        {
            if (id != user.Id)
                return BadRequest();

            var updated = await _userRepository.UpdateUserAsync(user);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _userRepository.DeleteUserByIdAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }

    public record LoginRequest(string Email, string Password);
}
