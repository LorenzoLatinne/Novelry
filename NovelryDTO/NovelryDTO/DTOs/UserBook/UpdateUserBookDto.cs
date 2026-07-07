using System.ComponentModel.DataAnnotations;
using NovelryDTO.Enums;

namespace NovelryDTO.DTOs.UserBook
{
    public class UpdateUserBookDto
    {
        [Required]
        public int Id { get; set; }
        public int? CurrentPage { get; set; }
        public bool? IsCompleted { get; set; }
        public UserBookStatus? Status { get; set; }
    }
}
