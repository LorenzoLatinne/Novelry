import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { readingTime, type ReadingTime } from '../../core/readingTime';
import { InvalidGoalError } from '../../core/storage/storage';
import { localParts } from '../../core/localTime';
import { yearlyGoalProgress, type YearlyGoalProgress } from '../../core/yearlyGoal';
import { useAppServices } from '../AppServices';
import { colors } from '../theme';
import { deviceTimeZone } from '../timeZone';
import { YearlyGoalCard } from './YearlyGoalCard';

export function DashboardScreen() {
  const { storage } = useAppServices();
  const navigation = useNavigation();
  const [time, setTime] = useState<ReadingTime | null>(null);
  const [goal, setGoal] = useState<YearlyGoalProgress | null>(null);
  const [year, setYear] = useState(() => localParts(Date.now(), deviceTimeZone()).year);

  const latestLoad = useRef(0);

  const reload = useCallback(async () => {
    const load = ++latestLoad.current;
    const now = new Date();
    const timeZone = deviceTimeZone();
    const [sessions, target, finishes] = await Promise.all([
      storage.sessions.all(),
      storage.goals.getYearlyBooks(),
      storage.library.finishes(),
    ]);
    if (load !== latestLoad.current) {
      return; // a newer load has started; its answer wins
    }
    setTime(readingTime(sessions, now, timeZone));
    setYear(localParts(now.getTime(), timeZone).year);
    setGoal(target === null ? null : yearlyGoalProgress(target, finishes, now, timeZone));
  }, [storage]);

  useEffect(() => {
    const load = () => reload().catch(() => {});
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return () => {
      latestLoad.current++; // ignore anything still on its way once we are gone
      unsubscribe();
    };
  }, [reload, navigation]);

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
      <YearlyGoalCard
        year={year}
        progress={goal}
        onSet={async (target) => {
          try {
            await storage.goals.setYearlyBooks(target);
            await reload();
            return null;
          } catch (error) {
            return error instanceof InvalidGoalError ? error.message : 'Could not save your goal. Please try again.';
          }
        }}
        onRemove={async () => {
          try {
            await storage.goals.removeYearlyBooks();
            await reload();
            return null;
          } catch {
            return 'Could not remove your goal. Please try again.';
          }
        }}
      />
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
