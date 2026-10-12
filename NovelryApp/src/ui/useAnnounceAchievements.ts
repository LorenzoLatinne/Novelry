import { NavigationContext } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useContext, useRef } from 'react';
import { Alert } from 'react-native';
import { loadAchievements, type Achievement } from '../core/achievements';
import { useAppServices } from './AppServices';
import type { RootStackParamList } from './RootNavigator';
import { deviceTimeZone } from './timeZone';

/**
 * Returns a function that tells the Reader about Achievements they have just earned, once each, and
 * resolves to all their Achievements (or null if they could not be loaded). Call it after anything that
 * can earn one. Calls that overlap share one run, so a notice can never appear twice.
 */
export function useAnnounceAchievements(): () => Promise<Achievement[] | null> {
  const { storage } = useAppServices();
  // Optional: a screen shown outside a navigator can still announce, it just cannot offer to open the list.
  const navigation = useContext(NavigationContext) as NativeStackNavigationProp<RootStackParamList> | undefined;
  const inFlight = useRef<Promise<Achievement[] | null> | null>(null);

  const run = useCallback(async (): Promise<Achievement[] | null> => {
    try {
      const achievements = await loadAchievements(storage, new Date(), deviceTimeZone());
      const fresh = achievements.filter((achievement) => achievement.isNew);
      if (fresh.length > 0) {
        // Marked first, so a notice can never repeat. If the app dies before the Alert appears the notice is
        // lost, which is the better failure: the Achievement itself is still earned and listed.
        await storage.achievements.markSeen(fresh.map((achievement) => achievement.id));
        Alert.alert(
          fresh.length === 1 ? 'Achievement unlocked' : 'Achievements unlocked',
          fresh.map((achievement) => `${achievement.title}: ${achievement.description}`).join('\n'),
          [
            ...(navigation
              ? [{ text: 'See achievements', onPress: () => navigation.navigate('Achievements') }]
              : []),
            { text: 'OK', style: 'cancel' as const },
          ],
        );
      }
      return achievements;
    } catch {
      // A notice that cannot be shown must never get in the way of what the Reader was doing.
      return null;
    }
  }, [storage, navigation]);

  return useCallback(() => {
    inFlight.current ??= run().finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }, [run]);
}
