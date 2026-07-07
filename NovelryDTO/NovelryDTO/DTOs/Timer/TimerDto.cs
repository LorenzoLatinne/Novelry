using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Timer
{
    public class TimerDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int BookId { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public double? DurationMinutes =>
            (StartTime.HasValue && EndTime.HasValue)
                ? (EndTime.Value - StartTime.Value).TotalMinutes
                : null;
    }
}
