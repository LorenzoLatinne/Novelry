using Microsoft.EntityFrameworkCore;
using NovelryDTO.DTOs.Author;
using NovelryWebAPI.Data;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Repositories.Authors
{
    public class AuthorRepository : IAuthorRepository
    {
        private readonly AppDbContext _context;

        public AuthorRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AuthorDto?> CreateAuthorAsync(CreateAuthorDto author)
        {
            var entity = new Author { FirstName = author.FirstName, LastName = author.LastName };

            _context.Authors.Add(entity);
            await _context.SaveChangesAsync();

            return new AuthorDto
            {
                Id = entity.AuthorId,
                FirstName = entity.FirstName,
                LastName = entity.LastName,
            };
        }

        public async Task<bool> DeleteAuthorByIdAsync(int id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
                return false;

            _context.Authors.Remove(author);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AuthorDto>> GetAllAuthorsAsync()
        {
            return await _context
                .Authors.Select(a => new AuthorDto
                {
                    Id = a.AuthorId,
                    FirstName = a.FirstName,
                    LastName = a.LastName,
                })
                .ToListAsync();
        }

        public async Task<AuthorDto?> GetAuthorByIdAsync(int id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
                return null;

            return new AuthorDto
            {
                Id = author.AuthorId,
                FirstName = author.FirstName,
                LastName = author.LastName,
            };
        }

        public async Task<AuthorDto?> GetAuthorByNameAsync(string name)
        {
            var author = await _context.Authors.FirstOrDefaultAsync(a =>
                (a.FirstName + " " + a.LastName).Trim().ToLower() == name.Trim().ToLower()
            );

            if (author == null)
                return null;

            return new AuthorDto
            {
                Id = author.AuthorId,
                FirstName = author.FirstName,
                LastName = author.LastName,
            };
        }

        public async Task<AuthorDto?> UpdateAuthorAsync(UpdateAuthorDto author)
        {
            var existing = await _context.Authors.FindAsync(author.Id);
            if (existing == null)
                return null;

            if (!string.IsNullOrWhiteSpace(author.FirstName))
                existing.FirstName = author.FirstName;

            if (!string.IsNullOrWhiteSpace(author.LastName))
                existing.LastName = author.LastName;

            await _context.SaveChangesAsync();

            return new AuthorDto
            {
                Id = existing.AuthorId,
                FirstName = existing.FirstName,
                LastName = existing.LastName,
            };
        }
    }
}
