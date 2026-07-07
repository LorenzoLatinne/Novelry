using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelryMAUIApp.Behaviors
{
    public class FadeInPageBehavior : Behavior<ContentPage>
    {
        public int Duration { get; set; } = 1000;
        public Color BackgroundColor { get; set; } = Colors.Black;

        protected override void OnAttachedTo(ContentPage bindable)
        {
            base.OnAttachedTo(bindable);

            bindable.BackgroundColor = BackgroundColor;

            bindable.Opacity = 0;

            bindable.Dispatcher.Dispatch(async () =>
            {
                await Task.Delay(1000);
                await bindable.FadeTo(1, (uint)Duration);
            });
        }
    }
}
