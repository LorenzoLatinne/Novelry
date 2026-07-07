using System.Globalization;

namespace NovelryMAUIApp.Converters
{
    public class RatingToStarsConverter : IValueConverter
    {
        public object? Convert(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            if (value is double rating)
            {
                rating = (int)rating;
                var stars = new List<bool>();
                for (int i = 1; i <= 5; i++)
                {
                    stars.Add(i <= rating);
                }
                return stars;
            }
            else if (value is string ratingAsString)
            {
                double.TryParse(ratingAsString, out double validRating);
                var stars = new List<bool>();
                for (int i = 1; i <= 5; i++)
                {
                    stars.Add(i <= validRating);
                }
                return stars;
            }

            return new List<bool> { false, false, false, false, false };
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
