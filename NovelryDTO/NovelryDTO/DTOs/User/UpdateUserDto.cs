using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.User
{
    public class UpdateUserDto
    {
        public int Id { get; set; }

        [StringLength(50)]
        public string? Username { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(255)]
        public string? Password { get; set; }

        public string? ImageUrl { get; set; }
    }
}
