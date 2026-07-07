using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryWebAPI.ModelValidations;

namespace NovelryWebAPI.Models
{
    public class Timer
    {
        public int TimerId { get; set; }
        public int UserId { get; set; }
        public int BookId { get; set; }

        public User? User { get; set; }
        public Book? Book { get; set; }

        [DateValidation]
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        public TimeSpan? Duration =>
            StartTime.HasValue && EndTime.HasValue ? EndTime.Value - StartTime.Value : null;
    }
}
