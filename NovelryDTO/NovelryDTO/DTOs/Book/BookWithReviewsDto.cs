using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Book;
using NovelryDTO.DTOs.User;

namespace NovelryDTO.DTOs.Book
{
    public class BookWithReviewDto
    {
        public List<ReviewDto>? Reviews { get; set; }
        public BookDto? Book { get; set; }
        public string AverageRating { get; set; } = string.Empty;

        public ReviewDto? LatestReview =>
            Reviews?.OrderByDescending(r => r.CreatedAt).FirstOrDefault();
    }
}
