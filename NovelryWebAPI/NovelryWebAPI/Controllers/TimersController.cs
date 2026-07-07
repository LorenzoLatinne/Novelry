using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NovelryDTO.DTOs.Timer;
using NovelryWebAPI.Repositories.Timers;

namespace NovelryWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TimersController : ControllerBase
    {
        private readonly ITimerRepository _timerRepository;

        public TimersController(ITimerRepository timerRepository)
        {
            _timerRepository = timerRepository;
        }

        [HttpGet]
        public async Task<ActionResult<List<TimerDto>>> GetAll()
        {
            var timers = await _timerRepository.GetAllTimersAsync();
            return Ok(timers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TimerDto>> GetById(int id)
        {
            var timer = await _timerRepository.GetTimerByIdAsync(id);
            if (timer == null)
                return NotFound();
            return Ok(timer);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<TimerDto>>> GetByUserId(int userId)
        {
            return Ok(await _timerRepository.GetAllTimersByUserIdAsync(userId));
        }

        [HttpGet("username/{username}")]
        public async Task<ActionResult<List<TimerDto>>> GetByUsername(string username)
        {
            return Ok(await _timerRepository.GetAllTimersByUsernameAsync(username));
        }

        [HttpGet("book/{bookId}")]
        public async Task<ActionResult<List<TimerDto>>> GetByBookId(int bookId)
        {
            return Ok(await _timerRepository.GetAllTimersByBookIdAsync(bookId));
        }

        [HttpPost]
        public async Task<ActionResult<TimerDto>> Create(CreateTimerDto dto)
        {
            var timer = await _timerRepository.CreateTimerAsync(dto);
            if (timer == null)
                return BadRequest("Invalid UserId or BookId.");
            return Ok(timer);
        }

        [HttpPut]
        public async Task<ActionResult<TimerDto>> Update(UpdateTimerDto dto)
        {
            var timer = await _timerRepository.UpdateTimerAsync(dto);
            if (timer == null)
                return NotFound();
            return Ok(timer);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var success = await _timerRepository.DeleteTimerByIdAsync(id);
            if (!success)
                return NotFound();
            return NoContent();
        }
    }
}
