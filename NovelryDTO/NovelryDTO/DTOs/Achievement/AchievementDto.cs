using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MauiIcons.Core;

namespace NovelryDTO.DTOs.Achievement
{
    public class AchievementDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string TriggerType { get; set; } = string.Empty;
        public int TargetValue { get; set; }
    }
}
