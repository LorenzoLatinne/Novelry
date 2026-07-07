namespace NovelryMAUIApp.Pages;

public partial class ScanPage : ContentPage
{
    public ScanPage(ScanPageViewModel vm)
    {
        InitializeComponent();
        barcodeReader.Options = new()
        {
            Formats = ZXing.Net.Maui.BarcodeFormat.Ean13,
            AutoRotate = true,
        };
        barcodeReader.CameraLocation = ZXing.Net.Maui.CameraLocation.Rear;
        BindingContext = vm;
    }

    private void BarcodesDetected(object sender, ZXing.Net.Maui.BarcodeDetectionEventArgs e)
    {
        var first = e.Results.FirstOrDefault();
        if (first == null)
            return;

        if (BindingContext is ScanPageViewModel vm)
        {
            Dispatcher.DispatchAsync(async () => await vm.OnBarcodeDetected(first.Value));
        }
    }

    protected override bool OnBackButtonPressed()
    {
        if (BindingContext is ScanPageViewModel vm)
            _ = vm.GoBackCommand.ExecuteAsync(null);
        return true;
    }
}
