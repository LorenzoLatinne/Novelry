using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.User;
using NovelryMAUIApp.Repositories.User;

namespace NovelryMAUIApp.ViewModels
{
    public partial class SignUpViewModel : ObservableObject
    {
        private readonly IUserRepository _userRepository;

        private readonly INavigationService _navigationService;
        private readonly IAlertService _alertService;

        [ObservableProperty]
        private string _username = string.Empty;

        [ObservableProperty]
        private string _email = string.Empty;

        [ObservableProperty]
        private string _password = string.Empty;

        [ObservableProperty]
        private bool _hidePassword = true;

        [ObservableProperty]
        private string _confirmPassword = string.Empty;

        [ObservableProperty]
        private bool _hideConfirmPassword = true;

        [ObservableProperty]
        private bool? _agreeTerms = null;

        [ObservableProperty]
        private FontAwesomeSolidIcons _lengthRequirementIcon = FontAwesomeSolidIcons.X;

        [ObservableProperty]
        private Color _lengthRequirementColor = Colors.Red;

        [ObservableProperty]
        private FontAwesomeSolidIcons _uppercaseRequirementIcon = FontAwesomeSolidIcons.X;

        [ObservableProperty]
        private Color _uppercaseRequirementColor = Colors.Red;

        [ObservableProperty]
        private FontAwesomeSolidIcons _numberRequirementIcon = FontAwesomeSolidIcons.X;

        [ObservableProperty]
        private Color _numberRequirementColor = Colors.Red;

        public SignUpViewModel(
            IUserRepository userRepository,
            INavigationService navigationService,
            IAlertService alertService
        )
        {
            _userRepository = userRepository;
            _navigationService = navigationService;
            _alertService = alertService;
        }

        [RelayCommand]
        public async Task CreateAccount()
        {
            if (!CheckIfRequiredFieldsAreFilled())
            {
                await _alertService.ShowMessageAsync(
                    "Missing required fields.",
                    "Not all required fields have been filled in.",
                    "Ok."
                );
                return;
            }

            if (!CheckIfEmailIsValid(Email))
            {
                await _alertService.ShowMessageAsync(
                    "Invalid email.",
                    "No valid email address has been entered.",
                    "Ok."
                );
                return;
            }

            if (!CheckIfPasswordsMatch(Password, ConfirmPassword))
            {
                await _alertService.ShowMessageAsync(
                    "Password invalid.",
                    "Password fields do not match.",
                    "Ok."
                );
                return;
            }

            if (!CheckPasswordStrength(Password))
            {
                await _alertService.ShowMessageAsync(
                    "Password too weak.",
                    "Please choose a password that fits the requirements.",
                    "Ok."
                );
                return;
            }

            if (!CheckIfTermsAreAgreed(AgreeTerms))
            {
                await _alertService.ShowMessageAsync(
                    "Agree to the ToS and Privacy Policy.",
                    "You have to agree to the Terms of Service and Privacy Policy.",
                    "Ok."
                );
                return;
            }

            if (!await CheckIfUsernameIsAvailable(Username))
            {
                await _alertService.ShowMessageAsync(
                    "Username already taken.",
                    "Please choose a different username, as this one is already taken.",
                    "Ok."
                );
                return;
            }

            var newUser = new CreateUserDto()
            {
                Username = Username,
                Email = Email,
                Password = Password,
            };

            bool result = await CreateUser(newUser);

            if (result)
            {
                await _alertService.ShowMessageAsync(
                    "Account created",
                    "Account was succesfully created!",
                    "Ok"
                );
                await _navigationService.NavigateToAsync("LoginPage");
                return;
            }
            else
            {
                await _alertService.ShowMessageAsync(
                    "Account creation failed.",
                    "Something went wrong, please try again later.",
                    "Ok"
                );
                return;
            }
        }

        private async Task<bool> CreateUser(CreateUserDto newUser)
        {
            try
            {
                var result = await _userRepository.CreateUserAsync(newUser);
                return result != null;
            }
            catch (Exception ex)
            {
                await _alertService.ShowMessageAsync(
                    "Account creation failed.",
                    "Something went wrong, please try again later.",
                    "Ok"
                );
                return false;
            }
        }

        private bool CheckPasswordStrength(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return false;

            if (password.Length < 8)
                return false;

            if (!password.Any(char.IsUpper))
                return false;

            if (!password.Any(char.IsDigit))
                return false;

            return true;
        }

        private async Task<bool> CheckIfUsernameIsAvailable(string username)
        {
            var user = await _userRepository.GetUserByUsernameAsync(username);
            if (user == null)
                return true;
            return false;
        }

        private bool CheckIfTermsAreAgreed(bool? agreeTerms) => agreeTerms == true;

        private bool CheckIfPasswordsMatch(string password, string confirmPassword) =>
            string.Equals(password, confirmPassword);

        private bool CheckIfEmailIsValid(string email)
        {
            var emailValidator = new EmailAddressAttribute();
            if (!emailValidator.IsValid(email))
                return false;
            return true;
        }

        private bool CheckIfRequiredFieldsAreFilled()
        {
            if (
                string.IsNullOrEmpty(Username)
                || string.IsNullOrEmpty(Email)
                || string.IsNullOrEmpty(Password)
                || string.IsNullOrEmpty(ConfirmPassword)
                || AgreeTerms == null
            )
            {
                return false;
            }
            return true;
        }

        [RelayCommand]
        public async Task Cancel()
        {
            await _navigationService.GoBackAsync();
        }

        [RelayCommand]
        public void ToggleShowPassword()
        {
            HidePassword = !HidePassword;
        }

        [RelayCommand]
        public void ToggleShowConfirmPassword()
        {
            HideConfirmPassword = !HideConfirmPassword;
        }
    }
}
