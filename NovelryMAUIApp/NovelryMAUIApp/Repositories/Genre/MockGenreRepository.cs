using NovelryDTO.DTOs.Genre;

namespace NovelryMAUIApp.Repositories.Genre
{
    public class MockGenreRepository : IGenreRepository
    {
        private readonly List<GenreDto> _genres = new()
        {
            new() { Id = 1, Name = "Fantasy" },
            new() { Id = 2, Name = "Political Satire" },
            new() { Id = 3, Name = "Classic" },
            new() { Id = 4, Name = "Holiday" },
            new() { Id = 5, Name = "Drama" },
            new() { Id = 6, Name = "Satire" },
            new() { Id = 7, Name = "War" },
            new() { Id = 8, Name = "Adventure" },
            new() { Id = 9, Name = "Romance" },
            new() { Id = 10, Name = "Coming-of-Age" },
            new() { Id = 11, Name = "Crime" },
            new() { Id = 12, Name = "Gothic" },
            new() { Id = 13, Name = "Historical" },
            new() { Id = 14, Name = "Kids" },
        };

        public Task<GenreDto?> CreateGenreAsync(CreateGenreDto genre)
        {
            if (genre == null)
                return Task.FromResult<GenreDto?>(null);

            var newGenre = new GenreDto();
            newGenre.Id = _genres.Any() ? _genres.Max(g => g.Id) + 1 : 1;
            newGenre.Name = genre.Name;

            _genres.Add(newGenre);
            return Task.FromResult(newGenre != null ? newGenre : null);
        }

        public Task<bool> DeleteGenreById(int id)
        {
            var genre = _genres.FirstOrDefault(g => g.Id == id);
            if (genre == null)
                return Task.FromResult(false);

            _genres.Remove(genre);
            return Task.FromResult(true);
        }

        public Task<List<GenreDto>> GetAllGenresAsync()
        {
            return Task.FromResult(_genres.ToList());
        }

        public Task<GenreDto?> GetGenreByIdAsync(int id)
        {
            var genre = _genres.FirstOrDefault(g => g.Id == id);
            return Task.FromResult(genre != null ? genre : null);
        }

        public Task<GenreDto?> GetGenreByNameAsync(string name)
        {
            var genre = _genres.FirstOrDefault(g =>
                g.Name.Equals(name, StringComparison.OrdinalIgnoreCase)
            );
            return Task.FromResult(genre != null ? genre : null);
        }

        public Task<GenreDto?> UpdateGenreAsync(UpdateGenreDto genre)
        {
            if (genre == null)
                return Task.FromResult<GenreDto?>(null);

            var existing = _genres.FirstOrDefault(g => g.Id == genre.Id);
            if (existing == null)
                return Task.FromResult<GenreDto?>(null);

            if (!string.IsNullOrEmpty(genre.Name))
                existing.Name = genre.Name;

            return Task.FromResult(existing != null ? existing : null);
        }
    }
}
