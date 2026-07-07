using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Achievement
{
    public class UserAchievementDto
    {
        public int Id { get; set; }
        public int AchievementId { get; set; }
        public DateTime AchievedAt { get; set; }

        public int UserId { get; set; }
    }
}
