using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.Achievement;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;
using NovelryWebAPI.Repositories.Achievements;

namespace NovelryWebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AchievementsController : ControllerBase
    {
        private readonly IAchievementRepository _achievementRepository;

        public AchievementsController(IAchievementRepository achievementRepository)
        {
            _achievementRepository = achievementRepository;
        }

        [HttpGet]
        public Task<List<AchievementDto>> GetAll() => _achievementRepository.GetAllAsync();

        [HttpGet("{id}")]
        public Task<AchievementDto?> GetById(int id) => _achievementRepository.GetByIdAsync(id);

        [HttpGet("name/{name}")]
        public Task<AchievementDto?> GetByName(string name) =>
            _achievementRepository.GetByNameAsync(name);

        [HttpPost]
        public Task<AchievementDto?> Create(CreateAchievementDto achievement) =>
            _achievementRepository.CreateAsync(achievement);

        [HttpPut("{id}")]
        public Task<AchievementDto?> Update(int id, UpdateAchievementDto achievement) =>
            _achievementRepository.UpdateAsync(id, achievement);

        [HttpDelete("{id}")]
        public Task<bool> Delete(int id) => _achievementRepository.DeleteAsync(id);
    }
}
