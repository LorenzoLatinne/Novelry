using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;
using Microsoft.Maui.Handlers;
using NovelryMAUIApp.Extensions;
using ZXing.Net.Maui.Controls;

namespace NovelryMAUIApp
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();
            builder
                .UseFontAwesomeSolidMauiIcons()
                .UseSegoeFluentMauiIcons()
                .UseMauiCommunityToolkit()
                .UseMaterialMauiIcons()
                .UseCupertinoMauiIcons()
                .UseFontAwesomeBrandMauiIcons()
                .UseBarcodeReader()
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                    fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
                    fonts.AddFont("Inter.ttf", "Inter");
                    fonts.AddFont("InterBold.ttf", "InterBold");
                    fonts.AddFont("Outfit.ttf", "Outfit");
                    fonts.AddFont("OutfitBold.ttf", "OutfitBold");
                    fonts.AddFont("Playfair.ttf", "Playfair");
                });

#if DEBUG
            builder.Logging.AddDebug();
#endif

            #region Remove Entry Field underline on Android and iOS.
            // Remove underline within Entry-fields natively in Android and IOS.
            EntryHandler.Mapper.AppendToMapping(
                "NoUnderline",
                (handler, view) =>
                {
#if ANDROID
                    handler.PlatformView.Background = null;
                    handler.PlatformView.SetBackgroundColor(Android.Graphics.Color.Transparent);
#elif IOS || MACCATALYST
                    handler.PlatformView.BorderStyle = UIKit.UITextBorderStyle.None;
#endif
                }
            );
            #endregion

            #region Remove Editor Field Underline on Android and iOS.
            // Remove underline within Editor-fields natively in Android and IOS.
            EditorHandler.Mapper.AppendToMapping(
                "NoUnderline",
                (handler, view) =>
                {
#if ANDROID
                    // Remove the default underline/background
                    handler.PlatformView.Background = null;

                    // Also clear the default Material underline if using AppCompat
                    handler.PlatformView.SetBackgroundColor(Android.Graphics.Color.Transparent);
                    handler.PlatformView.SetPadding(0, 0, 0, 0);
#elif IOS || MACCATALYST
                    handler.PlatformView.BorderStyle = UIKit.UITextViewBorderStyle.None;
#endif
                }
            );
            #endregion

            builder.UseMauiApp<App>();

            builder.Services.AddAppServices();
            builder.Services.AddRepositories();
            builder.Services.AddViewModels();
            builder.Services.AddPages();

            return builder.Build();
        }
    }
}
