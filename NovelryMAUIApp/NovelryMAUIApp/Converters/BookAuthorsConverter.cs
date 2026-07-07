using System.Globalization;
using NovelryDTO.DTOs.Author;

namespace NovelryMAUIApp.Converters
{
    internal class BookAuthorsConverter : IValueConverter
    {
        public object? Convert(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            if (value is List<AuthorDto> authors)
            {
                return $"{string.Join(", ", authors.Select(a => a.FullName))}";
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
