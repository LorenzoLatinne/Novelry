using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Author;
using NovelryDTO.DTOs.Genre;

namespace NovelryDTO.DTOs.Book
{
    public class BookDto
    {
        public int Id { get; set; }
        public string ISBN { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TotalPages { get; set; }
        public string? ImageUrl { get; set; }
        public DateOnly? PublishedDate { get; set; }

        public List<AuthorDto> Authors { get; set; } = new();
        public List<GenreDto> Genres { get; set; } = new();
    }
}
