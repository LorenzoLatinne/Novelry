import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { LibraryEntry, Storage } from '../../core/storage/storage';
import { colors } from '../theme';

export function LibraryScreen({ storage }: { storage: Storage }) {
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null);

  useEffect(() => {
    storage.library.list().then(setEntries);
  }, [storage]);

  if (entries === null) {
    return <View style={styles.container} />;
  }

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          Your Library is empty
        </Text>
        <Text style={styles.message}>Books you add will appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(entry) => entry.isbn}
      renderItem={({ item }) => <Text style={styles.row}>{item.isbn}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  message: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  row: { padding: 16, color: colors.text },
});
