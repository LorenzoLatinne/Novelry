using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryMAUIApp.Converters
{
    public class DateTimeToDateConverter : IValueConverter
    {
        public object? Convert(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            if (value is DateTime dateTime)
                return dateTime.ToString("dd-MM-yyyy");
            else if (value is DateOnly dateOnly)
                return dateOnly.ToString("dd-MM-yyyy");

            return value?.ToString();
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
