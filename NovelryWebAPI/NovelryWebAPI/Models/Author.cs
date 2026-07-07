using System.ComponentModel.DataAnnotations;

namespace NovelryWebAPI.Models
{
    public class Author
    {
        public int AuthorId { get; set; }

        [Required]
        [StringLength(
            100,
            ErrorMessage = "The first name of an author may not be longer than 100 characters."
        )]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(
            100,
            ErrorMessage = "The last name of an author may not be longer than 100 characters."
        )]
        public string LastName { get; set; } = string.Empty;

        public ICollection<Book> Books { get; set; } = new List<Book>();
    }
}
