import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadBookDetail, type BookDetail } from '../../core/bookDetail';
import { CatalogOfflineError } from '../../core/catalog/openLibraryCatalog';
import { SHELF_LABELS, SHELVES, type Shelf } from '../../core/shelf';
import { useAppServices } from '../AppServices';
import { colors } from '../theme';

type State =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; detail: BookDetail };

function toErrorState(error: unknown): State {
  return {
    kind: 'error',
    message:
      error instanceof CatalogOfflineError
        ? 'You seem to be offline. Connect to the internet to see this book.'
        : 'This book could not be loaded right now. Please try again.',
  };
}

export function BookDetailScreen({ isbn }: { isbn: string }) {
  const { storage, catalog } = useAppServices();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const [actionError, setActionError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      const request = ++latestRequest.current;
      const isCurrent = () => latestRequest.current === request;
      if (!quiet) {
        setState({ kind: 'loading' });
      }
      try {
        const detail = await loadBookDetail({ storage, catalog }, isbn);
        if (isCurrent()) {
          setState(detail ? { kind: 'ready', detail } : { kind: 'not-found' });
        }
      } catch (error) {
        if (isCurrent()) {
          setState(toErrorState(error));
        }
      }
    },
    [storage, catalog, isbn],
  );

  useEffect(() => {
    load();
    return () => {
      latestRequest.current++; // ignore any answer that arrives after we are gone
    };
  }, [load]);

  if (state.kind === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Loading" color={colors.primary} />
      </View>
    );
  }

  if (state.kind === 'not-found') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We couldn’t find a book with ISBN {isbn}.</Text>
      </View>
    );
  }

  if (state.kind === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{state.message}</Text>
        <Pressable accessibilityRole="button" onPress={() => load()} style={styles.button}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const { book, entry } = state.detail;
  const facts = [
    book.pageCount ? `${book.pageCount} pages` : null,
    book.publishedYear ? `First published ${book.publishedYear}` : null,
  ].filter(Boolean);

  async function change(action: () => Promise<void>, failure: string) {
    setActionError(null);
    try {
      await action();
      await load({ quiet: true });
    } catch {
      setActionError(failure);
    }
  }

  const addToLibrary = () =>
    change(() => storage.library.add(book), 'Could not add this book. Please try again.');

  const moveToShelf = (shelf: Shelf) =>
    change(() => storage.library.moveToShelf(book.isbn, shelf), 'Could not move this book. Please try again.');

  function confirmRemove() {
    Alert.alert('Remove from Library?', `“${book.title}” will be removed from your Library.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          change(() => storage.library.remove(book.isbn), 'Could not remove this book. Please try again.'),
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {book.coverUrl ? (
        <Image
          accessibilityLabel={`Cover of ${book.title}`}
          source={{ uri: book.coverUrl }}
          style={styles.cover}
          resizeMode="contain"
        />
      ) : null}
      <Text accessibilityRole="header" style={styles.title}>
        {book.title}
      </Text>
      {book.authors.length > 0 ? <Text style={styles.authors}>{book.authors.join(', ')}</Text> : null}
      {facts.length > 0 ? <Text style={styles.facts}>{facts.join(' · ')}</Text> : null}
      {book.genres.length > 0 ? <Text style={styles.facts}>{book.genres.join(', ')}</Text> : null}
      {book.description ? <Text style={styles.description}>{book.description}</Text> : null}

      {entry ? (
        <>
          <Text style={styles.shelf}>In your Library · {SHELF_LABELS[entry.shelf]}</Text>
          <View accessibilityRole="radiogroup" style={styles.shelves}>
            {SHELVES.map((shelf) => {
              const selected = entry.shelf === shelf;
              return (
                <Pressable
                  key={shelf}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => moveToShelf(shelf)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {SHELF_LABELS[shelf]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable accessibilityRole="button" onPress={confirmRemove} style={styles.removeButton}>
            <Text style={styles.removeText}>Remove from Library</Text>
          </Pressable>
        </>
      ) : (
        <Pressable accessibilityRole="button" onPress={addToLibrary} style={styles.button}>
          <Text style={styles.buttonText}>Add to Library</Text>
        </Pressable>
      )}
      {actionError ? (
        <Text accessibilityLiveRegion="polite" style={[styles.message, styles.actionError]}>
          {actionError}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  content: { padding: 24, alignItems: 'center', backgroundColor: colors.background },
  cover: { width: 180, height: 270, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  authors: { fontSize: 16, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  facts: { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  description: { fontSize: 16, color: colors.text, marginTop: 16, lineHeight: 22 },
  shelf: { fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: 24 },
  shelves: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    margin: 4,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.onPrimary, fontWeight: '600' },
  removeButton: { marginTop: 16, minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  removeText: { color: colors.error, fontSize: 16, fontWeight: '600' },
  actionError: { marginTop: 16 },
  message: { fontSize: 16, color: colors.text, textAlign: 'center' },
  button: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: colors.primary },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
});
