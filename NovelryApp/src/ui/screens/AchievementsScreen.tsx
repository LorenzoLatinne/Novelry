import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadAchievements, type Achievement } from '../../core/achievements';
import { useAppServices } from '../AppServices';
import { colors } from '../theme';
import { deviceTimeZone } from '../timeZone';

export function AchievementsScreen() {
  const { storage } = useAppServices();
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadAchievements(storage, new Date(), deviceTimeZone())
      .then(async (loaded) => {
        if (!active) {
          return;
        }
        setAchievements(loaded); // shown with their "New" marks...
        await storage.achievements.markSeen(loaded.filter((a) => a.isNew).map((a) => a.id)); // ...then counted as seen
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [storage]);

  if (failed) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Your achievements could not be loaded.</Text>
      </View>
    );
  }
  if (!achievements) {
    return <View style={styles.center} />;
  }

  const earned = achievements.filter((a) => a.earned);
  const remaining = achievements.filter((a) => !a.earned);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
      <Text accessibilityRole="header" style={styles.summary}>
        {earned.length} of {achievements.length} earned
      </Text>

      {earned.length > 0 ? (
        <>
          <Text accessibilityRole="header" style={styles.section}>
            Earned
          </Text>
          {earned.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{a.title}</Text>
                {a.isNew ? <Text style={styles.newBadge}>New</Text> : null}
              </View>
              <Text style={styles.muted}>{a.description}</Text>
              {a.earnedAt ? <Text style={styles.date}>Earned {formatDay(a.earnedAt)}</Text> : null}
            </View>
          ))}
        </>
      ) : null}

      {remaining.length > 0 ? (
        <>
          <Text accessibilityRole="header" style={styles.section}>
            Still to earn
          </Text>
          {remaining.map((a) => (
            <View key={a.id} style={styles.card}>
              <Text style={styles.title}>{a.title}</Text>
              <Text style={styles.muted}>{a.description}</Text>
              <View
                accessibilityLabel={`${a.title}: ${a.current} of ${a.target}`}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: a.target, now: a.current }}
                style={styles.track}
              >
                <View style={[styles.fill, { width: `${Math.round((a.current / a.target) * 100)}%` }]} />
              </View>
              <Text style={styles.date}>{progressText(a)}</Text>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "3 of 5 books" style progress, in the rule's own unit. */
function progressText(a: Achievement): string {
  const unit = a.id.includes('book') ? 'books' : a.id.includes('streak') ? 'days' : 'minutes';
  return `${a.current} of ${a.target} ${unit}`;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  summary: { fontSize: 24, fontWeight: '700', color: colors.text },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 8 },
  card: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  date: { fontSize: 14, color: colors.textMuted, marginTop: 6 },
  newBadge: { fontSize: 12, fontWeight: '700', color: colors.onPrimary, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 8, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
