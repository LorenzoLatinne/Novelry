import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CatalogOfflineError } from '../../core/catalog/openLibraryCatalog';
import { loadRecommendations } from '../../core/recommendationsFeed';
import type { Recommendation } from '../../core/recommendations';
import { useAppServices } from '../AppServices';
import { colors } from '../theme';

type State =
  | { kind: 'loading' }
  | { kind: 'no-taste' }
  | { kind: 'none' }
  | { kind: 'error'; offline: boolean }
  | { kind: 'ok'; recommendations: Recommendation[] };

/** "Recommended for you": Books that fit the Reader's taste, each with the reason, worked out on the device. */
/** Genres offered to a Reader with nothing to go on yet; choosing one fills the search box. */
const STARTER_GENRES = ['Fantasy', 'Mystery', 'Romance', 'Science Fiction', 'Historical Fiction', 'Thriller'];

export function RecommendationsSection({
  onOpen,
  onPickGenre,
}: {
  onOpen: (isbn: string) => void;
  onPickGenre: (genre: string) => void;
}) {
  const services = useAppServices();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const latestRequest = useRef(0);

  // Only the very first load (and an explicit retry) shows a spinner; looking again later keeps what is on screen.
  const load = useCallback(
    async ({ showSpinner = false }: { showSpinner?: boolean } = {}) => {
      const request = ++latestRequest.current;
      if (showSpinner) {
        setState({ kind: 'loading' });
      }
      try {
        const result = await loadRecommendations(services, new Date());
        if (request === latestRequest.current) {
          setState(result.status === 'ok' ? { kind: 'ok', recommendations: result.recommendations } : { kind: result.status });
        }
      } catch (error) {
        if (request === latestRequest.current) {
          // If we already have recommendations on screen, a failed refresh should not take them away.
          setState((current) =>
            current.kind === 'ok' ? current : { kind: 'error', offline: error instanceof CatalogOfflineError },
          );
        }
      }
    },
    [services],
  );

  // Look again whenever the Explore tab comes into view: the Library, Ratings and dismissals may have changed.
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        latestRequest.current++;
      };
    }, [load]),
  );

  async function dismiss(isbn: string) {
    latestRequest.current++; // an answer already on its way may still contain this Book: ignore it
    setState((current) =>
      current.kind === 'ok'
        ? { kind: 'ok', recommendations: current.recommendations.filter((r) => r.book.isbn !== isbn) }
        : current,
    );
    try {
      await services.storage.dismissals.add(isbn);
    } catch {
      load({ showSpinner: false }); // could not remember it: show the truth again
    }
  }

  switch (state.kind) {
    case 'loading':
      return (
        <View style={styles.centered}>
          <ActivityIndicator accessibilityLabel="Finding recommendations" color={colors.primary} />
        </View>
      );
    case 'no-taste':
      return (
        <InfoMessage
          title="Recommendations will appear here"
          text="Finish, rate or favorite a few books, and Novelry will recommend more you might like. Or start with a genre:"
        >
          <View style={styles.genres}>
            {STARTER_GENRES.map((genre) => (
              <Pressable
                key={genre}
                accessibilityRole="button"
                onPress={() => onPickGenre(genre)}
                style={styles.genre}
              >
                <Text style={styles.genreText}>{genre}</Text>
              </Pressable>
            ))}
          </View>
        </InfoMessage>
      );
    case 'none':
      return (
        <InfoMessage
          title="Nothing new to recommend right now"
          text="Everything that fits your taste is already in your Library or dismissed. Try a search instead."
        />
      );
    case 'error':
      return (
        <View style={styles.centered}>
          <Text accessibilityLiveRegion="polite" style={styles.noteText}>
            {state.offline
              ? 'You seem to be offline. Connect to the internet to see recommendations.'
              : 'Recommendations are not available right now.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => load({ showSpinner: true })} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    case 'ok':
      return (
        <View style={styles.list}>
          <Text accessibilityRole="header" style={styles.heading}>
            Recommended for you
          </Text>
          {state.recommendations.map(({ book, reason }) => (
            <View key={book.isbn} style={styles.card}>
              <Pressable accessibilityRole="button" onPress={() => onOpen(book.isbn)}>
                <Text style={styles.title}>{book.title}</Text>
                {book.authors.length > 0 ? <Text style={styles.meta}>{book.authors.join(', ')}</Text> : null}
                <Text style={styles.reason}>{reason}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Not interested in ${book.title}`}
                accessibilityRole="button"
                onPress={() => dismiss(book.isbn)}
                style={styles.dismiss}
              >
                <Text style={styles.dismissText}>Not interested</Text>
              </Pressable>
            </View>
          ))}
          <Text style={styles.disclosure}>
            Recommendations are worked out on your phone. To find books, Novelry looks up the genres you like on Open Library.
          </Text>
        </View>
      );
  }
}

function InfoMessage({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <View style={styles.centered}>
      <Text accessibilityRole="header" style={styles.noteTitle}>
        {title}
      </Text>
      <Text style={styles.noteText}>{text}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  noteTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  noteText: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  button: { marginTop: 16, minHeight: 44, justifyContent: 'center', paddingHorizontal: 24, borderRadius: 8, backgroundColor: colors.primary },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  list: { paddingHorizontal: 16 },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  card: { padding: 16, marginBottom: 8, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  reason: { fontSize: 14, color: colors.primary, marginTop: 6 },
  dismiss: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  genres: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  genre: { minHeight: 44, justifyContent: 'center', margin: 4, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  genreText: { fontSize: 14, color: colors.text },
  disclosure: { fontSize: 12, color: colors.textMuted, marginTop: 8, marginBottom: 16 },
  dismissText: { fontSize: 14, color: colors.textMuted, textDecorationLine: 'underline' },
});
