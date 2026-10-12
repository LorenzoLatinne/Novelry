import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type PermissionResponse } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { parseIsbn } from '../../core/isbn';
import type { RootStackParamList } from '../RootNavigator';
import { colors } from '../theme';

const NOT_A_BOOK = 'That doesn’t look like a book barcode. Try the barcode on the back cover.';
const RESCAN_DELAY_MS = 2000;
const CAMERA_EXPLANATION =
  'Novelry uses the camera only to scan a book’s barcode (ISBN). Nothing is recorded or stored.';
const NOT_AN_ISBN = 'That isn’t a valid ISBN. Check the number and try again.';

export function ScanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const handled = useRef(false);
  const rearmTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(rearmTimer.current), []);

  function show(text: string) {
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
  }

  function openBook(isbn: string) {
    navigation.replace('BookDetail', { isbn });
  }

  function onScanned(data: string) {
    if (handled.current) {
      return;
    }
    handled.current = true;
    const isbn = parseIsbn(data);
    if (isbn) {
      openBook(isbn);
      return;
    }
    show(NOT_A_BOOK);
    // Allow another attempt shortly, without re-firing on every camera frame.
    rearmTimer.current = setTimeout(() => {
      handled.current = false;
    }, RESCAN_DELAY_MS);
  }

  function lookUpTyped() {
    if (handled.current) {
      return;
    }
    const isbn = parseIsbn(typed);
    if (isbn) {
      handled.current = true;
      openBook(isbn);
    } else {
      show(NOT_AN_ISBN);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
    >
      <CameraOrPrompt permission={permission} onAllow={requestPermission} onScanned={onScanned} />

      {message ? (
        <Text accessibilityLiveRegion="assertive" style={styles.error}>
          {message}
        </Text>
      ) : null}

      <View style={styles.manual}>
        <Text style={styles.label}>Or type the ISBN</Text>
        <TextInput
          accessibilityLabel="ISBN"
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={(text) => {
            setTyped(text);
            setMessage(null);
          }}
          onSubmitEditing={lookUpTyped}
          placeholder="978…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={styles.input}
          value={typed}
        />
        <Pressable accessibilityRole="button" onPress={lookUpTyped} style={styles.button}>
          <Text style={styles.buttonText}>Look up</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function CameraOrPrompt(props: {
  permission: PermissionResponse | null;
  onAllow: () => void;
  onScanned: (data: string) => void;
}) {
  if (props.permission?.granted) {
    return (
      <CameraView
        accessibilityLabel="Camera. Point it at the barcode on the back of a book."
        barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
        onBarcodeScanned={({ data }) => props.onScanned(data)}
        style={styles.camera}
      />
    );
  }

  return (
    <View style={[styles.camera, styles.rationale]}>
      <Text style={styles.rationaleText}>{CAMERA_EXPLANATION}</Text>
      {props.permission?.canAskAgain ?? true ? (
        <Pressable accessibilityRole="button" onPress={props.onAllow} style={styles.button}>
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} style={styles.button}>
          <Text style={styles.buttonText}>Open settings</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, backgroundColor: colors.background },
  camera: { height: 300, backgroundColor: '#000000' },
  rationale: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.surface },
  rationaleText: { fontSize: 16, color: colors.text, textAlign: 'center' },
  manual: { padding: 24 },
  label: { fontSize: 16, color: colors.text, marginBottom: 8 },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  error: { margin: 16, marginBottom: 0, color: colors.error, fontSize: 16, textAlign: 'center' },
  button: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
});
