using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.Achievement;
using NovelryDTO.DTOs.User;
using NovelryMAUIApp.Repositories.Achievement;
using NovelryMAUIApp.Repositories.UserAchievement;

namespace NovelryMAUIApp.ViewModels
{
    public partial class AchievementViewModel : ObservableObject
    {
        #region Repositories & Services
        private readonly IUserAchievementRepository _userAchievementRepository;
        private readonly IAchievementRepository _achievementRepository;

        private readonly INavigationService _navigationService;
        private readonly IUserSessionService _userSessionService;
        #endregion

        #region Properties
        [ObservableProperty]
        private UserDto? _user;

        [ObservableProperty]
        private List<UserAchievementDto>? _userAchievements;

        [ObservableProperty]
        private List<UserAchievementDetailDto>? _achievements;
        #endregion

        public AchievementViewModel(
            IUserAchievementRepository userAchievementRepository,
            IAchievementRepository achievementRepository,
            INavigationService navigationService,
            IUserSessionService userSessionService
        )
        {
            _userAchievementRepository = userAchievementRepository;
            _achievementRepository = achievementRepository;
            _navigationService = navigationService;
            _userSessionService = userSessionService;
        }

        public async Task LoadData()
        {
            if (_userSessionService.CurrentUser == null)
            {
                await _navigationService.NavigateToAsync("//LoginPage");
                return;
            }
            User = _userSessionService.CurrentUser;

            UserAchievements = await _userAchievementRepository.GetUserAchievementsByIdAsync(
                User.Id
            );

            var achievementTasks = UserAchievements.Select(
                async ua => new UserAchievementDetailDto()
                {
                    Id = ua.Id,
                    UserId = ua.UserId,
                    AchievedAt = ua.AchievedAt,
                    AchievementId = ua.AchievementId,
                    Achievement = await _achievementRepository.GetAchievementByIdAsync(
                        ua.AchievementId
                    ),
                }
            );

            Achievements = (await Task.WhenAll(achievementTasks)).ToList();
        }

        #region Commands

        #endregion
    }
}
