using NovelryDTO.DTOs.Genre;

namespace NovelryMAUIApp.Repositories.Genre
{
    public interface IGenreRepository
    {
        // Create
        Task<GenreDto?> CreateGenreAsync(CreateGenreDto genre);

        // Read
        Task<List<GenreDto>> GetAllGenresAsync();
        Task<GenreDto?> GetGenreByIdAsync(int id);
        Task<GenreDto?> GetGenreByNameAsync(string name);

        // Update
        Task<GenreDto?> UpdateGenreAsync(UpdateGenreDto genre);

        // Delete
        Task<bool> DeleteGenreById(int id);
    }
}
