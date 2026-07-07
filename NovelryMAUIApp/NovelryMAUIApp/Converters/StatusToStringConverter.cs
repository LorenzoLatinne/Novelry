using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryMAUIApp.Converters
{
    public class StatusToStringConverter : IValueConverter
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
                    UserBookStatus.WantToRead => "Want to read",
                    UserBookStatus.Reading => "Reading",
                    UserBookStatus.Read => "Read",
                    _ => "Undefined",
                };
            }
            else
                return "Undefined";
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
