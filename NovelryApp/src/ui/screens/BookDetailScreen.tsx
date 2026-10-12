import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { loadBookDetail, type BookDetail } from '../../core/bookDetail';
import { formatDuration } from '../../core/duration';
import { InvalidPageError, InvalidSessionError, type ReadingSession } from '../../core/storage/storage';
import { CatalogOfflineError } from '../../core/catalog/openLibraryCatalog';
import { progressPercent } from '../../core/progress';
import { SHELF_LABELS, SHELVES, type Shelf } from '../../core/shelf';
import { useAppServices } from '../AppServices';
import { ReviewSection } from './ReviewSection';
import { colors } from '../theme';

type SessionDay = 'today' | 'yesterday';

const MAX_SESSION_MINUTES = 24 * 60;

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
  const [pageText, setPageText] = useState('');
  const [minutesText, setMinutesText] = useState('');
  const [sessionDay, setSessionDay] = useState<SessionDay>('today');
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

  const savedPage = state.kind === 'ready' ? state.detail.entry?.currentPage : undefined;
  useEffect(() => {
    if (savedPage !== undefined) {
      setPageText(String(savedPage));
    }
  }, [savedPage]);

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

  const { book, entry, runningSession, sessions, review } = state.detail;
  const percent = entry ? progressPercent(entry.currentPage, book.pageCount) : null;
  const facts = [
    book.pageCount ? `${book.pageCount} pages` : null,
    book.publishedYear ? `First published ${book.publishedYear}` : null,
  ].filter(Boolean);

  async function change(action: () => Promise<unknown>, failure: string) {
    setActionError(null);
    try {
      await action();
      await load({ quiet: true });
    } catch (error) {
      // Entering a bad page is the Reader's to fix; anything else is a failure to apologise for.
      setActionError(
        error instanceof InvalidPageError || error instanceof InvalidSessionError ? error.message : failure,
      );
    }
  }

  const addToLibrary = () =>
    change(() => storage.library.add(book), 'Could not add this book. Please try again.');

  const chooseShelf = (shelf: Shelf) =>
    shelf === entry?.shelf
      ? Promise.resolve()
      : change(() => storage.library.moveToShelf(book.isbn, shelf), 'Could not move this book. Please try again.');

  function savePage() {
    const text = pageText.trim();
    if (!/^\d+$/.test(text)) {
      setActionError('Enter the page you are on, as a whole number.');
      return Promise.resolve();
    }
    return change(() => storage.library.recordPage(book.isbn, Number(text)), 'Could not save your page. Please try again.');
  }

  const startSession = () =>
    change(() => storage.sessions.start(book.isbn), 'Could not start the session. Please try again.');

  const stopSession = () =>
    change(() => storage.sessions.stop(), 'Could not stop the session. Please try again.');

  function addSessionManually() {
    const text = minutesText.trim();
    const minutes = Number(text);
    if (!/^\d+$/.test(text) || minutes < 1 || minutes > MAX_SESSION_MINUTES) {
      setActionError('Enter how many minutes you read, between 1 and 1440.');
      return Promise.resolve();
    }
    // Yesterday means the same clock time on the previous calendar day (not 24 hours ago: clocks change).
    const end = new Date();
    if (sessionDay === 'yesterday') {
      end.setDate(end.getDate() - 1);
    }
    const start = new Date(end.getTime() - minutes * 60 * 1000);
    return change(async () => {
      await storage.sessions.addManual(book.isbn, start, end);
      setMinutesText('');
    }, 'Could not add this session. Please try again.');
  }

  function confirmDeleteSession(session: ReadingSession) {
    Alert.alert('Delete this session?', `${describeSession(session)} will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          change(() => storage.sessions.remove(session.id), 'Could not delete this session. Please try again.'),
      },
    ]);
  }

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
          <View style={styles.progress}>
            <Text accessibilityRole="header" style={styles.progressTitle}>
              Your progress
            </Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Page</Text>
              <TextInput
                accessibilityLabel="Current page"
                keyboardType="number-pad"
                onChangeText={setPageText}
                onSubmitEditing={savePage}
                style={styles.pageInput}
                value={pageText}
              />
              {book.pageCount ? <Text style={styles.progressLabel}>of {book.pageCount}</Text> : null}
              <Pressable accessibilityRole="button" onPress={savePage} style={styles.saveButton}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
            {percent !== null ? (
              <Text accessibilityLabel={`${percent} percent read`} style={styles.facts}>
                {percent}% read
              </Text>
            ) : null}
          </View>
          <SessionPanel
            isbn={book.isbn}
            running={runningSession}
            onStart={startSession}
            onStop={stopSession}
          />
          <SessionHistory
            sessions={sessions}
            minutesText={minutesText}
            onMinutesChange={setMinutesText}
            day={sessionDay}
            onDayChange={setSessionDay}
            onAdd={addSessionManually}
            onDelete={confirmDeleteSession}
          />
          <ReviewSection
            storage={storage}
            isbn={book.isbn}
            review={review}
            onChanged={() => load({ quiet: true })}
          />
          <View accessibilityRole="radiogroup" style={styles.shelves}>
            {SHELVES.map((shelf) => {
              const selected = entry.shelf === shelf;
              return (
                <Pressable
                  key={shelf}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => chooseShelf(shelf)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {SHELF_LABELS[shelf]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityHint="Asks you to confirm"
            accessibilityRole="button"
            onPress={confirmRemove}
            style={styles.removeButton}
          >
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

function SessionPanel({
  isbn,
  running,
  onStart,
  onStop,
}: {
  isbn: string;
  running: ReadingSession | null;
  onStart: () => void;
  onStop: () => void;
}) {
  const thisBook = running?.isbn === isbn;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!thisBook) {
      return;
    }
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [thisBook]);

  const elapsed = running ? formatDuration((now - Date.parse(running.startedAt)) / 1000) : '';

  return (
    <View style={styles.progress}>
      <Text accessibilityRole="header" style={styles.progressTitle}>
        Reading session
      </Text>
      {thisBook ? (
        <>
          <Text accessibilityRole="timer" style={styles.timer}>
            {elapsed}
          </Text>
          <Pressable accessibilityRole="button" onPress={onStop} style={styles.button}>
            <Text style={styles.buttonText}>Stop session</Text>
          </Pressable>
        </>
      ) : (
        <OtherOrNoSession busy={running !== null} onStart={onStart} />
      )}
    </View>
  );
}

function describeSession(session: ReadingSession): string {
  const start = Date.parse(session.startedAt);
  const seconds = session.endedAt ? (Date.parse(session.endedAt) - start) / 1000 : 0;
  const day = new Date(start).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${formatDuration(seconds)}`;
}

function SessionHistory(props: {
  sessions: ReadingSession[];
  minutesText: string;
  onMinutesChange: (text: string) => void;
  day: SessionDay;
  onDayChange: (day: SessionDay) => void;
  onAdd: () => void;
  onDelete: (session: ReadingSession) => void;
}) {
  const finished = props.sessions.filter((session) => session.endedAt);
  return (
    <View style={styles.progress}>
      <Text accessibilityRole="header" style={styles.progressTitle}>
        Add a session you forgot to time
      </Text>
      <View style={styles.progressRow}>
        <TextInput
          accessibilityLabel="Minutes read"
          keyboardType="number-pad"
          onChangeText={props.onMinutesChange}
          placeholder="Minutes"
          style={styles.pageInput}
          value={props.minutesText}
        />
        {(['today', 'yesterday'] as const).map((day) => (
          <Pressable
            key={day}
            accessibilityRole="radio"
            accessibilityState={{ checked: props.day === day }}
            onPress={() => props.onDayChange(day)}
            style={[styles.chip, props.day === day && styles.chipSelected]}
          >
            <Text style={[styles.chipText, props.day === day && styles.chipTextSelected]}>
              {day === 'today' ? 'Today' : 'Yesterday'}
            </Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={props.onAdd} style={styles.saveButton}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>
      {finished.map((session) => (
        <View key={session.id} style={styles.progressRow}>
          <Text style={styles.progressLabel}>{describeSession(session)}</Text>
          <Pressable
            accessibilityLabel={`Delete session ${describeSession(session)}`}
            accessibilityRole="button"
            onPress={() => props.onDelete(session)}
            style={styles.removeButton}
          >
            <Text style={styles.removeText}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function OtherOrNoSession({ busy, onStart }: { busy: boolean; onStart: () => void }) {
  if (busy) {
    return <Text style={styles.facts}>Another reading session is running. Stop it before starting a new one.</Text>;
  }
  return (
    <Pressable accessibilityRole="button" onPress={onStart} style={styles.button}>
      <Text style={styles.buttonText}>Start reading session</Text>
    </Pressable>
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
  timer: { fontSize: 36, fontWeight: '700', color: colors.primary, marginTop: 8, fontVariant: ['tabular-nums'] },
  progress: { alignItems: 'center', marginTop: 16 },
  progressTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  progressLabel: { fontSize: 16, color: colors.text, marginHorizontal: 8 },
  pageInput: {
    minWidth: 64,
    minHeight: 44,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  saveButton: { marginLeft: 8, minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.primary },
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
