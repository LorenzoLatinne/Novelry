using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryWebAPI.ModelValidations;

namespace NovelryWebAPI.Models
{
    public class User
    {
        public int UserId { get; set; }

        [Required]
        [StringLength(50, ErrorMessage = "The username can't be longer than 50 characters.")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(100, ErrorMessage = "The email address can't be longer than 100 characters.")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(255, ErrorMessage = "The password can't be longer than 255 characters.")]
        public string PasswordHash { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        [Required]
        [DateValidation]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<UserBook> Books { get; set; } = new List<UserBook>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<UserAchievement> Achievements { get; set; } =
            new List<UserAchievement>();
        public ICollection<Timer> Timers { get; set; } = new List<Timer>();
    }
}
