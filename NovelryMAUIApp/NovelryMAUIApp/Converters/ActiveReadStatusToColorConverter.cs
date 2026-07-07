using System;
using System.Globalization;
using Microsoft.Maui.Controls;
using NovelryDTO.Enums;

namespace NovelryMAUIApp.Converters
{
    public class ActiveReadStatusToColorConverter : IValueConverter
    {
        public readonly Color ActiveColor = Color.FromArgb("#D9A33F");
        public readonly Color InactiveColor = Color.FromArgb("#2973C7");

        public object Convert(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        )
        {
            if (value is not UserBookStatus currentStatus || parameter is null)
                return InactiveColor;

            UserBookStatus targetStatus;

            if (parameter is UserBookStatus enumParam)
                targetStatus = enumParam;
            else if (
                parameter is string paramString
                && Enum.TryParse(paramString, out UserBookStatus parsedEnum)
            )
                targetStatus = parsedEnum;
            else
                return InactiveColor;

            return currentStatus == targetStatus ? ActiveColor : InactiveColor;
        }

        public object ConvertBack(
            object? value,
            Type targetType,
            object? parameter,
            CultureInfo culture
        ) => throw new NotImplementedException();
    }
}
