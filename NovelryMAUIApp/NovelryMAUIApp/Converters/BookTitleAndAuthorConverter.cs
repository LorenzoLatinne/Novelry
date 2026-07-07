using System.Globalization;
using NovelryDTO.DTOs.Book;

namespace NovelryMAUIApp.Converters
{
    public class BookTitleAndAuthorConverter : IValueConverter
    {
        public object? Convert(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            if (value is BookDto book)
            {
                return $"{book.Title} by {string.Join(", ", book.Authors.Select(a => a.FirstName + " " + a.LastName))}";
            }
            return string.Empty;
        }

        public object? ConvertBack(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            throw new NotImplementedException();
        }
    }
}
