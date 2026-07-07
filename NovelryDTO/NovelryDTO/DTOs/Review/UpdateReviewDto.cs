using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Book
{
    public class UpdateReviewDto
    {
        [Required]
        public int Id { get; set; }

        [Range(1, 5)]
        public double? Rating { get; set; }

        [StringLength(500)]
        public string? Comment { get; set; }
    }
}
