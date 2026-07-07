using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.Genre;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Repositories.Genres
{
    public class GenreRepository : IGenreRepository
    {
        private readonly AppDbContext _context;

        public GenreRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GenreDto?> CreateGenreAsync(CreateGenreDto genre)
        {
            var entity = new Genre { Name = genre.Name };

            _context.Genres.Add(entity);
            await _context.SaveChangesAsync();

            return new GenreDto { Id = entity.GenreId, Name = entity.Name };
        }

        public async Task<List<GenreDto>> GetAllGenresAsync()
        {
            return await _context
                .Genres.Select(g => new GenreDto { Id = g.GenreId, Name = g.Name })
                .ToListAsync();
        }

        public async Task<GenreDto?> GetGenreByIdAsync(int id)
        {
            var genre = await _context.Genres.FindAsync(id);
            if (genre == null)
                return null;

            return new GenreDto { Id = genre.GenreId, Name = genre.Name };
        }

        public async Task<GenreDto?> GetGenreByNameAsync(string name)
        {
            var genre = await _context.Genres.FirstOrDefaultAsync(g =>
                g.Name.ToLower() == name.Trim().ToLower()
            );
            if (genre == null)
                return null;

            return new GenreDto { Id = genre.GenreId, Name = genre.Name };
        }

        public async Task<GenreDto?> UpdateGenreAsync(UpdateGenreDto genre)
        {
            var existing = await _context.Genres.FindAsync(genre.Id);
            if (existing == null)
                return null;

            if (!string.IsNullOrWhiteSpace(genre.Name))
                existing.Name = genre.Name;

            await _context.SaveChangesAsync();

            return new GenreDto { Id = existing.GenreId, Name = existing.Name };
        }

        public async Task<bool> DeleteGenreByIdAsync(int id)
        {
            var existing = await _context.Genres.FindAsync(id);
            if (existing == null)
                return false;

            _context.Genres.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
