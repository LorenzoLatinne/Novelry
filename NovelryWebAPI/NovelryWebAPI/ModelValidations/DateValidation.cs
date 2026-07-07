using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;

namespace NovelryWebAPI.ModelValidations
{
    public class DateValidation : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is DateOnly dateOnly)
            {
                if (dateOnly > DateOnly.FromDateTime(DateTime.UtcNow))
                    return new ValidationResult("The date can't be in the future.");
            }
            else if (value is DateTime dateTime)
            {
                if (dateTime > DateTime.UtcNow)
                    return new ValidationResult("The date can't be in the future.");
            }
            return ValidationResult.Success;
        }
    }
}
