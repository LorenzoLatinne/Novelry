using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryWebAPI.Models
{
    public class Achievement
    {
        public int AchievementId { get; set; }

        [Required]
        [StringLength(
            100,
            ErrorMessage = "The length of an achievement can't be longer than 100 characters."
        )]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(
            500,
            ErrorMessage = "The description of an achievement can't be longer than 500 characters."
        )]
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }

        public string TriggerType { get; set; } = string.Empty;
        public int TargetValue { get; set; }

        public ICollection<UserAchievement> Users { get; set; } = new List<UserAchievement>();
    }
}
