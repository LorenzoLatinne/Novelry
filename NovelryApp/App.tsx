import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { openDeviceDatabase } from './src/core/storage/expoSqliteDatabase';
import { createOpenLibraryCatalog } from './src/core/catalog/openLibraryCatalog';
import { openStorage, type Storage } from './src/core/storage/storage';
import { RootNavigator } from './src/ui/RootNavigator';
import { colors } from './src/ui/theme';

const catalog = createOpenLibraryCatalog({ fetch });

export default function App() {
  const [storage, setStorage] = useState<Storage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openDeviceDatabase()
      .then(openStorage)
      .then(setStorage)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not open your data.'));
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!storage) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <RootNavigator services={{ storage, catalog }} />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  error: { color: colors.text, textAlign: 'center' },
});
