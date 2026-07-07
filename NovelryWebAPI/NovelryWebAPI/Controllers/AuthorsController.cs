using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NovelryDTO.DTOs.Author;
using NovelryWebAPI.Repositories.Authors;

namespace NovelryWebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthorsController : ControllerBase
    {
        private readonly IAuthorRepository _authorRepository;

        public AuthorsController(IAuthorRepository authorRepository)
        {
            _authorRepository = authorRepository;
        }

        [HttpGet]
        public async Task<List<AuthorDto>> GetAll()
        {
            return await _authorRepository.GetAllAuthorsAsync();
        }

        [HttpGet("{id}")]
        public async Task<AuthorDto?> GetById(int id)
        {
            return await _authorRepository.GetAuthorByIdAsync(id);
        }

        [HttpGet("name/{name}")]
        public async Task<AuthorDto?> GetByName(string name)
        {
            return await _authorRepository.GetAuthorByNameAsync(name);
        }

        [HttpPost]
        public async Task<AuthorDto?> Create(CreateAuthorDto author)
        {
            return await _authorRepository.CreateAuthorAsync(author);
        }

        [HttpPut("{id}")]
        public async Task<AuthorDto?> Update(int id, UpdateAuthorDto author)
        {
            if (id != author.Id)
                return null;
            return await _authorRepository.UpdateAuthorAsync(author);
        }

        [HttpDelete("{id}")]
        public async Task<bool> Delete(int id)
        {
            return await _authorRepository.DeleteAuthorByIdAsync(id);
        }
    }
}
