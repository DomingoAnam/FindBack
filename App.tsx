import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { BottomTabBar, type AppTab } from './src/components/BottomTabBar';
import { mockReports } from './src/data/mockReports';
import { HomeScreen } from './src/features/home/HomeScreen';
import { ReportFormScreen } from './src/features/reports/ReportFormScreen';
import { SearchScreen } from './src/features/search/SearchScreen';
import { UpdatesScreen } from './src/features/updates/UpdatesScreen';
import type { ItemReport, NewReport } from './src/types/report';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [reports, setReports] = useState<ItemReport[]>(mockReports);

  function addReport(report: NewReport) {
    setReports((currentReports) => [
      { ...report, id: String(Date.now()), createdAt: new Date().toISOString(), status: 'reported' },
      ...currentReports,
    ]);
    setActiveTab('home');
  }

  return (
    <SafeAreaView style={styles.container}>
      {activeTab === 'home' && <HomeScreen reports={reports} onNavigate={setActiveTab} />}
      {activeTab === 'search' && <SearchScreen reports={reports} />}
      {activeTab === 'report' && <ReportFormScreen onSubmit={addReport} />}
      {activeTab === 'updates' && <UpdatesScreen reports={reports} />}
      <BottomTabBar activeTab={activeTab} onSelect={setActiveTab} />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F4',
  },
});
