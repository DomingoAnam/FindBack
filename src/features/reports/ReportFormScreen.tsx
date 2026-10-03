import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { ContactCard } from '../../components/ContactCard';
import { FormField } from '../../components/FormField';
import { PhotoPicker } from '../../components/PhotoPicker';
import { REPORT_CATEGORIES, type ContactSettings, type NewReport, type ReportKind } from '../../types/report';

interface ReportFormScreenProps {
  settings: ContactSettings | null;
  onSubmit: (report: NewReport) => Promise<string>;
}

export function ReportFormScreen({ settings, onSubmit }: ReportFormScreenProps) {
  const [kind, setKind] = useState<ReportKind>('lost');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [occurredDate, setOccurredDate] = useState('');
  const [occurredTime, setOccurredTime] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const requiredFilled = name.trim() && category && description.trim() && occurredDate.trim() && occurredTime.trim() && location.trim();

  function validate(): string | null {
    if (!name.trim()) return 'Enter the item name.';
    if (!category) return 'Choose a category.';
    if (!description.trim()) return 'Describe the item.';
    if (!occurredDate.trim()) return `Enter the date it was ${kind}.`;
    if (!occurredTime.trim()) return `Enter the approximate time it was ${kind}.`;
    if (!location.trim()) return `Enter where it was ${kind}.`;
    return null;
  }

  function requestSubmit() {
    const problem = validate();
    if (problem) {
      Alert.alert('Complete the report', problem);
      return;
    }
    setConfirming(true);
  }

  function resetForm() {
    setName('');
    setCategory('');
    setDescription('');
    setOccurredDate('');
    setOccurredTime('');
    setLocation('');
    setColor('');
    setBrand('');
    setModel('');
    setDistinguishingFeatures('');
    setAdditionalInfo('');
    setPhotoUris([]);
  }

  async function confirmSubmit() {
    setConfirming(false);
    setSubmitting(true);
    try {
      const code = await onSubmit({
        kind,
        name: name.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        occurredDate: occurredDate.trim(),
        occurredTime: occurredTime.trim(),
        color: color.trim(),
        brand: brand.trim(),
        model: model.trim(),
        distinguishingFeatures: distinguishingFeatures.trim(),
        additionalInfo: additionalInfo.trim(),
        photoUris,
      });
      resetForm();
      setSubmittedCode(code);
    } catch (error) {
      Alert.alert('Report not published', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedCode) {
    return (
      <View style={styles.successWrap}>
        <CheckCircle2 size={52} color="#39765F" />
        <Text style={styles.successTitle}>Report Submitted!</Text>
        <Text style={styles.successText}>Your report has been recorded successfully.</Text>
        <View style={styles.successCard}>
          <Text style={styles.successLabel}>Report ID</Text>
          <Text style={styles.successCode}>{submittedCode}</Text>
          <Text style={styles.successLabel}>Status</Text>
          <Text style={styles.successStatus}>Reported</Text>
        </View>
        <Text style={styles.successNote}>You will receive a notification if a possible match is identified.</Text>
        <Pressable onPress={() => setSubmittedCode(null)} style={styles.submitButton}>
          <Text style={styles.submitText}>Create another report</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>HELP THE COMMUNITY</Text>
      <Text style={styles.title}>{kind === 'lost' ? 'Report a lost item' : 'Report a found item'}</Text>
      <Text style={styles.subtitle}>Share enough detail to help identify the item. Keep private details in ‘Distinguishing features’ — they are only used for verification.</Text>

      <View style={styles.kindSwitch}>
        {(['lost', 'found'] as const).map((option) => {
          const selected = kind === option;
          return (
            <Pressable key={option} onPress={() => setKind(option)} style={[styles.kindOption, selected && styles.selectedKind]}>
              <Text style={[styles.kindText, selected && styles.selectedKindText]}>{option === 'lost' ? 'I lost an item' : 'I found an item'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>ITEM INFORMATION</Text>
      <FormField label="Item name" onChangeText={setName} placeholder="e.g. Brown leather wallet" value={name} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {REPORT_CATEGORIES.map((option) => {
          const selected = category === option;
          return (
            <Pressable key={option} onPress={() => setCategory(option)} style={[styles.categoryChip, selected && styles.selectedCategoryChip]}>
              <Text style={[styles.categoryChipText, selected && styles.selectedCategoryChipText]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <FormField label="Description" onChangeText={setDescription} placeholder="What does it look like? What is inside?" value={description} multiline />
      <FormField label={kind === 'lost' ? 'Date lost' : 'Date found'} onChangeText={setOccurredDate} placeholder="e.g. 2026-10-03" value={occurredDate} />
      <FormField label="Approximate time" onChangeText={setOccurredTime} placeholder="e.g. Around 2:30 PM" value={occurredTime} />
      <FormField label={`Location where it was ${kind}`} onChangeText={setLocation} placeholder="e.g. Fish section, stall 12" value={location} />
      <FormField label="Color" onChangeText={setColor} placeholder="e.g. Dark brown" value={color} optional />
      <FormField label="Brand" onChangeText={setBrand} placeholder="e.g. Samsung" value={brand} optional />
      <FormField label="Model" onChangeText={setModel} placeholder="e.g. Galaxy A14" value={model} optional />
      <FormField label="Distinguishing features" onChangeText={setDistinguishingFeatures} placeholder="Unique marks only the owner would know" value={distinguishingFeatures} multiline optional />
      <FormField label="Other relevant information" onChangeText={setAdditionalInfo} placeholder="Anything else that may help" value={additionalInfo} multiline optional />

      <Text style={styles.sectionLabel}>PHOTOS</Text>
      <PhotoPicker photoUris={photoUris} onChange={setPhotoUris} />

      {settings ? (
        <>
          <Text style={styles.sectionLabel}>RECOVERY INFORMATION</Text>
          <ContactCard settings={settings} title={kind === 'lost' ? 'WHERE CAN I PICK UP OR CONTACT US?' : 'WHERE CAN THE OWNER CLAIM THE ITEM?'} />
        </>
      ) : null}

      <Pressable disabled={submitting || !requiredFilled} onPress={requestSubmit} style={[styles.submitButton, (submitting || !requiredFilled) && styles.disabledButton]}>
        <Text style={styles.submitText}>{submitting ? 'Publishing...' : 'Submit report'}</Text>
      </Pressable>

      <Modal animationType="fade" onRequestClose={() => setConfirming(false)} transparent visible={confirming}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Submit Report?</Text>
            <Text style={styles.confirmText}>Please make sure the information you entered is correct.</Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setConfirming(false)} style={[styles.confirmButton, styles.confirmCancel]}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { void confirmSubmit(); }} style={[styles.confirmButton, styles.confirmSubmit]}>
                <Text style={styles.confirmSubmitText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 28 },
  eyebrow: { color: '#39765F', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#20251F', fontSize: 27, fontWeight: '800', marginTop: 7 },
  subtitle: { color: '#697067', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 18 },
  kindSwitch: { flexDirection: 'row', backgroundColor: '#E9ECE6', padding: 4, borderRadius: 8, marginBottom: 20 },
  kindOption: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 6 },
  selectedKind: { backgroundColor: '#FFFFFF' },
  kindText: { color: '#687066', fontSize: 12, fontWeight: '600' },
  selectedKindText: { color: '#30372E' },
  sectionLabel: { color: '#39765F', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 12, marginTop: 6 },
  label: { color: '#343A32', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  categoryChip: { borderWidth: 1, borderColor: '#DDE1D9', borderRadius: 7, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: '#FFFFFF' },
  selectedCategoryChip: { backgroundColor: '#30372E', borderColor: '#30372E' },
  categoryChipText: { color: '#596258', fontSize: 11, fontWeight: '600' },
  selectedCategoryChipText: { color: '#FFFFFF' },
  submitButton: { alignItems: 'center', backgroundColor: '#C64C32', borderRadius: 7, paddingVertical: 13, marginTop: 5 },
  disabledButton: { opacity: 0.55 },
  submitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  confirmBackdrop: { flex: 1, backgroundColor: 'rgba(32, 37, 31, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  confirmCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 22, width: '100%' },
  confirmTitle: { color: '#20251F', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  confirmText: { color: '#697067', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmButton: { flex: 1, alignItems: 'center', borderRadius: 7, paddingVertical: 12 },
  confirmCancel: { backgroundColor: '#EFF1ED' },
  confirmCancelText: { color: '#596258', fontSize: 12, fontWeight: '700' },
  confirmSubmit: { backgroundColor: '#C64C32' },
  confirmSubmitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 8 },
  successTitle: { color: '#20251F', fontSize: 22, fontWeight: '800', marginTop: 8 },
  successText: { color: '#697067', fontSize: 13, textAlign: 'center' },
  successCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 10, padding: 18, alignItems: 'center', marginTop: 12, minWidth: 220 },
  successLabel: { color: '#777D74', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 },
  successCode: { color: '#252922', fontSize: 18, fontWeight: '800', marginTop: 2 },
  successStatus: { color: '#39765F', fontSize: 14, fontWeight: '800', marginTop: 2 },
  successNote: { color: '#596258', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10, marginBottom: 14 },
});
