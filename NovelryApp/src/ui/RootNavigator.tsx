import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppServicesProvider, type AppServices } from './AppServices';
import { BookDetailScreen } from './screens/BookDetailScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { colors } from './theme';

export type RootStackParamList = {
  Tabs: undefined;
  BookDetail: { isbn: string };
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

const ExploreScreen = () => (
  <PlaceholderScreen title="Explore" message="Search for your next book." />
);
const DashboardScreen = () => (
  <PlaceholderScreen title="Dashboard" message="Your reading goals and stats." />
);
const SettingsScreen = () => (
  <PlaceholderScreen title="Settings" message="Privacy, support and your data." />
);

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

function BookDetailRoute({ route }: { route: { params: { isbn: string } } }) {
  return <BookDetailScreen isbn={route.params.isbn} />;
}

export function RootNavigator({ services }: { services: AppServices }) {
  return (
    <AppServicesProvider services={services}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="BookDetail" component={BookDetailRoute} options={{ title: 'Book' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppServicesProvider>
  );
}
