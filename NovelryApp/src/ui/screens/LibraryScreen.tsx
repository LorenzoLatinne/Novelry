import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Book } from '../../core/catalog/book';
import { SHELF_LABELS } from '../../core/shelf';
import type { LibraryEntry } from '../../core/storage/storage';
import { useAppServices } from '../AppServices';
import type { RootStackParamList } from '../RootNavigator';
import { colors } from '../theme';

type Row = { entry: LibraryEntry; book: Book | null };

export function LibraryScreen() {
  const { storage } = useAppServices();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Reload whenever the Library tab regains focus, e.g. after adding a Book.
    let active = true;
    const load = () =>
      storage.library
        .list()
        .then((entries) =>
          Promise.all(entries.map(async (entry) => ({ entry, book: await storage.books.get(entry.isbn) }))),
        )
        .then((loaded) => {
          if (active) {
            setRows(loaded);
            setFailed(false);
          }
        })
        .catch(() => active && setFailed(true));
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [storage, navigation]);

  if (failed) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Your Library could not be loaded.</Text>
      </View>
    );
  }

  if (rows === null) {
    return <View style={styles.container} />;
  }

  if (rows.length === 0) {
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
      data={rows}
      keyExtractor={({ entry }) => entry.isbn}
      renderItem={({ item: { entry, book } }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('BookDetail', { isbn: entry.isbn })}
          style={styles.row}
        >
          <Text style={styles.rowTitle}>{book?.title ?? entry.isbn}</Text>
          <Text style={styles.rowMeta}>
            {[book?.authors.join(', '), SHELF_LABELS[entry.shelf]].filter(Boolean).join(' · ')}
          </Text>
        </Pressable>
      )}
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
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
});
