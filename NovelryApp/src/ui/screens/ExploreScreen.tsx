import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Book } from '../../core/catalog/book';
import { CatalogOfflineError } from '../../core/catalog/openLibraryCatalog';
import { useAppServices } from '../AppServices';
import { RecommendationsSection } from './RecommendationsSection';
import type { RootStackParamList } from '../RootNavigator';
import { colors } from '../theme';

/** Wait for the Reader to stop typing before asking Open Library, to be rate-limit friendly. */
const SEARCH_DELAY_MS = 400;

type SearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; books: Book[] }
  | { kind: 'no-match' }
  | { kind: 'error'; reason: 'offline' | 'unavailable' };

const ERROR_MESSAGES = {
  offline: 'You seem to be offline. Connect to the internet to search for books.',
  unavailable: 'Search is not available right now. Please try again in a moment.',
};

export function ExploreScreen() {
  const { catalog } = useAppServices();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ kind: 'idle' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setState({ kind: 'idle' });
      return;
    }

    let current = true;
    setState({ kind: 'searching' });
    const timer = setTimeout(async () => {
      try {
        const { books } = await catalog.searchBooks(trimmed);
        if (current) {
          setState(books.length > 0 ? { kind: 'results', books } : { kind: 'no-match' });
        }
      } catch (error) {
        if (current) {
          setState({
            kind: 'error',
            reason: error instanceof CatalogOfflineError ? 'offline' : 'unavailable',
          });
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [catalog, query, attempt]);

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
        returnKeyType="done"
        style={styles.input}
        value={query}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Scan')}
        style={styles.scanLink}
      >
        <Text style={styles.scanLinkText}>Scan a barcode instead</Text>
      </Pressable>
      <Results
        state={state}
        onOpen={(isbn) => navigation.navigate('BookDetail', { isbn })}
        onRetry={() => setAttempt((n) => n + 1)}
        onPickGenre={setQuery}
      />
    </View>
  );
}

function Results({
  state,
  onOpen,
  onRetry,
  onPickGenre,
}: {
  state: SearchState;
  onOpen: (isbn: string) => void;
  onRetry: () => void;
  onPickGenre: (genre: string) => void;
}) {
  switch (state.kind) {
    case 'idle':
      return (
        <ScrollView keyboardShouldPersistTaps="handled">
          <Message text="Search for a book by title or author." />
          <RecommendationsSection onOpen={onOpen} onPickGenre={onPickGenre} />
        </ScrollView>
      );
    case 'searching':
      return (
        <View style={styles.centered}>
          <ActivityIndicator accessibilityLabel="Searching" color={colors.primary} />
        </View>
      );
    case 'no-match':
      return <Message text="No books found. Try a different title or author." live />;
    case 'error':
      return (
        <View style={styles.centered}>
          <Text accessibilityLiveRegion="polite" style={styles.message}>
            {ERROR_MESSAGES[state.reason]}
          </Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    case 'results':
      return (
        <FlatList
          data={state.books}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(book) => book.isbn}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => onOpen(item.isbn)} style={styles.row}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              {meta(item) ? <Text style={styles.rowMeta}>{meta(item)}</Text> : null}
            </Pressable>
          )}
        />
      );
  }
}

function meta(book: Book): string {
  return [book.authors.join(', '), book.publishedYear].filter(Boolean).join(' · ');
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
  scanLink: { marginHorizontal: 16, marginBottom: 8, minHeight: 44, justifyContent: 'center' },
  scanLinkText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  button: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: colors.primary },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  rowMeta: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
});
