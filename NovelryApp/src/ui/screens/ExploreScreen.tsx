import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Book } from '../../core/catalog/book';
import { CatalogOfflineError } from '../../core/catalog/openLibraryCatalog';
import { useAppServices } from '../AppServices';
import type { RootStackParamList } from '../RootNavigator';
import { colors } from '../theme';

/** Wait for the Reader to stop typing before asking Open Library, to be rate-limit friendly. */
const SEARCH_DELAY_MS = 400;

type State =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; books: Book[] }
  | { kind: 'no-match' }
  | { kind: 'error'; message: string };

export function ExploreScreen() {
  const { catalog } = useAppServices();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  useEffect(() => {
    if (!query.trim()) {
      setState({ kind: 'idle' });
      return;
    }

    let current = true;
    setState({ kind: 'searching' });
    const timer = setTimeout(async () => {
      try {
        const { books } = await catalog.searchBooks(query);
        if (current) {
          setState(books.length > 0 ? { kind: 'results', books } : { kind: 'no-match' });
        }
      } catch (error) {
        if (current) {
          setState({
            kind: 'error',
            message:
              error instanceof CatalogOfflineError
                ? 'You seem to be offline. Connect to the internet to search for books.'
                : 'Search is not available right now. Please try again in a moment.',
          });
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [catalog, query]);

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Search books"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={setQuery}
        placeholder="Search by title or author"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={query}
      />
      <Results
        state={state}
        onOpen={(isbn) => navigation.navigate('BookDetail', { isbn })}
      />
    </View>
  );
}

function Results({ state, onOpen }: { state: State; onOpen: (isbn: string) => void }) {
  switch (state.kind) {
    case 'idle':
      return <Message text="Search for a book by title or author." />;
    case 'searching':
      return (
        <View style={styles.centered}>
          <ActivityIndicator accessibilityLabel="Searching" color={colors.primary} />
        </View>
      );
    case 'no-match':
      return <Message text="No books found. Try a different title or author." />;
    case 'error':
      return <Message text={state.message} live />;
    case 'results':
      return (
        <FlatList
          data={state.books}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(book) => book.isbn}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => onOpen(item.isbn)} style={styles.row}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>
                {[item.authors.join(', '), item.publishedYear].filter(Boolean).join(' · ')}
              </Text>
            </Pressable>
          )}
        />
      );
  }
}

function Message({ text, live = false }: { text: string; live?: boolean }) {
  return (
    <View style={styles.centered}>
      <Text accessibilityLiveRegion={live ? 'polite' : 'none'} style={styles.message}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  input: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
});
