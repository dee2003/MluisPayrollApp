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

// Adapted Theme and Colors from Foreman/Supervisor Dashboard
const THEME_COLORS = {
  primary: '#4A5C4D', // Primary action color (dark green)
  backgroundLight: '#F8F7F2', // Light background
  contentLight: '#3D3D3D', // Primary text content
  subtleLight: '#797979', // Secondary text content
  cardLight: '#FFFFFF', // Card/container background
  brandStone: '#8E8E8E', // Subtle brand color
  danger: '#FF3B30', // Danger/Logout color
  success: '#34C759', // Success/Submitted color
  border: '#E5E5E5', // Light border
};

const THEME_FONTS = { display: 'System' }; // Manrope not available by default, using System
const THEME_BORDERS = { lg: 16, xl: 24, full: 9999 };


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
      // Group by date
      (grouped[item.date] = grouped[item.date] || []).push(item);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? 1 : -1)) // Sort descending by date
      .map(([title, data]) => ({ title, data }));
  }, [data]);

  const handleLogout = () => {
    logout();
    navigation.getParent()?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Login' as keyof RootStackParamList }] })
    );
  };

  // NOTE: This submission logic is commented out in your original component's render,
  // but keeping the functions here in case you re-enable it.
  const handleSubmission = async (date: string) => {
    setSubmittingDate(date);
    try {
      // NOTE: Using supervisor_id in a PE submission endpoint might be a bug in your API/data structure.
      // I've kept the original call for now but flagged it. You might need to change `supervisor_id` to `project_engineer_id`
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
        <ActivityIndicator size="large" color={THEME_COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Text style={styles.welcomeTitle}>
                    Hello, {user?.first_name || 'PE'}
                </Text>
                <Text style={styles.welcomeSubtitle}>Review & Approve Submissions</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color={THEME_COLORS.danger} />
            </TouchableOpacity>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={item => item.foreman_id + '-' + item.date}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME_COLORS.primary} />}
          renderSectionHeader={({ section }) => {
            const isSubmitted = submittedDates.includes(section.title);
            const isProcessing = submittingDate === section.title;
            // The submit button is commented out in your original component, so I'll render the date only.
            return (
              <View style={styles.dateGroupContainer}>
                <Text style={styles.dateHeader}>
                    {new Date(section.title + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            );
          }}
          renderItem={({ item }) => (
            <View style={styles.card}>
                <View style={styles.foremanInfoRow}>
                    <Text style={styles.foremanName}>
                        <Ionicons name="person-circle-outline" size={20} color={THEME_COLORS.contentLight} /> {item.supervisor_name || item.foreman_name}
                    </Text>
                    {item.job_code && <Text style={styles.jobCodeRight}>Job: {item.job_code}</Text>}
                </View>

                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() =>
                        navigation.navigate('PETimesheetList', {
                            foremanId: item.foreman_id,
                            date: item.date,
                            supervisorName: item.supervisor_name || item.foreman_name,
                        })
                    }
                >
                    <Text style={styles.actionLabel}>Timesheets ({item.timesheet_count})</Text>
                    <Ionicons name="chevron-forward-outline" size={22} color={THEME_COLORS.subtleLight} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() =>
                        navigation.navigate('PETicketList', {
                            foremanId: item.foreman_id,
                            date: item.date,
                            supervisorName: item.supervisor_name || item.foreman_name,
                        })
                    }
                >
                    <Text style={styles.actionLabel}>Tickets ({item.ticket_count})</Text>
                    <Ionicons name="chevron-forward-outline" size={22} color={THEME_COLORS.subtleLight} />
                </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-stacked-outline" size={60} color={THEME_COLORS.brandStone} />
                <Text style={styles.emptyText}>No submissions found.</Text>
                <Text style={styles.emptySubText}>Submissions from supervisors will appear here.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Base & Layout
  safeArea: { flex: 1, backgroundColor: THEME_COLORS.backgroundLight },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME_COLORS.backgroundLight },

  // Header & Logout
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: THEME_COLORS.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  headerLeft: {
    // Contains title and subtitle
  },
  welcomeTitle: {
    fontFamily: THEME_FONTS.display,
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.contentLight,
    marginBottom: 4
  },
  welcomeSubtitle: {
    fontFamily: THEME_FONTS.display,
    fontSize: 14,
    color: THEME_COLORS.subtleLight
  },
  logoutButton: {
    padding: 8,
    borderRadius: THEME_BORDERS.full,
    backgroundColor: '#FF3B301A', // Light red background
  },

  // Section Header (Date Group)
  dateGroupContainer: {
    backgroundColor: THEME_COLORS.backgroundLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  dateHeader: {
    fontFamily: THEME_FONTS.display,
    fontSize: 16,
    fontWeight: '700',
    color: THEME_COLORS.contentLight,
  },
  // The submit button styles are kept for consistency in case you re-enable it
  submitButton: {
    backgroundColor: THEME_COLORS.primary,
    borderRadius: THEME_BORDERS.lg / 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 100,
    alignItems: 'center'
  },
  submitButtonText: {
    fontFamily: THEME_FONTS.display,
    color: THEME_COLORS.cardLight,
    fontWeight: '600',
    fontSize: 14,
  },

  // Card (Item)
  card: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 16,
    backgroundColor: THEME_COLORS.cardLight,
    borderRadius: THEME_BORDERS.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  foremanInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0' // Very subtle divider
  },
  foremanName: {
    fontFamily: THEME_FONTS.display,
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.contentLight,
    flexShrink: 1,
  },
  jobCodeRight: {
    fontFamily: THEME_FONTS.display,
    fontSize: 13,
    color: THEME_COLORS.primary,
    fontWeight: '600',
    marginLeft: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionLabel: {
    fontFamily: THEME_FONTS.display,
    fontSize: 15,
    fontWeight: '500',
    color: THEME_COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 0,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: THEME_FONTS.display,
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.subtleLight,
    marginTop: 16,
    textAlign: 'center'
  },
  emptySubText: {
    fontFamily: THEME_FONTS.display,
    fontSize: 15,
    color: THEME_COLORS.subtleLight,
    marginTop: 8,
    textAlign: 'center'
  },
});

export default PEDashboard;