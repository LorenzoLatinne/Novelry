using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryDTO.DTOs.Genre
{
    public class UpdateGenreDto : CreateGenreDto
    {
        public int Id { get; set; }
    }
}
