using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NovelryDTO.DTOs.Genre;
using NovelryWebAPI.Repositories.Genres;

namespace NovelryWebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class GenresController : ControllerBase
    {
        private readonly IGenreRepository _genreRepository;

        public GenresController(IGenreRepository genreRepopository)
        {
            _genreRepository = genreRepopository;
        }

        [HttpGet]
        public async Task<List<GenreDto>> GetAll()
        {
            return await _genreRepository.GetAllGenresAsync();
        }

        [HttpGet("{id}")]
        public async Task<GenreDto?> GetById(int id)
        {
            return await _genreRepository.GetGenreByIdAsync(id);
        }

        [HttpGet("name/{name}")]
        public async Task<GenreDto?> GetByName(string name)
        {
            return await _genreRepository.GetGenreByNameAsync(name);
        }

        [HttpPost]
        public async Task<GenreDto?> Create(CreateGenreDto genre)
        {
            return await _genreRepository.CreateGenreAsync(genre);
        }

        [HttpPut("{id}")]
        public async Task<GenreDto?> Update(int id, UpdateGenreDto genre)
        {
            if (id != genre.Id)
                return null;
            return await _genreRepository.UpdateGenreAsync(genre);
        }

        [HttpDelete("{id}")]
        public async Task<bool> Delete(int id)
        {
            return await _genreRepository.DeleteGenreByIdAsync(id);
        }
    }
}
