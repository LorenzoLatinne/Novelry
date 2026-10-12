import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { viewLibrary } from '../../core/libraryView';
import { progressPercent } from '../../core/progress';
import { SHELF_LABELS, SHELVES, type Shelf } from '../../core/shelf';
import type { Book } from '../../core/catalog/book';
import type { LibraryEntry, LibraryEntryWithBook } from '../../core/storage/storage';
import { useAppServices } from '../AppServices';
import type { RootStackParamList } from '../RootNavigator';
import { colors } from '../theme';

type ShelfChoice = Shelf | 'all';
const SHELF_CHOICES: { value: ShelfChoice; label: string }[] = [
  { value: 'all', label: 'All' },
  ...SHELVES.map((shelf) => ({ value: shelf, label: SHELF_LABELS[shelf] })),
];

export function LibraryScreen() {
  const { storage } = useAppServices();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<LibraryEntryWithBook[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [shelf, setShelf] = useState<ShelfChoice>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    // Reload whenever the Library tab regains focus, e.g. after adding a Book.
    const load = () =>
      storage.library
        .listWithBooks()
        .then((loaded) => {
          if (active) {
            setItems(loaded);
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

  const visible = useMemo(
    () => viewLibrary(items ?? [], { shelf: shelf === 'all' ? undefined : shelf, favoritesOnly, query }),
    [items, shelf, favoritesOnly, query],
  );

  if (failed) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Your Library could not be loaded.</Text>
      </View>
    );
  }

  if (items === null) {
    return <View style={styles.center} />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="header" style={styles.title}>
          Your Library is empty
        </Text>
        <Text style={styles.message}>Books you add will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Search your Library"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={setQuery}
        placeholder="Search your Library"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={query}
      />
      <View accessibilityRole="tablist" style={[styles.chips, styles.shelfChips]}>
        {SHELF_CHOICES.map((choice) => {
          const selected = shelf === choice.value;
          return (
            <Pressable
              key={choice.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setShelf(choice.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{choice.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.chips}>
        <Pressable
          accessibilityLabel="Favorites only"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: favoritesOnly }}
          onPress={() => setFavoritesOnly((on) => !on)}
          style={[styles.chip, favoritesOnly && styles.chipSelected]}
        >
          <Text style={[styles.chipText, favoritesOnly && styles.chipTextSelected]}>♥ Favorites</Text>
        </Pressable>
      </View>
      {visible.length === 0 ? (
        <View style={styles.center}>
          <Text accessibilityLiveRegion="polite" style={styles.message}>
            No books match. Try another Shelf, Favorites or search.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={({ entry }) => entry.isbn}
          renderItem={({ item: { entry, book } }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('BookDetail', { isbn: entry.isbn })}
              style={styles.row}
            >
              <Text
                accessibilityLabel={`${book?.title ?? entry.isbn}${entry.favorite ? ', Favorite' : ''}`}
                style={styles.rowTitle}
              >
                {entry.favorite ? '♥ ' : ''}
                {book?.title ?? entry.isbn}
              </Text>
              <Text style={styles.rowMeta}>
                {rowMeta(entry, book)}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function rowMeta(entry: LibraryEntry, book: Book | null): string {
  const percent = entry.shelf === 'reading' ? progressPercent(entry.currentPage, book?.pageCount) : null;
  return [book?.authors.join(', '), SHELF_LABELS[entry.shelf], percent === null ? null : `${percent}%`]
    .filter(Boolean)
    .join(' · ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  message: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  input: {
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 8 },
  shelfChips: { paddingBottom: 0 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    marginHorizontal: 4,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.onPrimary, fontWeight: '600' },
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
});
