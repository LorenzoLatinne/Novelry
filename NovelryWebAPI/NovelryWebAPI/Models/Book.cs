using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using NovelryWebAPI.ModelValidations;

namespace NovelryWebAPI.Models
{
    public class Book
    {
        public int BookId { get; set; }

        [Required]
        [StringLength(
            255,
            ErrorMessage = "The title of the book may not be longer than 255 characters."
        )]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Range(0, 15000, ErrorMessage = "The amount of pages may not be bigger than 15000.")]
        public int TotalPages { get; set; }

        public string ISBN { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        [DateValidation]
        public DateOnly PublishedDate { get; set; }

        public string? ImageUrl { get; set; }

        public ICollection<Author>? Authors { get; set; } = new List<Author>();
        public ICollection<Genre> Genres { get; set; } = new List<Genre>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<UserBook> UserBooks { get; set; } = new List<UserBook>();
        public ICollection<Timer> Timers { get; set; } = new List<Timer>();
    }
}
