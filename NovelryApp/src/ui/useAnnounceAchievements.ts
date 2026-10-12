import { NavigationContext } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useContext } from 'react';
import { Alert } from 'react-native';
import { loadAchievements } from '../core/achievements';
import { useAppServices } from './AppServices';
import type { RootStackParamList } from './RootNavigator';
import { deviceTimeZone } from './timeZone';

/**
 * Returns a function that tells the Reader about Achievements they have just earned, once each.
 * Call it after anything that can earn one (finishing a Book, stopping a session, ...).
 */
export function useAnnounceAchievements(): () => Promise<void> {
  const { storage } = useAppServices();
  // Optional: a screen shown outside a navigator can still announce, it just cannot offer to open the list.
  const navigation = useContext(NavigationContext) as NativeStackNavigationProp<RootStackParamList> | undefined;

  return useCallback(async () => {
    try {
      const achievements = await loadAchievements(storage, new Date(), deviceTimeZone());
      const fresh = achievements.filter((achievement) => achievement.isNew);
      if (fresh.length === 0) {
        return;
      }
      // Mark them first, so the notice cannot appear twice even if the Reader dismisses it oddly.
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
    } catch {
      // A notice that cannot be shown must never get in the way of what the Reader was doing.
    }
  }, [storage, navigation]);
}
