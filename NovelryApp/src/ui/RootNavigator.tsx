import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppServicesProvider, type AppServices } from './AppServices';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { BookDetailScreen } from './screens/BookDetailScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ScanScreen } from './screens/ScanScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { colors } from './theme';

export type RootStackParamList = {
  Tabs: undefined;
  BookDetail: { isbn: string };
  Scan: undefined;
  Achievements: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

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


function Tabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function BookDetailRoute({ route }: NativeStackScreenProps<RootStackParamList, 'BookDetail'>) {
  return <BookDetailScreen isbn={route.params.isbn} />;
}

export function RootNavigator({ services }: { services: AppServices }) {
  return (
    <AppServicesProvider services={services}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="BookDetail" component={BookDetailRoute} options={{ title: 'Book' }} />
          <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan a book' }} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Achievements' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppServicesProvider>
  );
}
