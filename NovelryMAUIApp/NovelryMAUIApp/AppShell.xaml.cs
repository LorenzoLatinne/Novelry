using MauiIcons.Core;
using NovelryMAUIApp.Pages;

namespace NovelryMAUIApp
{
    public partial class AppShell : Shell
    {
        public AppShell()
        {
            InitializeComponent();
            _ = new MauiIcon();

            Routing.RegisterRoute(nameof(AchievementPage), typeof(AchievementPage));
            Routing.RegisterRoute(nameof(BookInfoPage), typeof(BookInfoPage));
            Routing.RegisterRoute(nameof(BookTimerPage), typeof(BookTimerPage));
            Routing.RegisterRoute(nameof(DashboardPage), typeof(DashboardPage));
            Routing.RegisterRoute(nameof(ExplorePage), typeof(ExplorePage));
            Routing.RegisterRoute(nameof(FilteredBooksPage), typeof(FilteredBooksPage));
            Routing.RegisterRoute(nameof(IntroductionPage), typeof(IntroductionPage));
            Routing.RegisterRoute(nameof(LibraryPage), typeof(LibraryPage));
            Routing.RegisterRoute(nameof(LoginPage), typeof(LoginPage));
            Routing.RegisterRoute(nameof(ProfilePage), typeof(ProfilePage));
            Routing.RegisterRoute(nameof(ReviewsPage), typeof(ReviewsPage));
            Routing.RegisterRoute(nameof(ScanPage), typeof(ScanPage));
            Routing.RegisterRoute(nameof(SettingsPage), typeof(SettingsPage));
            Routing.RegisterRoute(nameof(SignupPage), typeof(SignupPage));
            Routing.RegisterRoute(nameof(UserBookDetailPage), typeof(UserBookDetailPage));
            Routing.RegisterRoute(nameof(WelcomePage), typeof(WelcomePage));
            Routing.RegisterRoute(nameof(WriteReviewPage), typeof(WriteReviewPage));
        }
    }
}
