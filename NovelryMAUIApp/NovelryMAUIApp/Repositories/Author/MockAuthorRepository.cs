using NovelryDTO.DTOs.Author;
using NovelryMAUIApp.Repositories.Author;

namespace NovelryMAUIApp.Repositories.Mock
{
    public class MockAuthorRepository : IAuthorRepository
    {
        private readonly List<AuthorDto> _authors = new()
        {
            new()
            {
                Id = 1,
                FirstName = "J.R.R",
                LastName = "Tolkien",
            },
            new()
            {
                Id = 2,
                FirstName = "George",
                LastName = "Orwell",
            },
        };

        public Task<AuthorDto?> CreateAuthorAsync(CreateAuthorDto author)
        {
            var newAuthor = new AuthorDto();

            if (!string.IsNullOrWhiteSpace(author.FirstName))
                newAuthor.FirstName = author.FirstName;
            if (!string.IsNullOrWhiteSpace(author.LastName))
                newAuthor.LastName = author.LastName;

            newAuthor.Id = _authors.Any() ? _authors.Max(a => a.Id) + 1 : 1;

            _authors.Add(newAuthor);
            return Task.FromResult<AuthorDto?>(newAuthor);
        }

        public Task<bool> DeleteAuthorByIdAsync(int id)
        {
            var author = _authors.FirstOrDefault(a => a.Id == id);
            if (author == null)
                return Task.FromResult(false);

            _authors.Remove(author);
            return Task.FromResult(true);
        }

        public Task<List<AuthorDto>> GetAllAuthorsAsync()
        {
            return Task.FromResult(_authors.ToList());
        }

        public Task<AuthorDto?> GetAuthorByIdAsync(int id)
        {
            var author = _authors.FirstOrDefault(a => a.Id == id);
            return Task.FromResult((author == null) ? null : author);
        }

        public Task<AuthorDto?> GetAuthorByNameAsync(string name)
        {
            var author = _authors.FirstOrDefault(a =>
                $"{a.FirstName} {a.LastName}"
                    .Trim()
                    .Equals(name.Trim(), StringComparison.OrdinalIgnoreCase)
            );
            return Task.FromResult(author == null ? null : author);
        }

        public Task<AuthorDto?> UpdateAuthorAsync(UpdateAuthorDto? author)
        {
            if (author == null)
                return Task.FromResult<AuthorDto?>(null);

            var existing = _authors.FirstOrDefault(a => a.Id == author.Id);
            if (existing == null)
                return Task.FromResult<AuthorDto?>(null);

            if (!string.IsNullOrWhiteSpace(author.FirstName))
                existing.FirstName = author.FirstName;

            if (!string.IsNullOrWhiteSpace(author.LastName))
                existing.LastName = author.LastName;

            return Task.FromResult(existing != null ? existing : null);
        }
    }
}
