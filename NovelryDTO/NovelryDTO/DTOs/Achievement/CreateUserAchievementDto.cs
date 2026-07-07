using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Achievement
{
    public class CreateUserAchievementDto
    {
        [Required]
        public int AchievementId { get; set; }

        [Required]
        public int UserId { get; set; }
    }
}
