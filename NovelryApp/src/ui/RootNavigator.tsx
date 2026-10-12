import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { Storage } from '../core/storage/storage';
import { LibraryScreen } from './screens/LibraryScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { colors } from './theme';

const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const ExploreScreen = () => (
  <PlaceholderScreen title="Explore" message="Search for your next book." />
);
const DashboardScreen = () => (
  <PlaceholderScreen title="Dashboard" message="Your reading goals and stats." />
);
const SettingsScreen = () => (
  <PlaceholderScreen title="Settings" message="Privacy, support and your data." />
);

export function RootNavigator({ storage }: { storage: Storage }) {
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator>
        <Tab.Screen name="Library">{() => <LibraryScreen storage={storage} />}</Tab.Screen>
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
