import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dashboardView, loadDashboard, type DashboardData } from '../../core/dashboard';
import { formatDuration } from '../../core/duration';
import { localParts, msUntilNextLocalDay } from '../../core/localTime';
import { InvalidGoalError, MAX_DAILY_MINUTES_GOAL, MAX_YEARLY_BOOKS_GOAL } from '../../core/storage/storage';
import { loadAchievements } from '../../core/achievements';
import { useAppServices } from '../AppServices';
import { useAnnounceAchievements } from '../useAnnounceAchievements';
import type { RootStackParamList } from '../RootNavigator';
import { colors } from '../theme';
import { deviceTimeZone } from '../timeZone';
import { GoalCard, type GoalCopy } from './GoalCard';

export function DashboardScreen() {
  const { storage } = useAppServices();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [achievementCount, setAchievementCount] = useState<{ earned: number; total: number } | null>(null);
  const announceAchievements = useAnnounceAchievements();
  const timeZone = deviceTimeZone();
  const focused = useIsFocused();

  const latestLoad = useRef(0);

  const reload = useCallback(async () => {
    const load = ++latestLoad.current;
    const loaded = await loadDashboard(storage);
    if (load !== latestLoad.current) {
      return; // a newer load has started; its answer wins
    }
    setData(loaded);
    setNow(new Date());
    await announceAchievements();
    const achievements = await loadAchievements(storage, new Date(), deviceTimeZone());
    if (load === latestLoad.current) {
      setAchievementCount({ earned: achievements.filter((a) => a.earned).length, total: achievements.length });
    }
  }, [storage, announceAchievements]);

  useEffect(() => {
    const load = () => reload().catch(() => {});
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return () => {
      latestLoad.current++; // ignore anything still on its way once we are gone
      unsubscribe();
    };
  }, [reload, navigation]);

  // While a session is running its time ticks every second; nothing is loaded again for that.
  // Timers only run while the Dashboard is on screen; reloading on focus catches everything up.
  const running = data?.runningSession?.id ?? null;
  useEffect(() => {
    if (running === null || !focused) {
      return;
    }
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [running, focused]);

  // The day (and the year) change at the Reader's midnight, even if nothing else happens.
  const today = localParts(now.getTime(), timeZone).day;
  useEffect(() => {
    if (!focused) {
      return;
    }
    const timer = setTimeout(() => setNow(new Date()), msUntilNextLocalDay(new Date(), timeZone) + 1000);
    return () => clearTimeout(timer);
  }, [today, timeZone, focused]);

  // A timer can be paused while the app is in the background: look at the clock again on return.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(new Date());
      }
    });
    return () => subscription.remove();
  }, []);

  const view = useMemo(() => (data ? dashboardView(data, now, timeZone) : null), [data, now, timeZone]);

  async function saveGoal(save: () => Promise<void>): Promise<string | null> {
    try {
      await save();
      await reload();
      return null;
    } catch (error) {
      return error instanceof InvalidGoalError ? error.message : 'Could not save your goal. Please try again.';
    }
  }

  async function removeGoal(remove: () => Promise<void>): Promise<string | null> {
    try {
      await remove();
      await reload();
      return null;
    } catch {
      return 'Could not remove your goal. Please try again.';
    }
  }

  const currentSession = view?.currentSession ?? null;
  const yearlyGoal = view?.yearlyGoal ?? null;
  const dailyGoal = view?.dailyGoal ?? null;

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scroll}>
      {currentSession ? (
        <View style={styles.nowCard}>
          <Text style={styles.nowLabel}>Reading now</Text>
          <Text style={styles.nowTitle}>{currentSession.title}</Text>
          <Text accessibilityRole="timer" style={styles.nowTime}>
            {formatDuration(currentSession.elapsedSeconds)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('BookDetail', { isbn: currentSession.isbn })}
            style={styles.nowButton}
          >
            <Text style={styles.nowButtonText}>Open book</Text>
          </Pressable>
        </View>
      ) : null}

      <Text accessibilityRole="header" style={styles.title}>
        Reading time
      </Text>
      <View style={styles.row}>
        <Stat label="Today" value={view && formatHours(view.readingTime.today)} />
        <Stat label="This week" value={view && formatHours(view.readingTime.thisWeek)} />
        <Stat label="This year" value={view && formatHours(view.readingTime.thisYear)} />
      </View>

      <Text accessibilityRole="header" style={styles.title}>
        Books
      </Text>
      <View style={styles.row}>
        <Stat label={`Read in ${view?.year ?? ''}`.trim()} value={view && String(view.booksThisYear)} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Achievements')}
        style={styles.achievementsCard}
      >
        <Text style={styles.achievementsTitle}>Achievements</Text>
        <Text style={styles.achievementsText}>
          {achievementCount ? `${achievementCount.earned} of ${achievementCount.total} earned` : ' '}
        </Text>
        <Text style={styles.achievementsLink}>See all</Text>
      </Pressable>

      <GoalCard
        copy={yearlyCopy(view?.year ?? localParts(now.getTime(), timeZone).year)}
        currentTarget={yearlyGoal?.target ?? null}
        progress={
          yearlyGoal && {
            headline: `${yearlyGoal.finished} of ${yearlyGoal.target} ${yearlyGoal.target === 1 ? 'book' : 'books'}`,
            percent: yearlyGoal.percent,
            reached: yearlyGoal.reached,
          }
        }
        onSet={(target) => saveGoal(() => storage.goals.setYearlyBooks(target))}
        onRemove={() => removeGoal(() => storage.goals.removeYearlyBooks())}
      />
      <GoalCard
        copy={DAILY_COPY}
        currentTarget={dailyGoal?.targetMinutes ?? null}
        progress={
          dailyGoal && {
            headline: `${dailyGoal.minutesRead} of ${dailyGoal.targetMinutes} minutes today`,
            percent: dailyGoal.percent,
            reached: dailyGoal.reached,
          }
        }
        onSet={(target) => saveGoal(() => storage.goals.setDailyMinutes(target))}
        onRemove={() => removeGoal(() => storage.goals.removeDailyMinutes())}
      />
    </ScrollView>
  );
}

function yearlyCopy(year: number): GoalCopy {
  return {
    heading: `Reading goal ${year}`,
    promptHeading: `Set a reading goal for ${year}`,
    prompt: 'How many books do you want to finish this year?',
    inputLabel: 'Books to read this year',
    placeholder: 'e.g. 12',
    invalidInput: `Enter a whole number of books, from 1 to ${MAX_YEARLY_BOOKS_GOAL}.`,
    setButton: 'Set goal',
    changeButton: 'Change goal',
    removeButton: 'Remove goal',
    removeTitle: 'Remove your yearly goal?',
    removeMessage: 'Your finished books are not affected.',
    barLabel: (percent) => `${percent} percent of your yearly goal`,
  };
}

const DAILY_COPY: GoalCopy = {
  heading: 'Daily reading goal',
  promptHeading: 'Set a daily reading goal',
  prompt: 'How many minutes do you want to read each day?',
  inputLabel: 'Minutes to read each day',
  placeholder: 'e.g. 20',
  invalidInput: `Enter a whole number of minutes, from 1 to ${MAX_DAILY_MINUTES_GOAL}.`,
  setButton: 'Set daily goal',
  changeButton: 'Change daily goal',
  removeButton: 'Remove daily goal',
  removeTitle: 'Remove your daily goal?',
  removeMessage: 'Your reading sessions are not affected.',
  barLabel: (percent) => `${percent} percent of today’s goal`,
};

function Stat({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View accessible style={styles.stat}>
      <Text style={styles.statValue}>{value ?? '–'}</Text>
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
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16, marginTop: 8 },
  achievementsCard: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 44 },
  achievementsTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  achievementsText: { fontSize: 16, color: colors.primary, marginTop: 4 },
  achievementsLink: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  nowCard: { padding: 16, borderRadius: 12, backgroundColor: colors.primary, marginBottom: 16, alignItems: 'center' },
  nowLabel: { fontSize: 14, color: colors.onPrimary },
  nowTitle: { fontSize: 18, fontWeight: '700', color: colors.onPrimary, marginTop: 4, textAlign: 'center' },
  nowTime: { fontSize: 36, fontWeight: '700', color: colors.onPrimary, marginTop: 4, fontVariant: ['tabular-nums'] },
  nowButton: { marginTop: 8, minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  nowButtonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
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
