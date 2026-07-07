using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryWebAPI.ModelValidations;

namespace NovelryWebAPI.Models
{
    public class UserAchievement
    {
        public int UserAchievementId { get; set; }
        public int UserId { get; set; }
        public int AchievementId { get; set; }

        [Required]
        [DateValidation]
        public DateTime AchievedAt { get; set; } = DateTime.UtcNow;

        public Achievement? Achievement { get; set; }
        public User? User { get; set; }
    }
}
