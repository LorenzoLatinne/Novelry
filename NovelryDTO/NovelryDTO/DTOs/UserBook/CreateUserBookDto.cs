using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.Enums;

namespace NovelryDTO.DTOs.UserBook
{
    public class CreateUserBookDto
    {
        [Required]
        public int BookId { get; set; }

        [Required]
        public int UserId { get; set; }

        public UserBookStatus Status { get; set; } = UserBookStatus.WantToRead;
    }
}
