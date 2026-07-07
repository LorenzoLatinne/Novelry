using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Timer
{
    public class CreateTimerDto
    {
        [Required]
        public int BookId { get; set; }

        [Required]
        public int UserId { get; set; }

        public DateTime StartTime { get; set; } = DateTime.UtcNow;
    }
}
