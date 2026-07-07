using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Book
{
    public class UpdateBookDto : CreateBookDto
    {
        public int Id { get; set; }
    }
}
