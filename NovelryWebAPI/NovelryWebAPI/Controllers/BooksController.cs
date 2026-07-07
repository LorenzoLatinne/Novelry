using Microsoft.AspNetCore.Mvc;
using NovelryDTO.DTOs.Book;
using NovelryWebAPI.Repositories.Books;

namespace NovelryWebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class BooksController(IBookRepository bookRepository) : ControllerBase
    {
        private readonly IBookRepository _bookRepository = bookRepository;

        [HttpGet]
        public async Task<IEnumerable<BookDto>> Get()
        {
            return await _bookRepository.GetAllBooksAsync();
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<BookDto>> GetById(int id)
        {
            var book = await _bookRepository.GetBookByIdAsync(id);
            if (book == null)
                return NotFound();
            return book;
        }

        [HttpGet("isbn/{isbn}")]
        public async Task<ActionResult<BookDto>> GetByISBN(string isbn)
        {
            var book = await _bookRepository.GetBookByISBNAsync(isbn);
            if (book == null)
                return NotFound();
            return book;
        }

        [HttpGet("title/{title}")]
        public async Task<ActionResult<BookDto>> GetByTitle(string title)
        {
            var book = await _bookRepository.GetBookByTitleAsync(title);
            if (book == null)
                return NotFound();
            return book;
        }

        [HttpGet("author/{authorName}")]
        public async Task<IEnumerable<BookDto>> GetByAuthor(string authorName)
        {
            return await _bookRepository.GetBooksByAuthorAsync(authorName);
        }

        [HttpGet("genre/{genreName}")]
        public async Task<IEnumerable<BookDto>> GetByGenre(string genreName)
        {
            return await _bookRepository.GetBooksByGenreAsync(genreName);
        }

        [HttpPost]
        public async Task<ActionResult<BookDto>> Create(CreateBookDto book)
        {
            var newBook = await _bookRepository.CreateBookAsync(book);
            if (newBook == null)
                return BadRequest();
            return CreatedAtAction(nameof(GetById), new { id = newBook.Id }, newBook);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<BookDto>> Update(int id, UpdateBookDto book)
        {
            if (id != book.Id)
                return BadRequest();
            var updated = await _bookRepository.UpdateBookAsync(book);
            if (updated == null)
                return NotFound();
            return updated;
        }

        [HttpGet("all-with-reviews")]
        public async Task<ActionResult<List<BookWithReviewDto>>> GetAllBooksWithReviews()
        {
            var booksWithReviews = await _bookRepository.GetAllBooksWithReviewsAsync();
            return Ok(booksWithReviews);
        }

        [HttpGet("latest-reviews")]
        public async Task<IEnumerable<BookWithReviewDto>> GetLatestBooksWithReviews()
        {
            return await _bookRepository.GetLatestBooksWithReviewsAsync();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _bookRepository.DeleteBookByIdAsync(id);
            if (!success)
                return NotFound();
            return NoContent();
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<BookWithReviewDto>>> SearchBooks(
            [FromQuery] string query
        )
        {
            var results = await _bookRepository.SearchBooksAsync(query);
            return Ok(results);
        }
    }
}
