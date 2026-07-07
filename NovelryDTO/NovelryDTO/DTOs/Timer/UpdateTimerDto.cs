using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Timer
{
    public class UpdateTimerDto
    {
        [Required]
        public int Id { get; set; }
        public DateTime EndTime { get; set; } = DateTime.UtcNow;
    }
}
