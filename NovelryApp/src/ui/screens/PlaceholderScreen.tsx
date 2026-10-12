import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = { title: string; message: string };

export function PlaceholderScreen({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  message: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
});
