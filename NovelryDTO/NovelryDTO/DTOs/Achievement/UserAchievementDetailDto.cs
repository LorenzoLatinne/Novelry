using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Achievement
{
    public class UserAchievementDetailDto : UserAchievementDto
    {
        public AchievementDto? Achievement { get; set; }
    }
}
