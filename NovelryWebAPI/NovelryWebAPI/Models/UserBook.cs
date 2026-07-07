namespace NovelryWebAPI.Models
{
    public class UserBook
    {
        public int UserBookId { get; set; }

        public int UserId { get; set; }
        public int BookId { get; set; }

        public User? User { get; set; }
        public Book? Book { get; set; }

        public int CurrentPage { get; set; }
        public bool IsCompleted { get; set; }

        public UserBookStatus Status { get; set; } = UserBookStatus.WantToRead;
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }

    public enum UserBookStatus
    {
        WantToRead,
        Reading,
        Completed,
    }
}
