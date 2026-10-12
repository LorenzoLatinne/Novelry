import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { readingTime, type ReadingTime } from '../../core/readingTime';
import { useAppServices } from '../AppServices';
import { colors } from '../theme';
import { deviceTimeZone } from '../timeZone';

export function DashboardScreen() {
  const { storage } = useAppServices();
  const navigation = useNavigation();
  const [time, setTime] = useState<ReadingTime | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      storage.sessions
        .all()
        .then((sessions) => active && setTime(readingTime(sessions, new Date(), deviceTimeZone())))
        .catch(() => {});
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [storage, navigation]);

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Reading time
      </Text>
      <View style={styles.row}>
        <Stat label="Today" seconds={time?.today} />
        <Stat label="This week" seconds={time?.thisWeek} />
        <Stat label="This year" seconds={time?.thisYear} />
      </View>
    </View>
  );
}

function Stat({ label, seconds }: { label: string; seconds: number | undefined }) {
  return (
    <View accessible style={styles.stat}>
      <Text style={styles.statValue}>{seconds === undefined ? '–' : formatHours(seconds)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Whole minutes under an hour ("25 min"), otherwise hours and minutes ("3 h 05 min"). */
function formatHours(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
});
