import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  optional?: boolean;
}

export function FormField({ label, value, onChangeText, placeholder, multiline = false, keyboardType, autoCapitalize = 'sentences', secureTextEntry = false, optional = false }: FormFieldProps) {
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{optional ? ' (optional)' : ''}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#858B82"
          secureTextEntry={hidden}
          style={[styles.input, multiline && styles.multilineInput, secureTextEntry && styles.inputWithIcon]}
          textAlignVertical={multiline ? 'top' : 'center'}
          value={value}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            onPress={() => setHidden((value) => !value)}
            style={styles.eyeButton}
          >
            {hidden ? <Eye size={17} color="#777D74" /> : <EyeOff size={17} color="#777D74" />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 13 },
  label: { color: '#343A32', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: { minHeight: 44, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE1D9', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 10, color: '#20251F', fontSize: 13 },
  inputWithIcon: { paddingRight: 42 },
  multilineInput: { minHeight: 80 },
  eyeButton: { position: 'absolute', right: 4, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
