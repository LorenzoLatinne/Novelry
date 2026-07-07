using Microsoft.EntityFrameworkCore;
using NovelryWebAPI.Models;

namespace NovelryWebAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Achievement> Achievements { get; set; } = default!;
        public DbSet<Author> Authors { get; set; } = default!;
        public DbSet<Book> Books { get; set; } = default!;
        public DbSet<Genre> Genres { get; set; } = default!;
        public DbSet<Models.Timer> Timers { get; set; } = default!;
        public DbSet<Review> Reviews { get; set; } = default!;
        public DbSet<User> Users { get; set; } = default!;
        public DbSet<UserAchievement> UserAchievements { get; set; } = default!;
        public DbSet<UserBook> UserBooks { get; set; } = default!;
    }
}
