using System.ComponentModel.DataAnnotations;

namespace NovelryWebAPI.Models
{
    public class Genre
    {
        public int GenreId { get; set; }

        [Required]
        [StringLength(255, ErrorMessage = "The genre name can't be longer than 255 characters.")]
        public string Name { get; set; } = string.Empty;

        public ICollection<Book> Books { get; set; } = new List<Book>();
    }
}
