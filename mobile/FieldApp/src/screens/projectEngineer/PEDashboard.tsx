import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, CommonActions, NavigationProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import type { ProjectEngineerStackParamList, RootStackParamList } from '../../navigation/AppNavigator';

type PENavigationProp = NavigationProp<ProjectEngineerStackParamList, 'PEDashboard'>;

interface ItemType {
  date: string;
  foreman_id: number;
  foreman_name: string;
  supervisor_name?: string;
  job_code?: string;
  timesheet_count: number;
  ticket_count: number;
}

interface SectionType {
  title: string;
  data: ItemType[];
}

const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
  success: '#34C759',
  lightBlue: '#90caf9',
};

const PEDashboard = () => {
  const navigation = useNavigation<PENavigationProp>();
  const { user, logout } = useAuth();

  const [data, setData] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [submittingDate, setSubmittingDate] = useState<string | null>(null);
  const [submittedDates, setSubmittedDates] = useState<string[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, submittedRes] = await Promise.all([
        apiClient.get('/api/review/pe/dashboard'),
        apiClient.get('/api/review/submitted-dates'),
      ]);
      setData(dashboardRes.data);
      setSubmittedDates(submittedRes.data);
    } catch (err: any) {
      console.error('Load dashboard error', err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const sections: SectionType[] = useMemo(() => {
    const grouped: Record<string, ItemType[]> = {};
    data.forEach(item => {
      (grouped[item.date] = grouped[item.date] || []).push(item);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([title, data]) => ({ title, data }));
  }, [data]);

  const handleLogout = () => {
    logout();
    navigation.getParent()?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Login' as keyof RootStackParamList }] })
    );
  };

  const handleSubmission = async (date: string) => {
    setSubmittingDate(date);
    try {
      await apiClient.post('/api/review/submit-all-for-date', { supervisor_id: user?.id, date });
      Alert.alert('Success', 'Submitted successfully!');
      setSubmittedDates(prev => [...prev, date]);
      await loadDashboard();
    } catch (err: any) {
      console.error('Submission error', err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmittingDate(null);
    }
  };

  const handleSubmissionAttempt = async (date: string) => {
    setSubmittingDate(date);
    try {
      const res = await apiClient.get(`/api/review/status-for-date?date=${date}&supervisor_id=${user?.id}`);
      if (res.data.can_submit) {
        const section = sections.find(s => s.title === date);
        if (!section) return;
        const ticketCount = section.data.reduce((sum, n) => sum + n.ticket_count, 0);
        const timesheetCount = section.data.reduce((sum, n) => sum + n.timesheet_count, 0);

        Alert.alert(
          'Confirm Submission',
          `You are about to submit:\n- Timesheets: ${timesheetCount}\n- Tickets: ${ticketCount}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'OK', onPress: () => handleSubmission(date) },
          ]
        );
      } else {
        let msg = 'Cannot submit. Missing items:\n';
        if (res.data.incomplete_tickets?.length) {
          msg += '\nTickets with missing codes:\n';
          res.data.incomplete_tickets.forEach((i: any) => {
            msg += ` - ${i.foreman_name}: ${i.count}\n`;
          });
        }
        Alert.alert('Blocked', msg.trim());
      }
    } catch (err: any) {
      console.error('Validation error', err);
      Alert.alert('Validation Error', err.response?.data?.detail || 'Failed to validate');
    } finally {
      setSubmittingDate(null);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Project Engineer Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.foreman_id + '-' + item.date}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderSectionHeader={({ section }) => {
          const isSubmitted = submittedDates.includes(section.title);
          const isProcessing = submittingDate === section.title;
          const buttonText = isSubmitted ? 'Submitted' : isProcessing ? 'Processing...' : 'Submit All';
          return (
            <View style={styles.sectionHeader}>
              <Text style={styles.dateText}>{new Date(section.title + 'T00:00:00').toLocaleDateString()}</Text>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isSubmitted || isProcessing) && { backgroundColor: isSubmitted ? COLORS.success : COLORS.lightBlue },
                ]}
                disabled={isSubmitted || isProcessing}
                onPress={() => handleSubmissionAttempt(section.title)}
              >
                <Text style={styles.submitButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.foremanName}>
              <Ionicons name="person-circle-outline" size={18} /> {item.foreman_name}
              <Text style={styles.foremanName}>{item.supervisor_name}</Text>
            </Text>
            {item.job_code && <Text style={styles.jobCode}>Job: {item.job_code}</Text>}

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() =>
                navigation.navigate('PETimesheetList', {
                  foremanId: item.foreman_id,
                  date: item.date,
                  foremanName: item.foreman_name,
                })
              }
            >
              <Text style={styles.actionLabel}>Timesheets ({item.timesheet_count})</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() =>
                navigation.navigate('PETicketList', {
                  foremanId: item.foreman_id,
                  date: item.date,
                  foremanName: item.foreman_name,
                })
              }
            >
              <Text style={styles.actionLabel}>Tickets ({item.ticket_count})</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-stacked-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No submissions found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.card },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  logoutButton: { backgroundColor: '#FF3B301A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  logoutButtonText: { color: '#FF3B30', fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e9ecef', padding: 10, paddingHorizontal: 16 },
  dateText: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  submitButton: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  submitButtonText: { color: 'white', fontWeight: '700' },

  item: { backgroundColor: COLORS.card, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8, elevation: 2 },
  foremanName: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  jobCode: { fontSize: 14, color: COLORS.primary, marginBottom: 6 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  actionLabel: { color: COLORS.primary, fontWeight: '600' },

  emptyContainer: { marginTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});

export default PEDashboard;
