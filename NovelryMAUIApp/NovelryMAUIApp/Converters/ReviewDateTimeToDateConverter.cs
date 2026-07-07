using System.Globalization;

namespace NovelryMAUIApp.Converters
{
    public class ReviewDateTimeToDateConverter : IValueConverter
    {
        public object? Convert(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            if (value is DateTime date)
            {
                return $"{date.ToShortDateString()}";
            }
            else
                return value;
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
