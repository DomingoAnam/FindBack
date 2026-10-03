import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { ReportCard } from '../../components/ReportCard';
import { ContactCard } from '../../components/ContactCard';
import { OwnerContactCard } from '../../components/OwnerContactCard';
import { FormField } from '../../components/FormField';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptySearchIllustration } from '../../components/Illustrations';
import { loadReportContact } from '../../services/reports';
import { OPEN_STATUSES, REPORT_CATEGORIES, type ContactSettings, type ItemReport, type ReportContact, type ReportKind } from '../../types/report';

interface SearchScreenProps {
  reports: ItemReport[];
  loading: boolean;
  settings: ContactSettings | null;
  currentUserId: string;
  pendingClaimReportIds: Set<string>;
  onSubmitVerification: (reportId: string, verificationInformation: string) => Promise<boolean>;
  onOwnerAction: (report: ItemReport, action: 'recovered' | 'closed') => void;
}

type KindFilter = 'all' | ReportKind;

export function SearchScreen({ reports, loading, settings, currentUserId, pendingClaimReportIds, onSubmitVerification, onOwnerAction }: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<ItemReport | null>(null);
  const [contactFor, setContactFor] = useState<{ reportId: string; contact: ReportContact | null } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [verification, setVerification] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    void loadReportContact(selected.id).then((contact) => {
      if (!cancelled) setContactFor({ reportId: selected.id, contact });
    });
    return () => { cancelled = true; };
  }, [selected]);

  const selectedContact = contactFor && contactFor.reportId === selected?.id ? contactFor.contact : null;

  const normalizedQuery = query.trim().toLowerCase();
  const visibleReports = reports.filter((report) => {
    const matchesKind = kindFilter === 'all' || report.kind === kindFilter;
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
    const searchableText = `${report.name} ${report.category} ${report.description} ${report.location} ${report.occurredDate} ${report.color} ${report.brand} ${report.code}`.toLowerCase();
    return matchesKind && matchesCategory && searchableText.includes(normalizedQuery);
  });

  const kindFilters: { key: KindFilter; label: string }[] = [
    { key: 'all', label: 'All items' },
    { key: 'lost', label: 'Lost' },
    { key: 'found', label: 'Found' },
  ];

  const canClaim = selected
    && selected.kind === 'found'
    && OPEN_STATUSES.includes(selected.status)
    && selected.createdBy !== currentUserId
    && !pendingClaimReportIds.has(selected.id);

  const isOwnOpenReport = selected
    && selected.createdBy === currentUserId
    && OPEN_STATUSES.includes(selected.status);

  function confirmOwnerAction(action: 'recovered' | 'closed') {
    if (!selected) return;
    const report = selected;
    const title = action === 'recovered' ? 'Item claimed?' : 'Close report?';
    const message = action === 'recovered'
      ? 'Confirm the item was claimed by its owner. The report will be marked as claimed.'
      : 'Close this report? Use this if the item was not claimed within 30 days.';
    const confirmLabel = action === 'recovered' ? 'Claimed' : 'Close';
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmLabel,
        style: action === 'closed' ? 'destructive' : 'default',
        onPress: () => {
          onOwnerAction(report, action);
          setSelected(null);
        },
      },
    ]);
  }

  async function sendVerification() {
    if (!selected) return;
    if (verification.trim().length < 10) {
      Alert.alert('Add more detail', 'Describe identifying details only the owner would know (at least 10 characters).');
      return;
    }
    setSending(true);
    const ok = await onSubmitVerification(selected.id, verification);
    setSending(false);
    if (ok) {
      setClaiming(false);
      setVerification('');
      setSelected(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>MARKET REPORTS</Text>
      <Text style={styles.title}>Find an item</Text>
      <Text style={styles.subtitle}>Search names, details, categories, dates, or market locations. Tap a report to view details.</Text>
      <TextInput
        accessibilityLabel="Search reports"
        onChangeText={setQuery}
        placeholder="Try wallet or fish section"
        placeholderTextColor="#858B82"
        style={styles.searchInput}
        value={query}
      />
      <View style={styles.filters}>
        {kindFilters.map((filter) => {
          const isSelected = kindFilter === filter.key;
          return (
            <Pressable key={filter.key} onPress={() => setKindFilter(filter.key)} style={[styles.filter, isSelected && styles.selectedFilter]}>
              <Text style={[styles.filterText, isSelected && styles.selectedFilterText]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {['all', ...REPORT_CATEGORIES].map((category) => {
          const isSelected = categoryFilter === category;
          return (
            <Pressable key={category} onPress={() => setCategoryFilter(category)} style={[styles.filter, isSelected && styles.selectedFilter]}>
              <Text style={[styles.filterText, isSelected && styles.selectedFilterText]}>{category === 'all' ? 'All categories' : category}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.resultCount}>{visibleReports.length} {visibleReports.length === 1 ? 'report' : 'reports'}</Text>
      {loading ? <Text style={styles.loadingText}>Loading reports...</Text> : null}
      {!loading && visibleReports.length > 0 ? visibleReports.map((report) => (
        <Pressable key={report.id} onPress={() => setSelected(report)}>
          <ReportCard report={report} showStatus />
        </Pressable>
      )) : null}
      {!loading && !visibleReports.length ? (
        <View style={styles.emptyState}>
          <EmptySearchIllustration />
          <Text style={styles.emptyTitle}>No reports found</Text>
          <Text style={styles.emptyText}>Try changing your search or filters.</Text>
        </View>
      ) : null}

      <Modal animationType="slide" onRequestClose={() => setSelected(null)} transparent visible={selected !== null && !claiming}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView>
              {selected?.photoUris.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
                  {selected.photoUris.map((uri) => <Image key={uri} source={{ uri }} style={styles.modalImage} />)}
                </ScrollView>
              ) : null}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalKind, selected?.kind === 'lost' ? styles.lost : styles.found]}>
                  {selected?.kind === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}
                </Text>
                {selected ? <StatusBadge status={selected.status} /> : null}
              </View>
              <Text style={styles.modalTitle}>{selected?.name}</Text>
              <Text style={styles.modalCode}>{selected?.code}</Text>
              <DetailRow label="Category" value={selected?.category} />
              <DetailRow label={selected?.kind === 'lost' ? 'Date lost' : 'Date found'} value={`${selected?.occurredDate ?? ''} ${selected?.occurredTime ?? ''}`.trim()} />
              <DetailRow label="Location" value={selected?.location} />
              {selected?.color ? <DetailRow label="Color" value={selected.color} /> : null}
              {selected?.brand ? <DetailRow label="Brand" value={selected.brand} /> : null}
              {selected?.model ? <DetailRow label="Model" value={selected.model} /> : null}
              <Text style={styles.modalDescription}>{selected?.description}</Text>
              <Text style={styles.privacyNote}>Identifying details are kept private and verified by the Admin during claims.</Text>

              {selected?.status === 'possible_match' ? (
                <Text style={styles.reviewNote}>This report has a possible match. Matches are verified before recovery.</Text>
              ) : null}

              {canClaim ? (
                <Pressable onPress={() => setClaiming(true)} style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>This may be my item</Text>
                </Pressable>
              ) : selected && pendingClaimReportIds.has(selected.id) ? (
                <Text style={styles.pendingNote}>Your claim for this item is being reviewed.</Text>
              ) : null}

              {isOwnOpenReport ? (
                <View style={styles.ownerActions}>
                  <Pressable onPress={() => confirmOwnerAction('recovered')} style={[styles.ownerButton, styles.claimedButton]}>
                    <Text style={styles.claimedButtonText}>Claimed</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmOwnerAction('closed')} style={[styles.ownerButton, styles.closeReportButton]}>
                    <Text style={styles.closeReportButtonText}>Closed</Text>
                  </Pressable>
                </View>
              ) : null}

              {selected && selectedContact && selected.createdBy !== currentUserId && selectedContact.role !== 'admin' ? (
                <OwnerContactCard contact={selectedContact} kind={selected.kind} />
              ) : null}

              {settings ? <ContactCard settings={settings} /> : null}
            </ScrollView>
            <Pressable accessibilityLabel="Close details" onPress={() => setSelected(null)} style={styles.closeButton}>
              <X size={18} color="#30372E" />
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setClaiming(false)} transparent visible={claiming}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.claimTitle}>Verify ownership</Text>
              <Text style={styles.claimSubtitle}>
                Describe details only the real owner would know about ‘{selected?.name}’ — unique marks, contents, purchase info, or proof of ownership. This stays private and is reviewed by the Admin.
              </Text>
              <FormField
                label="Verification information"
                multiline
                onChangeText={setVerification}
                placeholder="e.g. The wallet has a small tear on the left corner and contains a school ID..."
                value={verification}
              />
              <Pressable disabled={sending} onPress={sendVerification} style={[styles.claimButton, sending && styles.claimButtonDisabled]}>
                <Text style={styles.claimButtonText}>{sending ? 'Submitting...' : 'Submit verification'}</Text>
              </Pressable>
              <Pressable onPress={() => setClaiming(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 24 },
  eyebrow: { color: '#39765F', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#20251F', fontSize: 27, fontWeight: '800', marginTop: 7 },
  subtitle: { color: '#697067', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 17 },
  searchInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE1D9', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, color: '#20251F', fontSize: 14 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  categoryRow: { gap: 8, marginTop: 8, marginBottom: 18, paddingRight: 20 },
  filter: { borderWidth: 1, borderColor: '#DDE1D9', borderRadius: 7, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  selectedFilter: { backgroundColor: '#30372E', borderColor: '#30372E' },
  filterText: { color: '#596258', fontSize: 12, fontWeight: '600' },
  selectedFilterText: { color: '#FFFFFF' },
  resultCount: { color: '#777D74', fontSize: 11, fontWeight: '700', marginBottom: 10 },
  loadingText: { color: '#777D74', fontSize: 12, paddingVertical: 12 },
  emptyState: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 8, padding: 24, alignItems: 'center' },
  emptyTitle: { color: '#252922', fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptyText: { color: '#777D74', fontSize: 12, marginTop: 5, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(32, 37, 31, 0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#F7F8F4', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '88%' },
  photoStrip: { marginBottom: 14 },
  modalImage: { width: 220, height: 160, borderRadius: 8, marginRight: 8, resizeMode: 'cover' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalKind: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  lost: { color: '#B44732' },
  found: { color: '#39765F' },
  modalTitle: { color: '#20251F', fontSize: 20, fontWeight: '800' },
  modalCode: { color: '#AAB4A8', fontSize: 10, fontWeight: '700', marginTop: 3, marginBottom: 10, letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#EDEFEA' },
  detailLabel: { color: '#777D74', fontSize: 12 },
  detailValue: { color: '#30372E', fontSize: 12, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  modalDescription: { color: '#454D43', fontSize: 13, lineHeight: 20, marginTop: 12 },
  privacyNote: { color: '#858B82', fontSize: 10, lineHeight: 15, marginTop: 8, fontStyle: 'italic' },
  reviewNote: { color: '#B44732', fontSize: 11, lineHeight: 16, marginTop: 10 },
  claimButton: { alignItems: 'center', backgroundColor: '#30372E', borderRadius: 7, paddingVertical: 13, marginTop: 14, marginBottom: 12 },
  claimButtonDisabled: { opacity: 0.6 },
  claimButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  pendingNote: { color: '#B47F32', fontSize: 12, fontWeight: '600', marginTop: 12 },
  ownerActions: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 12 },
  ownerButton: { flex: 1, alignItems: 'center', borderRadius: 7, paddingVertical: 12 },
  claimedButton: { backgroundColor: '#39765F' },
  claimedButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  closeReportButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4C7C0' },
  closeReportButtonText: { color: '#B44732', fontSize: 12, fontWeight: '700' },
  claimTitle: { color: '#20251F', fontSize: 19, fontWeight: '800', marginBottom: 6 },
  claimSubtitle: { color: '#596258', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  cancelButton: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: '#596258', fontSize: 12, fontWeight: '700' },
  closeButton: { position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0E4DC' },
});
