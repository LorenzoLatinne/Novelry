using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryMAUIApp.Converters
{
    public class ReadingStatusToColorConverter : IValueConverter
    {
        public object? Convert(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            if (value is UserBookStatus status)
            {
                return status switch
                {
                    UserBookStatus.WantToRead => Color.FromArgb("#FF0000"),
                    UserBookStatus.Reading => Color.FromArgb("#2973C7"),
                    UserBookStatus.Read => Color.FromArgb("#D9A33F"),
                    _ => Color.FromArgb("#FFFFFF"),
                };
            }
            return Color.FromArgb("#000000");
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
