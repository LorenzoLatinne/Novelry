import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  InvalidReviewError,
  MAX_REVIEW_COMMENT_LENGTH,
  type Review,
  type Storage,
} from '../../core/storage/storage';
import { colors } from '../theme';

const RATINGS = [1, 2, 3, 4, 5] as const;

/** The Reader's private Rating and comment on a Book. */
export function ReviewSection({
  storage,
  isbn,
  review,
  onChanged,
}: {
  storage: Storage;
  isbn: string;
  review: Review | null;
  onChanged: () => void;
}) {
  const [rating, setRating] = useState<number>(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.comment ?? '');
  const [message, setMessage] = useState<string | null>(null);

  // Follow the saved Review when it changes (saved, deleted, or loaded for the first time).
  useEffect(() => {
    setRating(review?.rating ?? 0);
    setComment(review?.comment ?? '');
  }, [review]);

  async function save() {
    if (rating === 0) {
      setMessage('Choose a Rating from 1 to 5 stars.');
      return;
    }
    try {
      await storage.reviews.save(isbn, { rating, comment });
      setMessage('Review saved.');
      onChanged();
    } catch (error) {
      setMessage(
        error instanceof InvalidReviewError ? error.message : 'Could not save your review. Please try again.',
      );
    }
  }

  function confirmDelete() {
    Alert.alert('Delete your review?', 'Your Rating and comment will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await storage.reviews.remove(isbn);
            setMessage(null);
            onChanged();
          } catch {
            setMessage('Could not delete your review. Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Your review
      </Text>
      <Text style={styles.note}>Only you can see this.</Text>
      <View accessibilityRole="radiogroup" style={styles.stars}>
        {RATINGS.map((value) => (
          <Pressable
            key={value}
            accessibilityLabel={`${value} ${value === 1 ? 'star' : 'stars'}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: rating === value }}
            onPress={() => setRating(value)}
            style={styles.star}
          >
            <Text style={[styles.starText, value <= rating && styles.starFilled]}>
              {value <= rating ? '★' : '☆'}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        accessibilityLabel="Review comment"
        maxLength={MAX_REVIEW_COMMENT_LENGTH}
        multiline
        onChangeText={setComment}
        placeholder="What did you think?"
        placeholderTextColor={colors.textMuted}
        style={styles.comment}
        value={comment}
      />
      <Text style={styles.note}>
        {comment.length}/{MAX_REVIEW_COMMENT_LENGTH}
      </Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={save} style={styles.saveButton}>
          <Text style={styles.saveText}>Save review</Text>
        </Pressable>
        {review ? (
          <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete review</Text>
          </Pressable>
        ) : null}
      </View>
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', alignItems: 'center', marginTop: 24 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  note: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  stars: { flexDirection: 'row', marginTop: 8 },
  star: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  starText: { fontSize: 32, color: colors.textMuted },
  starFilled: { color: colors.primary },
  comment: {
    alignSelf: 'stretch',
    minHeight: 96,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  saveButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  deleteButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  deleteText: { color: colors.error, fontSize: 16, fontWeight: '600' },
  message: { marginTop: 8, fontSize: 16, color: colors.text, textAlign: 'center' },
});
