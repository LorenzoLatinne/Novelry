using NovelryDTO.DTOs.Book;
using NovelryMAUIApp.Repositories.Author;
using NovelryMAUIApp.Repositories.Book;
using NovelryMAUIApp.Repositories.Genre;

namespace NovelryMAUIApp.Repositories.Mock
{
    public class MockBookRepository : IBookRepository
    {
        private readonly IAuthorRepository _authorRepo;
        private readonly IGenreRepository _genreRepo;

        public MockBookRepository(IAuthorRepository authorRepo, IGenreRepository genreRepo)
        {
            _authorRepo = authorRepo;
            _genreRepo = genreRepo;
        }

        private readonly List<BookDto> _books = new()
        {
            new()
            {
                Id = 1,
                Title = "The Lord of the Rings",
                ISBN = "978-0261102385",
                TotalPages = 365,
                Authors = new()
                {
                    new()
                    {
                        Id = 1,
                        FirstName = "J.R.R",
                        LastName = "Tolkien",
                    },
                },
                Description =
                    "The Lord of the Rings by J.R.R. Tolkien is an epic high-fantasy tale set in the richly detailed world of Middle-earth. The story follows Frodo Baggins, a humble hobbit who inherits the One Ring, an ancient and powerful artifact forged by the dark lord Sauron to control all other Rings of Power.\r\n\r\nTo prevent Sauron’s return to full strength, Frodo must embark on a perilous journey to destroy the Ring by casting it into the volcanic Mount Doom, where it was originally forged. He is joined by a fellowship of companions — including Aragorn, Gandalf, Legolas, Gimli, Boromir, and his hobbit friends Sam, Merry, and Pippin — who represent the unity of different races against the shadow of evil.\r\n\r\nThe saga spans three volumes — The Fellowship of the Ring, The Two Towers, and The Return of the King — and explores themes of friendship, courage, sacrifice, and the corrupting influence of power. Ultimately, the quest culminates in the defeat of Sauron and the end of the Third Age, ushering in a new era of peace for Middle-earth.",
                Genres = new()
                {
                    new() { Id = 1, Name = "Fantasy" },
                },
                ImageUrl = "lordoftheringscover",
                PublishedDate = new(1954, 7, 29),
            },
            new()
            {
                Id = 2,
                Title = "Animal Farm",
                ISBN = "978-0451526342",
                TotalPages = 112,
                Authors = new()
                {
                    new()
                    {
                        Id = 2,
                        FirstName = "George",
                        LastName = "Orwell",
                    },
                },
                Description =
                    "Animal Farm by George Orwell is a political allegory that satirizes the rise of totalitarianism, particularly the events leading up to and following the Russian Revolution of 1917.\r\n\r\nThe story takes place on Manor Farm, where the animals, led by the pigs Snowball and Napoleon, rebel against their human farmer, Mr. Jones, seeking to create a society where all animals are equal and free. They rename the farm Animal Farm and establish commandments based on the ideal of equality.\r\n\r\nHowever, as time passes, the pigs begin to assume power and privilege, with Napoleon gradually becoming a tyrant. The original principles of equality are corrupted, and the famous commandment — “All animals are equal, but some animals are more equal than others” — exposes the hypocrisy and betrayal of the revolution.\r\n\r\nThrough this fable, Orwell delivers a sharp critique of corruption, propaganda, and the abuse of power, illustrating how noble ideals can be twisted by those who seek control.",
                Genres = new()
                {
                    new() { Id = 6, Name = "Satire" },
                },
                ImageUrl = "animalfarmcover",
                PublishedDate = new(1945, 8, 17),
            },
            new()
            {
                Id = 3,
                Title = "A Christmas Carol",
                ISBN = "978-0486268651",
                TotalPages = 104,
                Authors = new()
                {
                    new()
                    {
                        Id = 3,
                        FirstName = "Charles",
                        LastName = "Dickens",
                    },
                },
                Description =
                    "A Christmas Carol tells the story of Ebenezer Scrooge, a miserly old man who despises Christmas and human kindness. On Christmas Eve, he is visited by the ghosts of Christmas Past, Present, and Yet to Come, who reveal to him the impact of his greed and the possibility of redemption.",
                Genres = new()
                {
                    new() { Id = 3, Name = "Classic" },
                    new() { Id = 4, Name = "Holiday" },
                },
                ImageUrl = "achristmascarolcover",
                PublishedDate = new(1843, 12, 19),
            },
            new()
            {
                Id = 4,
                Title = "Alice in Wonderland",
                ISBN = "978-1503250217",
                TotalPages = 200,
                Authors = new()
                {
                    new()
                    {
                        Id = 4,
                        FirstName = "Lewis",
                        LastName = "Carroll",
                    },
                },
                Description =
                    "Alice's Adventures in Wonderland follows a young girl named Alice who falls through a rabbit hole into a fantastical world filled with eccentric characters, nonsensical logic, and whimsical adventures.",
                Genres = new()
                {
                    new() { Id = 1, Name = "Fantasy" },
                },
                ImageUrl = "aliceinwonderlandcover",
                PublishedDate = new(1865, 11, 26),
            },
            new()
            {
                Id = 5,
                Title = "A Prayer for Owen Meany",
                ISBN = "978-0062204226",
                TotalPages = 617,
                Authors = new()
                {
                    new()
                    {
                        Id = 5,
                        FirstName = "John",
                        LastName = "Irving",
                    },
                },
                Description =
                    "A Prayer for Owen Meany tells the story of two childhood friends in New Hampshire — one of whom, Owen Meany, believes he is an instrument of God. The novel explores faith, destiny, and friendship through Owen’s strange yet powerful life.",
                Genres = new()
                {
                    new() { Id = 5, Name = "Drama" },
                },
                ImageUrl = "aprayerforowenmeanycover",
                PublishedDate = new(1989, 3, 1),
            },
            new()
            {
                Id = 6,
                Title = "Catch-22",
                ISBN = "978-1451626650",
                TotalPages = 453,
                Authors = new()
                {
                    new()
                    {
                        Id = 6,
                        FirstName = "Joseph",
                        LastName = "Heller",
                    },
                },
                Description =
                    "Catch-22 is a satirical war novel set during World War II that follows Captain John Yossarian, a U.S. Army Air Force bombardier who struggles to maintain his sanity while surrounded by bureaucratic absurdity and the paradoxical logic of war.",
                Genres = new()
                {
                    new() { Id = 6, Name = "Satire" },
                    new() { Id = 7, Name = "War" },
                },
                ImageUrl = "catch22cover",
                PublishedDate = new(1961, 11, 10),
            },
            new()
            {
                Id = 7,
                Title = "The Chronicles of Narnia",
                ISBN = "978-0066238500",
                TotalPages = 767,
                Authors = new()
                {
                    new()
                    {
                        Id = 7,
                        FirstName = "C.S.",
                        LastName = "Lewis",
                    },
                },
                Description =
                    "The Chronicles of Narnia is a seven-book fantasy series that follows children who enter the magical land of Narnia, ruled by the noble lion Aslan. The series explores themes of faith, courage, and the battle between good and evil.",
                Genres = new()
                {
                    new() { Id = 1, Name = "Fantasy" },
                },
                ImageUrl = "chroniclesofnarniacover",
                PublishedDate = new(1950, 10, 16),
            },
            new()
            {
                Id = 8,
                Title = "Moby-Dick",
                ISBN = "978-1503280788",
                TotalPages = 585,
                Authors = new()
                {
                    new()
                    {
                        Id = 8,
                        FirstName = "Herman",
                        LastName = "Melville",
                    },
                },
                Description =
                    "Moby-Dick tells the tale of Captain Ahab’s obsessive quest to kill the white whale, Moby Dick. Through the eyes of Ishmael, the story explores obsession, revenge, fate, and the struggle between man and nature.",
                Genres = new()
                {
                    new() { Id = 8, Name = "Adventure" },
                    new() { Id = 3, Name = "Classic" },
                },
                ImageUrl = "mobydickcover",
                PublishedDate = new(1851, 10, 18),
            },
            new()
            {
                Id = 9,
                Title = "Pride and Prejudice",
                ISBN = "978-1503290565",
                TotalPages = 279,
                Authors = new()
                {
                    new()
                    {
                        Id = 9,
                        FirstName = "Jane",
                        LastName = "Austen",
                    },
                },
                Description =
                    "Pride and Prejudice centers on Elizabeth Bennet as she navigates issues of manners, upbringing, morality, and marriage in early 19th-century England. Her relationship with the proud Mr. Darcy remains one of literature’s most beloved romances.",
                Genres = new()
                {
                    new() { Id = 9, Name = "Romance" },
                    new() { Id = 3, Name = "Classic" },
                },
                ImageUrl = "prideandprejudicecover",
                PublishedDate = new(1813, 1, 28),
            },
            new()
            {
                Id = 10,
                Title = "Slaughterhouse-Five",
                ISBN = "978-0385333849",
                TotalPages = 215,
                Authors = new()
                {
                    new()
                    {
                        Id = 10,
                        FirstName = "Kurt",
                        LastName = "Vonnegut",
                    },
                },
                Description =
                    "Slaughterhouse-Five follows Billy Pilgrim, a soldier who becomes 'unstuck in time' after surviving the bombing of Dresden during World War II. The novel combines science fiction, satire, and anti-war commentary.",
                Genres = new()
                {
                    new() { Id = 7, Name = "War" },
                    new() { Id = 6, Name = "Satire" },
                },
                ImageUrl = "slaughterhousefivecover",
                PublishedDate = new(1969, 3, 31),
            },
            new()
            {
                Id = 11,
                Title = "The Adventures of Huckleberry Finn",
                ISBN = "978-0486280615",
                TotalPages = 366,
                Authors = new()
                {
                    new()
                    {
                        Id = 11,
                        FirstName = "Mark",
                        LastName = "Twain",
                    },
                },
                Description =
                    "The Adventures of Huckleberry Finn follows Huck and Jim, a runaway slave, as they journey down the Mississippi River. The novel explores themes of race, freedom, and moral growth.",
                Genres = new()
                {
                    new() { Id = 8, Name = "Adventure" },
                    new() { Id = 3, Name = "Classic" },
                },
                ImageUrl = "theadventuresofhuckleberryfinncover",
                PublishedDate = new(1884, 12, 10),
            },
            new()
            {
                Id = 12,
                Title = "The Catcher in the Rye",
                ISBN = "978-0316769488",
                TotalPages = 277,
                Authors = new()
                {
                    new()
                    {
                        Id = 12,
                        FirstName = "J.D.",
                        LastName = "Salinger",
                    },
                },
                Description =
                    "The Catcher in the Rye follows Holden Caulfield, a disillusioned teenager wandering New York City after being expelled from school. The novel captures teenage alienation and the search for authenticity.",
                Genres = new()
                {
                    new() { Id = 10, Name = "Coming-of-Age" },
                },
                ImageUrl = "thecatcherintherye",
                PublishedDate = new(1951, 7, 16),
            },
            new()
            {
                Id = 13,
                Title = "The Godfather",
                ISBN = "978-0451205766",
                TotalPages = 448,
                Authors = new()
                {
                    new()
                    {
                        Id = 13,
                        FirstName = "Mario",
                        LastName = "Puzo",
                    },
                },
                Description =
                    "The Godfather follows the powerful Corleone crime family in postwar America, led by Don Vito Corleone and later his son Michael. It explores loyalty, power, and corruption within organized crime.",
                Genres = new()
                {
                    new() { Id = 11, Name = "Crime" },
                    new() { Id = 5, Name = "Drama" },
                },
                ImageUrl = "thegodfathercover",
                PublishedDate = new(1969, 3, 10),
            },
            new()
            {
                Id = 14,
                Title = "The Great Gatsby",
                ISBN = "978-0743273565",
                TotalPages = 180,
                Authors = new()
                {
                    new()
                    {
                        Id = 14,
                        FirstName = "F. Scott",
                        LastName = "Fitzgerald",
                    },
                },
                Description =
                    "The Great Gatsby is a tragic tale of wealth, obsession, and the American Dream. Narrated by Nick Carraway, it tells the story of Jay Gatsby’s doomed love for Daisy Buchanan amid the decadence of the 1920s.",
                Genres = new()
                {
                    new() { Id = 3, Name = "Classic" },
                },
                ImageUrl = "thegreatgatsbycover",
                PublishedDate = new(1925, 4, 10),
            },
            new()
            {
                Id = 15,
                Title = "The Old Man and the Sea",
                ISBN = "978-0684801223",
                TotalPages = 127,
                Authors = new()
                {
                    new()
                    {
                        Id = 15,
                        FirstName = "Ernest",
                        LastName = "Hemingway",
                    },
                },
                Description =
                    "The Old Man and the Sea tells the story of Santiago, an aging Cuban fisherman who struggles with a giant marlin far out in the Gulf Stream. It explores perseverance, dignity, and human endurance.",
                Genres = new()
                {
                    new() { Id = 3, Name = "Classic" },
                    new() { Id = 8, Name = "Adventure" },
                },
                ImageUrl = "theoldmanandtheseacover",
                PublishedDate = new(1952, 9, 1),
            },
            new()
            {
                Id = 16,
                Title = "The Picture of Dorian Gray",
                ISBN = "978-0141439570",
                TotalPages = 254,
                Authors = new()
                {
                    new()
                    {
                        Id = 16,
                        FirstName = "Oscar",
                        LastName = "Wilde",
                    },
                },
                Description =
                    "The Picture of Dorian Gray tells the story of a young man whose portrait ages and decays while he remains forever youthful, reflecting the consequences of vanity and moral corruption.",
                Genres = new()
                {
                    new() { Id = 3, Name = "Classic" },
                    new() { Id = 14, Name = "Gothic" },
                },
                ImageUrl = "thepictureofdoriangraycover",
                PublishedDate = new(1890, 6, 20),
            },
            new()
            {
                Id = 17,
                Title = "The Talented Mr. Ripley",
                ISBN = "978-0393332148",
                TotalPages = 288,
                Authors = new()
                {
                    new()
                    {
                        Id = 17,
                        FirstName = "Patricia",
                        LastName = "Highsmith",
                    },
                },
                Description =
                    "The Talented Mr. Ripley follows Tom Ripley, a young man who becomes entangled in deceit and murder while impersonating another person. It explores themes of identity, morality, and obsession.",
                Genres = new()
                {
                    new() { Id = 3, Name = "Crime" },
                    new() { Id = 5, Name = "Drama" },
                },
                ImageUrl = "thetalentedmrripley",
                PublishedDate = new(1955, 11, 16),
            },
            new()
            {
                Id = 18,
                Title = "To Kill a Mockingbird",
                ISBN = "978-0061120084",
                TotalPages = 281,
                Authors = new()
                {
                    new()
                    {
                        Id = 18,
                        FirstName = "Harper",
                        LastName = "Lee",
                    },
                },
                Description =
                    "To Kill a Mockingbird follows Scout Finch and her father, lawyer Atticus Finch, as he defends a Black man accused of raping a white woman in the racially charged American South. It explores morality, prejudice, and compassion.",
                Genres = new()
                {
                    new() { Id = 5, Name = "Drama" },
                    new() { Id = 15, Name = "Historical" },
                },
                ImageUrl = "tokillamockingbirdcover",
                PublishedDate = new(1960, 7, 11),
            },
            new()
            {
                Id = 19,
                Title = "Winnie the Pooh",
                ISBN = "978-0142404676",
                TotalPages = 160,
                Authors = new()
                {
                    new()
                    {
                        Id = 19,
                        FirstName = "A.A.",
                        LastName = "Milne",
                    },
                },
                Description =
                    "Winnie the Pooh follows the adventures of the lovable bear Pooh and his friends in the Hundred Acre Wood. The stories celebrate friendship, curiosity, and the innocence of childhood.",
                Genres = new()
                {
                    new() { Id = 14, Name = "Kids" },
                },
                ImageUrl = "winniethepoohcover",
                PublishedDate = new(1926, 10, 14),
            },
            new()
            {
                Id = 20,
                Title = "Harry Potter and the Philosopher's Stone",
                ISBN = "978-0747532699",
                TotalPages = 223,
                Authors = new()
                {
                    new()
                    {
                        Id = 20,
                        FirstName = "J.K.",
                        LastName = "Rowling",
                    },
                },
                Description =
                    "Harry Potter and the Philosopher’s Stone introduces Harry, a young boy who discovers he is a wizard and attends Hogwarts School of Witchcraft and Wizardry, uncovering secrets about his past and destiny.",
                Genres = new()
                {
                    new() { Id = 1, Name = "Fantasy" },
                    new() { Id = 10, Name = "Coming-of-Age" },
                },
                ImageUrl = "harrypotterandthephilosphersstonecover",
                PublishedDate = new(1997, 6, 26),
            },
        };

        public async Task<BookDto?> CreateBookAsync(CreateBookDto book)
        {
            var newBook = new BookDto();
            newBook.Id = _books.Any() ? _books.Max(b => b.Id) + 1 : 1;
            newBook.Title = book.Title;
            newBook.ISBN = book.ISBN;
            newBook.TotalPages = book.TotalPages;

            foreach (int id in book.AuthorIds)
            {
                var author = await _authorRepo.GetAuthorByIdAsync(id);
                if (author != null)
                    newBook.Authors.Add(author);
            }
            foreach (int id in book.GenreIds)
            {
                var genre = await _genreRepo.GetGenreByIdAsync(id);
                if (genre != null)
                    newBook.Genres.Add(genre);
            }

            newBook.ImageUrl = book.ImageUrl;
            newBook.PublishedDate = book.PublishedDate;

            _books.Add(newBook);
            return newBook;
        }

        public Task<bool> DeleteBookByIdAsync(int id)
        {
            var exists = _books.FirstOrDefault(b => b.Id == id);
            if (exists == null)
                return Task.FromResult(false);

            _books.Remove(exists);
            return Task.FromResult(true);
        }

        public Task<List<BookDto>> GetAllBooksAsync()
        {
            return Task.FromResult(_books.ToList());
        }

        public Task<BookDto?> GetBookByIdAsync(int id)
        {
            var book = _books.FirstOrDefault(b => b.Id == id);
            return Task.FromResult(book != null ? book : null);
        }

        public Task<BookDto?> GetBookByTitleAsync(string title)
        {
            var book = _books.FirstOrDefault(b =>
                b.Title.Equals(title, StringComparison.OrdinalIgnoreCase)
            );
            return Task.FromResult(book != null ? book : null);
        }

        public Task<List<BookDto>> GetBooksByAuthorAsync(string authorName)
        {
            var books = _books
                .Where(b =>
                    b.Authors.Any(a =>
                        $"{a.FirstName} {a.LastName}"
                            .Trim()
                            .Equals(authorName.Trim(), StringComparison.OrdinalIgnoreCase)
                    )
                )
                .ToList();
            return Task.FromResult(books);
        }

        public Task<List<BookDto>> GetBooksByGenreAsync(string genreName)
        {
            var books = _books
                .Where(b =>
                    b.Genres.Any(g =>
                        g.Name.Equals(genreName.Trim(), StringComparison.OrdinalIgnoreCase)
                    )
                )
                .ToList();
            return Task.FromResult(books);
        }

        public async Task<BookDto?> UpdateBookAsync(UpdateBookDto book)
        {
            if (book == null)
                return null;

            var existing = _books.FirstOrDefault(b => b.Id == book.Id);
            if (existing == null)
                return null;

            if (!string.IsNullOrWhiteSpace(book.ISBN))
                existing.ISBN = book.ISBN;
            if (!string.IsNullOrWhiteSpace(book.Title))
                existing.Title = book.Title;
            if (book.TotalPages > 0)
                existing.TotalPages = book.TotalPages;
            if (!string.IsNullOrWhiteSpace(book.ImageUrl))
                existing.ImageUrl = book.ImageUrl;
            if (book.PublishedDate != default)
                existing.PublishedDate = book.PublishedDate;

            if (book.AuthorIds?.Any() == true)
            {
                existing.Authors.Clear();
                foreach (int id in book.AuthorIds)
                {
                    var author = await _authorRepo.GetAuthorByIdAsync(id);
                    if (author != null)
                        existing.Authors.Add(author);
                }
            }

            if (book.GenreIds?.Any() == true)
            {
                existing.Genres.Clear();
                foreach (int id in book.GenreIds)
                {
                    var genre = await _genreRepo.GetGenreByIdAsync(id);
                    if (genre != null)
                        existing.Genres.Add(genre);
                }
            }

            return existing;
        }

        public Task<BookDto?> GetBookByISBNAsync(string isbn)
        {
            var book = _books.FirstOrDefault(b =>
                b.ISBN.Equals(isbn, StringComparison.OrdinalIgnoreCase)
            );
            return Task.FromResult(book);
        }

        public Task<List<BookWithReviewDto>> GetLatestBooksWithReviewsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<List<BookWithReviewDto>> GetAllBooksWithReviewsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<List<BookWithReviewDto>> SearchBooksAsync(string query)
        {
            throw new NotImplementedException();
        }
    }
}
