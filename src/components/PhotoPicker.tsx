import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ImagePlus, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface PhotoPickerProps {
  photoUris: string[];
  onChange: (uris: string[]) => void;
  maxPhotos?: number;
}

export function PhotoPicker({ photoUris, onChange, maxPhotos = 3 }: PhotoPickerProps) {
  async function pickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        onChange([...photoUris, result.assets[0].uri].slice(0, maxPhotos));
      }
    } catch {
      Alert.alert('Unable to open photos', 'Please try choosing a photo again.');
    }
  }

  function removePhoto(uri: string) {
    onChange(photoUris.filter((item) => item !== uri));
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {photoUris.map((uri) => (
          <View key={uri} style={styles.photoWrap}>
            <Image source={{ uri }} style={styles.photo} />
            <Pressable accessibilityLabel="Remove photo" onPress={() => removePhoto(uri)} style={styles.removeButton}>
              <X size={13} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
        {photoUris.length < maxPhotos ? (
          <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.addButton}>
            <ImagePlus size={20} color="#39765F" />
            <Text style={styles.addText}>Add photo</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.hint}>{photoUris.length}/{maxPhotos} photos · optional but helps identification</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrap: { width: 96, height: 96, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#DDE1D9' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeButton: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(32, 37, 31, 0.75)', alignItems: 'center', justifyContent: 'center' },
  addButton: { width: 96, height: 96, borderRadius: 8, borderWidth: 1, borderColor: '#DDE1D9', borderStyle: 'dashed', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 5 },
  addText: { color: '#39765F', fontSize: 10, fontWeight: '700' },
  hint: { color: '#858B82', fontSize: 10, marginTop: 6 },
});
