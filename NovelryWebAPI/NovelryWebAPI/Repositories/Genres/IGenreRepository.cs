using NovelryDTO.DTOs.Genre;

namespace NovelryWebAPI.Repositories.Genres
{
    public interface IGenreRepository
    {
        Task<GenreDto?> CreateGenreAsync(CreateGenreDto genre);
        Task<List<GenreDto>> GetAllGenresAsync();
        Task<GenreDto?> GetGenreByIdAsync(int id);
        Task<GenreDto?> GetGenreByNameAsync(string name);
        Task<GenreDto?> UpdateGenreAsync(UpdateGenreDto genre);
        Task<bool> DeleteGenreByIdAsync(int id);
    }
}
