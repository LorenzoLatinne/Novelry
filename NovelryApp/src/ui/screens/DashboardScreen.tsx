import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { readingTime, type ReadingTime } from '../../core/readingTime';
import { InvalidGoalError, MAX_DAILY_MINUTES_GOAL, MAX_YEARLY_BOOKS_GOAL } from '../../core/storage/storage';
import { localParts } from '../../core/localTime';
import { dailyGoalProgress, type DailyGoalProgress } from '../../core/dailyGoal';
import { yearlyGoalProgress, type YearlyGoalProgress } from '../../core/yearlyGoal';
import { useAppServices } from '../AppServices';
import { colors } from '../theme';
import { deviceTimeZone } from '../timeZone';
import { GoalCard, type GoalCopy } from './GoalCard';

export function DashboardScreen() {
  const { storage } = useAppServices();
  const navigation = useNavigation();
  const [time, setTime] = useState<ReadingTime | null>(null);
  const [yearlyGoal, setYearlyGoal] = useState<YearlyGoalProgress | null>(null);
  const [dailyGoal, setDailyGoal] = useState<DailyGoalProgress | null>(null);
  const [year, setYear] = useState(() => localParts(Date.now(), deviceTimeZone()).year);

  const latestLoad = useRef(0);

  const reload = useCallback(async () => {
    const load = ++latestLoad.current;
    const now = new Date();
    const timeZone = deviceTimeZone();
    const [sessions, yearlyTarget, dailyTarget, finishes] = await Promise.all([
      storage.sessions.all(),
      storage.goals.getYearlyBooks(),
      storage.goals.getDailyMinutes(),
      storage.library.finishes(),
    ]);
    if (load !== latestLoad.current) {
      return; // a newer load has started; its answer wins
    }
    setTime(readingTime(sessions, now, timeZone));
    setYear(localParts(now.getTime(), timeZone).year);
    setYearlyGoal(yearlyTarget === null ? null : yearlyGoalProgress(yearlyTarget, finishes, now, timeZone));
    setDailyGoal(dailyTarget === null ? null : dailyGoalProgress(dailyTarget, sessions, now, timeZone));
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
      <GoalCard
        copy={yearlyCopy(year)}
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
    </View>
  );
}

function yearlyCopy(year: number): GoalCopy {
  return {
    setHeading: `Reading goal ${year}`,
    unsetHeading: `Set a reading goal for ${year}`,
    prompt: 'How many books do you want to finish this year?',
    inputLabel: 'Books to read this year',
    placeholder: 'e.g. 12',
    invalidInput: `Enter a whole number of books, from 1 to ${MAX_YEARLY_BOOKS_GOAL}.`,
    setButton: 'Set goal',
    changeButton: 'Change goal',
    removeButton: 'Remove goal',
    removeTitle: 'Remove your yearly goal?',
    barLabel: (percent) => `${percent} percent of your yearly goal`,
  };
}

const DAILY_COPY: GoalCopy = {
  setHeading: 'Daily reading goal',
  unsetHeading: 'Set a daily reading goal',
  prompt: 'How many minutes do you want to read each day?',
  inputLabel: 'Minutes to read each day',
  placeholder: 'e.g. 20',
  invalidInput: `Enter a whole number of minutes, from 1 to ${MAX_DAILY_MINUTES_GOAL}.`,
  setButton: 'Set daily goal',
  changeButton: 'Change daily goal',
  removeButton: 'Remove daily goal',
  removeTitle: 'Remove your daily goal?',
  barLabel: (percent) => `${percent} percent of today’s goal`,
};

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
