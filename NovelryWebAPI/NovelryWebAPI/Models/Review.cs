using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryWebAPI.ModelValidations;

namespace NovelryWebAPI.Models
{
    public class Review
    {
        public int ReviewId { get; set; }
        public int UserId { get; set; }
        public int BookId { get; set; }

        public User? User { get; set; }
        public Book? Book { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "The rating must be a number between 1 and 5.")]
        public double Rating { get; set; }

        [Required]
        [StringLength(500, ErrorMessage = "The comment can't be longer than 500 characters.")]
        public string Comment { get; set; } = string.Empty;

        [Required]
        [DateValidation]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
