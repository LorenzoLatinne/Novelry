import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';

export type GoalProgressView = {
  /** E.g. "2 of 8 books". */
  headline: string;
  percent: number;
  reached: boolean;
};

/** Everything the Reader reads on a goal card, so one card serves every kind of goal. */
export type GoalCopy = {
  setHeading: string;
  unsetHeading: string;
  prompt: string;
  inputLabel: string;
  placeholder: string;
  invalidInput: string;
  setButton: string;
  changeButton: string;
  removeButton: string;
  removeTitle: string;
  barLabel: (percent: number) => string;
};

/** A reading goal: set, change or remove the target, and see how far along the Reader is. */
export function GoalCard({
  copy,
  progress,
  currentTarget,
  onSet,
  onRemove,
}: {
  copy: GoalCopy;
  /** Null when no goal is set. */
  progress: GoalProgressView | null;
  currentTarget: number | null;
  /** Resolves to an error message for the Reader, or null when the goal was saved. */
  onSet: (target: number) => Promise<string | null>;
  /** Resolves to an error message for the Reader, or null when the goal was removed. */
  onRemove: () => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmed = text.trim();
    if (!/^\d+$/.test(trimmed)) {
      setError(copy.invalidInput);
      return;
    }
    const problem = await onSet(Number(trimmed));
    setError(problem);
    if (!problem) {
      setEditing(false);
      setText('');
    }
  }

  function cancelEditing() {
    setEditing(false);
    setText('');
    setError(null);
  }

  function confirmRemove() {
    Alert.alert(copy.removeTitle, 'Your reading is not affected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => setError(await onRemove()) },
    ]);
  }

  const showForm = editing || !progress;

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {progress ? copy.setHeading : copy.unsetHeading}
      </Text>
      {progress ? (
        <>
          <Text style={styles.headline}>{progress.headline}</Text>
          <View
            accessibilityLabel={copy.barLabel(progress.percent)}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: progress.percent }}
            style={styles.track}
          >
            <View style={[styles.fill, { width: `${progress.percent}%` }]} />
          </View>
          <Text style={styles.detail}>
            {progress.reached ? 'Goal reached. Well done!' : `${progress.percent}% of the way there`}
          </Text>
        </>
      ) : (
        <Text style={styles.detail}>{copy.prompt}</Text>
      )}

      {showForm ? (
        <View style={styles.row}>
          <TextInput
            accessibilityLabel={copy.inputLabel}
            keyboardType="number-pad"
            onChangeText={(value) => {
              setText(value);
              setError(null);
            }}
            onSubmitEditing={save}
            placeholder={currentTarget === null ? copy.placeholder : String(currentTarget)}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={text}
          />
          <Pressable accessibilityRole="button" onPress={save} style={styles.button}>
            <Text style={styles.buttonText}>{progress ? 'Save' : copy.setButton}</Text>
          </Pressable>
          {progress ? (
            <Pressable accessibilityRole="button" onPress={cancelEditing} style={styles.linkButton}>
              <Text style={styles.linkText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={styles.linkButton}>
            <Text style={styles.linkText}>{copy.changeButton}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={confirmRemove} style={styles.linkButton}>
            <Text style={styles.removeText}>{copy.removeButton}</Text>
          </Pressable>
        </View>
      )}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  headline: { fontSize: 20, fontWeight: '700', color: colors.primary, marginTop: 8 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.border, marginTop: 8, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5, backgroundColor: colors.primary },
  detail: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: {
    minWidth: 80,
    minHeight: 44,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginLeft: 8,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  linkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  removeText: { color: colors.error, fontSize: 16, fontWeight: '600' },
  error: { marginTop: 8, color: colors.error, fontSize: 14 },
});
