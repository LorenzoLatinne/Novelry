using Microsoft.AspNetCore.Mvc;
using NovelryDTO.DTOs.Achievement;
using NovelryWebAPI.Repositories.UserAchievements;

namespace NovelryWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserAchievementsController : ControllerBase
    {
        private readonly IUserAchievementRepository _userAchievementRepository;

        public UserAchievementsController(IUserAchievementRepository userAchievementRepository)
        {
            _userAchievementRepository = userAchievementRepository;
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<UserAchievementDto>>> GetByUserId(int userId)
        {
            var result = await _userAchievementRepository.GetUserAchievementsByUserIdAsync(userId);
            return Ok(result);
        }

        [HttpGet("username/{username}")]
        public async Task<ActionResult<List<UserAchievementDto>>> GetByUsername(string username)
        {
            var result = await _userAchievementRepository.GetUserAchievementsByUsernameAsync(
                username
            );
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<UserAchievementDto>> Grant(
            [FromBody] CreateUserAchievementDto dto
        )
        {
            var result = await _userAchievementRepository.GrantAchievementAsync(dto);
            if (result == null)
                return BadRequest("User or Achievement not found, or achievement already granted.");

            return Ok(result);
        }
    }
}
