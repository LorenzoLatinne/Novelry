import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
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
export function RecommendationsSection({ onOpen }: { onOpen: (isbn: string) => void }) {
  const services = useAppServices();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setState((current) => (current.kind === 'ok' ? current : { kind: 'loading' }));
    try {
      const result = await loadRecommendations(services, new Date());
      if (request === latest.current) {
        setState(result.status === 'ok' ? { kind: 'ok', recommendations: result.recommendations } : { kind: result.status });
      }
    } catch (error) {
      if (request === latest.current) {
        setState({ kind: 'error', offline: error instanceof CatalogOfflineError });
      }
    }
  }, [services]);

  // Look again whenever the Explore tab comes into view: the Library, Ratings and dismissals may have changed.
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        latest.current++;
      };
    }, [load]),
  );

  async function dismiss(isbn: string) {
    setState((current) =>
      current.kind === 'ok'
        ? { kind: 'ok', recommendations: current.recommendations.filter((r) => r.book.isbn !== isbn) }
        : current,
    );
    try {
      await services.storage.dismissals.add(isbn);
    } catch {
      load(); // could not remember it: show the truth again
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
        <Note
          title="Recommendations will appear here"
          text="Finish, rate or favorite a few books, and Novelry will suggest more you might like, right on your phone."
        />
      );
    case 'none':
      return (
        <Note
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
          <Pressable accessibilityRole="button" onPress={load} style={styles.button}>
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
        </View>
      );
  }
}

function Note({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.centered}>
      <Text accessibilityRole="header" style={styles.noteTitle}>
        {title}
      </Text>
      <Text style={styles.noteText}>{text}</Text>
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
  dismissText: { fontSize: 14, color: colors.textMuted, textDecorationLine: 'underline' },
});
