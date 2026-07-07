using System.Globalization;

namespace NovelryMAUIApp.Converters
{
    public class BoolToStarColorConverter : IValueConverter
    {
        public object? Convert(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            return (value is bool filled && filled) ? Colors.Gold : Colors.Gray;
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
