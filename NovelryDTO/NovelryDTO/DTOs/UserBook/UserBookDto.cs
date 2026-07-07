using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Book;
using NovelryDTO.Enums;

namespace NovelryDTO.DTOs.UserBook
{
    public class UserBookDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int BookId { get; set; }
        public BookDto? Book { get; set; }
        public int CurrentPage { get; set; }
        public bool IsCompleted { get; set; }
        public double PercentageCompleted =>
            Book != null && Book.TotalPages > 0 ? (double)CurrentPage / Book.TotalPages : 0;
        public string PercentageString
        {
            get
            {
                if (Book == null || Book.TotalPages == 0)
                    return "0%";

                double percentage = (double)CurrentPage / Book.TotalPages * 100;

                return $"{percentage:F0}% completed";
            }
        }

        public UserBookStatus Status { get; set; }
        public DateTime AddedAt { get; set; }
    }
}
