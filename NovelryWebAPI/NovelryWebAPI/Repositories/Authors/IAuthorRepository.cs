using NovelryDTO.DTOs.Author;

namespace NovelryWebAPI.Repositories.Authors
{
    public interface IAuthorRepository
    {
        // Create
        Task<AuthorDto?> CreateAuthorAsync(CreateAuthorDto author);

        // Read
        Task<List<AuthorDto>> GetAllAuthorsAsync();
        Task<AuthorDto?> GetAuthorByIdAsync(int id);
        Task<AuthorDto?> GetAuthorByNameAsync(string name);

        // Update
        Task<AuthorDto?> UpdateAuthorAsync(UpdateAuthorDto author);

        // Delete
        Task<bool> DeleteAuthorByIdAsync(int id);
    }
}
