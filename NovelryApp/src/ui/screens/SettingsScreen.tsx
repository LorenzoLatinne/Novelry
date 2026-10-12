import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppServices } from '../AppServices';
import { exportAndShare, SharingUnavailableError } from '../exportData';
import { colors } from '../theme';

export function SettingsScreen() {
  const { storage } = useAppServices();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportData() {
    setExporting(true);
    setMessage(null);
    try {
      await exportAndShare(storage);
      // The share sheet gives no way to tell whether the Reader saved the file or backed out, so say neither.
      setMessage('Your export file is ready. If you saved it, keep it safe: it holds your whole reading history.');
    } catch (error) {
      setMessage(error instanceof SharingUnavailableError ? error.message : 'Could not export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
      <Text accessibilityRole="header" style={styles.title}>
        Your data
      </Text>
      <Text style={styles.text}>
        Everything you track in Novelry is stored on this phone. Export it to a file to keep a backup or to move to a new phone.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: exporting, disabled: exporting }}
        disabled={exporting}
        onPress={exportData}
        style={[styles.button, exporting && styles.buttonBusy]}
      >
        {exporting ? (
          <ActivityIndicator accessibilityLabel="Preparing your export" color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Export my data</Text>
        )}
      </Pressable>
      {message ? (
        <View accessibilityLiveRegion="polite">
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  text: { fontSize: 16, color: colors.textMuted, marginTop: 8 },
  button: {
    marginTop: 16,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  message: { fontSize: 16, color: colors.text, marginTop: 16 },
});
