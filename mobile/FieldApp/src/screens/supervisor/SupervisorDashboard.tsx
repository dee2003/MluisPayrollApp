

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
import { useNavigation, useFocusEffect, CommonActions, NavigationProp } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList, SupervisorStackParamList } from '../../navigation/AppNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';


type SupervisorNavigationProp = NavigationProp<RootStackParamList & SupervisorStackParamList>;

interface Notification {
  id: number;
  foreman_id: number;
  foreman_name: string;
  foreman_email: string;
  date: string;
  ticket_count: number;
  timesheet_count: number;
  job_code?: string;
}

const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
  danger: '#FF3B30',
  success: '#34C759',
  lightBlue: '#90caf9',
};

const SupervisorDashboard = () => {
  const navigation = useNavigation<SupervisorNavigationProp>();
  const { logout, user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingDate, setSubmittingDate] = useState<string | null>(null);
  const [checkingDate, setCheckingDate] = useState<string | null>(null);
  const [submittedDates, setSubmittedDates] = useState<string[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [notifRes, submittedRes] = await Promise.all([
        apiClient.get('/api/review/notifications'),
        apiClient.get('/api/review/submitted-dates'),
      ]);
      setNotifications(notifRes.data);
      setSubmittedDates(submittedRes.data);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  }, []); // ✅ EMPTY dependency list

  // ✅ Load once when component mounts
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
//  useEffect(() => {
//   loadDashboardData(); // initial load

//   const interval = setInterval(() => {
//     loadDashboardData(); // auto-refresh every 10s
//   }, 10000);

//   return () => clearInterval(interval);
// }, [loadDashboardData]);


  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const sections = useMemo(() => {
    const grouped = notifications.reduce((acc, item) => {
      (acc[item.date] = acc[item.date] || []).push(item);
      return acc;
    }, {} as Record<string, Notification[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, notifs]) => ({ title: date, data: notifs }));
  }, [notifications]);

  const handleLogout = () => {
    logout();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  const executeSubmission = async (date: string) => {
    setSubmittingDate(date);
    try {
      await apiClient.post('/api/review/submit-all-for-date', { supervisor_id: user?.id, date });
      Alert.alert("Success", "Submitted to Project Engineer successfully!");
      setSubmittedDates(prev => [...prev, date]);
      await loadDashboardData();
    } catch (e: any) {
      console.error("Submission Error:", e);
      Alert.alert("Error", e.response?.data?.detail || "Failed to submit");
    } finally {
      setSubmittingDate(null);
    }
  };

  const handleSubmissionAttempt = async (date: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    setCheckingDate(date);
    try {
      const result = await apiClient.get(`/api/review/status-for-date?date=${date}&supervisor_id=${user.id}`);
      if (result.data.can_submit) {
        const section = sections.find(s => s.title === date);
        if (!section) return;
        const ticketCount = section.data.reduce((sum, n) => sum + (n.ticket_count ?? 0), 0);
        const timesheetCount = section.data.reduce((sum, n) => sum + (n.timesheet_count ?? 0), 0);
        Alert.alert(
          "Confirm Submission",
          `You are about to submit:\n\n- Tickets: ${ticketCount}\n- Timesheets: ${timesheetCount}\n\nDo you want to continue?`,
          [{ text: "Cancel", style: "cancel" }, { text: "OK", onPress: () => executeSubmission(date) }]
        );
      } else {
        let message = 'Cannot submit. The following items need your attention:\n';
        if (result.data.unreviewed_timesheets?.length > 0) {
          message += '\nUnreviewed Timesheets:\n';
          result.data.unreviewed_timesheets.forEach((item: { foreman_name: string; count: number }) => {
            message += `  - ${item.foreman_name}: ${item.count} timesheet(s)\n`;
          });
        }
        if (result.data.incomplete_tickets?.length > 0) {
          message += '\nTickets with missing codes:\n';
          result.data.incomplete_tickets.forEach((item: { foreman_name: string; count: number }) => {
            message += `  - ${item.foreman_name}: ${item.count} ticket(s)\n`;
          });
        }
        Alert.alert('Submission Blocked', message.trim());
      }
    } catch (error: any) {
      console.error("Validation Error:", error);
      Alert.alert('Validation Error', error.response?.data?.detail || 'Failed to check submission status.');
    } finally {
      setCheckingDate(null);
    }
  };

  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Supervisor Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons  name="file-tray-stacked-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No Items to Review</Text>
            <Text style={styles.emptySubText}>Submissions from foremen will appear here.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
            const isSubmitted = submittedDates.includes(section.title);
            const isProcessing = submittingDate === section.title || checkingDate === section.title;
            const buttonText = isSubmitted ? 'Submitted' : isProcessing ? 'Processing...' : 'Submit All';
            return (
              <View style={styles.dateGroupContainer}>
                <View style={styles.dateHeaderRow}>
                  <Text style={styles.dateHeader}>{new Date(section.title + 'T00:00:00').toLocaleDateString()}</Text>
                  <TouchableOpacity
                    style={[ styles.submitButton, (isProcessing || isSubmitted) && { backgroundColor: isSubmitted ? COLORS.success : COLORS.lightBlue }]}
                    disabled={isProcessing || isSubmitted}
                    onPress={() => handleSubmissionAttempt(section.title)}
                  >
                    <Text style={styles.submitButtonText}>{buttonText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
        }}
        renderItem={({ item }) => (
          <View style={styles.notificationItem}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
  <Text style={styles.foremanName}>
    <Ionicons  name="person-circle-outline" size={20} /> {item.foreman_name}
  </Text>
  {item.job_code && (
    <Text style={styles.jobCodeRight}>
      Job code: {item.job_code}
    </Text>
  )}
</View>




            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('SupervisorTimesheetList', { foremanId: item.foreman_id, date: item.date, foremanName: item.foreman_name })}
            >
              <Text style={styles.actionLabel}>Timesheets ({item.timesheet_count ?? 0})</Text>
              <Ionicons  name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('SupervisorTicketList', { foremanId: item.foreman_id, foremanName: item.foreman_name, date: item.date })}
            >
              <Text style={styles.actionLabel}>Tickets ({item.ticket_count ?? 0})</Text>
              <Ionicons  name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  logoutButton: { backgroundColor: '#FF3B301A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  logoutButtonText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  dateGroupContainer: { backgroundColor: '#e9ecef', paddingVertical: 10, paddingHorizontal: 16 },
  dateHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateHeader: { fontSize: 19, fontWeight: '700', color: '#495057' },
  submitButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  submitButtonText: { color: 'white', fontWeight: '700' },
  notificationItem: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  jobCodeRight: {
  fontSize: 15,
  color: '#007AFF',
  fontWeight: '600',
},

  foremanName: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: COLORS.textPrimary, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  actionLabel: { fontSize: 16, fontWeight: '500', color: COLORS.primary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginTop: 16, textAlign: 'center' },
  emptySubText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
});

export default SupervisorDashboard;









// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import {
//   View,
//   Text,
//   SectionList,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   TouchableOpacity,
//   RefreshControl,
//   SafeAreaView,
// } from 'react-native';
// import { useNavigation, CommonActions } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import apiClient from '../../api/apiClient';
// import { useAuth } from '../../context/AuthContext';
// // import type { PEStackParamList } from '../../navigation/AppNavigator';

// // type PEDashboardNavigationProp = NativeStackNavigationProp<PEStackParamList, 'PEDashboard'>;

// interface SupervisorSubmission {
//   supervisor_id: number;
//   supervisor_name: string;
//   date: string;
//   timesheet_count: number;
//   ticket_count: number;
//   job_code?: string;
// }

// interface SectionType {
//   title: string;
//   data: SupervisorSubmission[];
// }

// const COLORS = {
//   primary: '#007AFF',
//   background: '#F2F2F7',
//   card: '#FFFFFF',
//   textPrimary: '#1C1C1E',
//   textSecondary: '#636366',
//   border: '#E5E5EA',
// };

// const PEDashboard = () => {
//   const navigation = useNavigation<PEDashboardNavigationProp>();
//   const { user, logout } = useAuth();

//   const [submissions, setSubmissions] = useState<SupervisorSubmission[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // Load submissions for this PE
//   const loadSubmissions = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await apiClient.get('/api/project-engineer/submissions', {
//         params: { pe_name: user?.username },
//       });
//       setSubmissions(response.data);
//     } catch (error: any) {
//       console.error('Failed to load submissions:', error);
//       Alert.alert('Error', error.response?.data?.detail || 'Failed to load submissions');
//     } finally {
//       setLoading(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     loadSubmissions();
//   }, [loadSubmissions]);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadSubmissions();
//     setRefreshing(false);
//   };

//   const sections: SectionType[] = useMemo(() => {
//     const grouped = submissions.reduce((acc: Record<string, SupervisorSubmission[]>, item) => {
//       (acc[item.date] = acc[item.date] || []).push(item);
//       return acc;
//     }, {});

//     return Object.entries(grouped)
//       .sort(([a], [b]) => (a < b ? 1 : -1))
//       .map(([date, data]) => ({ title: date, data }));
//   }, [submissions]);

//   const handleLogout = () => {
//     logout();
//     navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
//   };

//   const renderSectionHeader = ({ section }: { section: SectionType }) => (
//     <View style={styles.dateGroupContainer}>
//       <Text style={styles.dateHeader}>{new Date(section.title + 'T00:00:00').toLocaleDateString()}</Text>
//     </View>
//   );

//   const renderItem = ({ item }: { item: SupervisorSubmission }) => (
//     <View style={styles.itemContainer}>
//       <View style={styles.row}>
//         <Text style={styles.supervisorName}>
//           <Ionicons name="person-circle-outline" size={18} /> {item.supervisor_name}
//         </Text>
//         {item.job_code && <Text style={styles.jobCode}>{item.job_code}</Text>}
//       </View>

//       <TouchableOpacity
//         style={styles.actionRow}
//         onPress={() =>
//           navigation.navigate('PETimesheetList', {
//             supervisorId: item.supervisor_id,
//             date: item.date,
//             supervisorName: item.supervisor_name,
//           })
//         }
//       >
//         <Text style={styles.actionLabel}>Timesheets ({item.timesheet_count ?? 0})</Text>
//         <Ionicons name="chevron-forward-outline" size={20} color={COLORS.textSecondary} />
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.actionRow}
//         onPress={() =>
//           navigation.navigate('PETicketList', {
//             supervisorId: item.supervisor_id,
//             date: item.date,
//             supervisorName: item.supervisor_name,
//           })
//         }
//       >
//         <Text style={styles.actionLabel}>Tickets ({item.ticket_count ?? 0})</Text>
//         <Ionicons name="chevron-forward-outline" size={20} color={COLORS.textSecondary} />
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading && !refreshing) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Project Engineer Dashboard</Text>
//         <TouchableOpacity onPress={handleLogout}>
//           <Text style={styles.logout}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       <SectionList
//         sections={sections}
//         keyExtractor={(item) => `${item.supervisor_id}-${item.date}`}
//         renderSectionHeader={renderSectionHeader}
//         renderItem={renderItem}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>No submissions found.</Text>
//           </View>
//         }
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.card },
//   headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
//   logout: { color: COLORS.primary, fontWeight: '600' },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   dateGroupContainer: { backgroundColor: '#e9ecef', padding: 10, paddingHorizontal: 16 },
//   dateHeader: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
//   itemContainer: { marginHorizontal: 16, marginVertical: 8, backgroundColor: COLORS.card, borderRadius: 8, padding: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
//   row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
//   supervisorName: { fontSize: 16, fontWeight: '600' },
//   jobCode: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
//   actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
//   actionLabel: { fontSize: 16, fontWeight: '500', color: COLORS.primary },
//   emptyContainer: { marginTop: 80, alignItems: 'center' },
//   emptyText: { fontSize: 16, color: COLORS.textSecondary },
// });

// export default PEDashboard;
