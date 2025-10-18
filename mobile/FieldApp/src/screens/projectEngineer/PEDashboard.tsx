// // // import React, { useEffect, useState } from 'react';
// // // import {
// // //   View,
// // //   Text,
// // //   FlatList,
// // //   StyleSheet,
// // //   TouchableOpacity,
// // //   ActivityIndicator,
// // //   SafeAreaView,
// // // } from 'react-native';
// // // import apiClient from '../../api/apiClient';
// // // import { useAuth } from '../../context/AuthContext';

// // // type SupervisorSummary = {
// // //   supervisor_id: number;
// // //   supervisor_name: string;
// // //   timesheet_count: number;
// // //   ticket_count: number;
// // // };

// // // type SubmissionByDate = {
// // //   date: string;
// // //   submissions: SupervisorSummary[];
// // // };

// // // const ProjectEngineerDashboard = () => {
// // //   const [submissions, setSubmissions] = useState<SubmissionByDate[]>([]);
// // //   const [loading, setLoading] = useState(false);

// // //   useEffect(() => {
// // //     loadSubmissions();
// // //   }, []);

// // //   const loadSubmissions = async () => {
// // //     setLoading(true);
// // //     try {
// // //       const response = await apiClient.get('/api/project-engineer/submissions');
// // //       setSubmissions(response.data);
// // //     } catch (err: any) {
// // //       console.error(err);
// // //       alert(err.response?.data?.detail || 'Failed to load submissions');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const renderSupervisor = ({ item }: { item: SupervisorSummary }) => (
// // //     <View style={styles.supervisorCard}>
// // //       <Text style={styles.supervisorName}>{item.supervisor_name}</Text>
// // //       <Text>Timesheets: {item.timesheet_count}</Text>
// // //       <Text>Tickets: {item.ticket_count}</Text>
// // //     </View>
// // //   );

// // //   const renderDateItem = ({ item }: { item: SubmissionByDate }) => (
// // //     <View style={styles.dateSection}>
// // //       <Text style={styles.dateTitle}>
// // //         {new Date(item.date).toLocaleDateString()}
// // //       </Text>
// // //       <FlatList
// // //         data={item.submissions}
// // //         keyExtractor={sub => sub.supervisor_id.toString()}
// // //         renderItem={renderSupervisor}
// // //         scrollEnabled={false}
// // //       />
// // //     </View>
// // //   );

// // //   return (
// // //     <SafeAreaView style={styles.container}>
// // //       {loading ? (
// // //         <ActivityIndicator size="large" color="#007AFF" />
// // //       ) : submissions.length === 0 ? (
// // //         <Text style={styles.emptyText}>No submissions found.</Text>
// // //       ) : (
// // //         <FlatList
// // //           data={submissions}
// // //           keyExtractor={item => item.date}
// // //           renderItem={renderDateItem}
// // //           contentContainerStyle={{ paddingBottom: 20 }}
// // //         />
// // //       )}
// // //     </SafeAreaView>
// // //   );
// // // };

// // // const styles = StyleSheet.create({
// // //   container: { flex: 1, backgroundColor: '#f0f2f5', padding: 16 },
// // //   dateSection: { marginBottom: 24 },
// // //   dateTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
// // //   supervisorCard: {
// // //     backgroundColor: '#fff',
// // //     padding: 12,
// // //     borderRadius: 8,
// // //     marginBottom: 8,
// // //     elevation: 2,
// // //   },
// // //   supervisorName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
// // //   emptyText: { marginTop: 50, textAlign: 'center', fontSize: 16, color: '#666' },
// // // });

// // // export default ProjectEngineerDashboard;



// // import React, { useEffect, useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   FlatList,
// //   StyleSheet,
// //   TouchableOpacity,
// //   ActivityIndicator,
// //   SafeAreaView,
// //   Alert,
// // } from 'react-native';
// // import apiClient from '../../api/apiClient';
// // import { useAuth } from '../../context/AuthContext';
// // import { useNavigation } from '@react-navigation/native';

// // type SupervisorSummary = {
// //   supervisor_id: number;
// //   supervisor_name: string;
// //   timesheet_count: number;
// //   ticket_count: number;
// // };

// // type SubmissionByDate = {
// //   date: string;
// //   submissions: SupervisorSummary[];
// // };

// // const SupervisorDashboard = () => {
// //   const { user, logout } = useAuth();
// //   const navigation = useNavigation<any>();
// //   const [submissions, setSubmissions] = useState<SubmissionByDate[]>([]);
// //   const [loading, setLoading] = useState(false);

// //   useEffect(() => {
// //     loadSubmissions();
// //   }, []);

// //   const loadSubmissions = async () => {
// //     setLoading(true);
// //     try {
// //       const response = await apiClient.get('/api/project-engineer/submissions');
// //       setSubmissions(response.data);
// //     } catch (err: any) {
// //       console.error(err);
// //       Alert.alert('Error', err.response?.data?.detail || 'Failed to load submissions');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleTimesheetPress = (supervisor_id: number, date: string) => {
// //     navigation.navigate('TimesheetForm', { supervisor_id, date });
// //   };

// //   const handleTicketPress = (supervisor_id: number, date: string) => {
// //     navigation.navigate('TicketForm', { supervisor_id, date });
// //   };

// //   const renderSupervisor = ({ item, date }: { item: SupervisorSummary; date: string }) => (
// //     <View style={styles.supervisorCard}>
// //       <Text style={styles.supervisorName}>{item.supervisor_name}</Text>
// //       <TouchableOpacity
// //         onPress={() => handleTimesheetPress(item.supervisor_id, date)}
// //         style={styles.clickableItem}
// //       >
// //         <Text>Timesheets: {item.timesheet_count}</Text>
// //       </TouchableOpacity>
// //       <TouchableOpacity
// //         onPress={() => handleTicketPress(item.supervisor_id, date)}
// //         style={styles.clickableItem}
// //       >
// //         <Text>Tickets: {item.ticket_count}</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );

// //   const renderDateItem = ({ item }: { item: SubmissionByDate }) => (
// //     <View style={styles.dateSection}>
// //       <Text style={styles.dateTitle}>
// //         {new Date(item.date).toLocaleDateString()}
// //       </Text>
// //       <FlatList
// //         data={item.submissions}
// //         keyExtractor={sub => sub.supervisor_id.toString()}
// //         renderItem={({ item: subItem }) => renderSupervisor({ item: subItem, date: item.date })}
// //         scrollEnabled={false}
// //       />
// //     </View>
// //   );

// //   return (
// //     <SafeAreaView style={styles.container}>
// //       {/* Header */}
// //       <View style={styles.header}>
// //         <Text style={styles.welcomeText}>Welcome, {user?.first_name}</Text>
// //         <TouchableOpacity style={styles.logoutButton} onPress={logout}>
// //           <Text style={styles.logoutText}>Logout</Text>
// //         </TouchableOpacity>
// //       </View>

// //       {/* Submissions List */}
// //       {loading ? (
// //         <ActivityIndicator size="large" color="#007AFF" />
// //       ) : submissions.length === 0 ? (
// //         <Text style={styles.emptyText}>No submissions found.</Text>
// //       ) : (
// //         <FlatList
// //           data={submissions}
// //           keyExtractor={item => item.date}
// //           renderItem={renderDateItem}
// //           contentContainerStyle={{ paddingBottom: 20 }}
// //         />
// //       )}
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: '#f0f2f5', padding: 16 },
// //   header: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: 16,
// //   },
// //   welcomeText: { fontSize: 18, fontWeight: 'bold' },
// //   logoutButton: {
// //     backgroundColor: '#ff4d4d',
// //     paddingVertical: 6,
// //     paddingHorizontal: 12,
// //     borderRadius: 6,
// //   },
// //   logoutText: { color: '#fff', fontWeight: 'bold' },
// //   dateSection: { marginBottom: 24 },
// //   dateTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
// //   supervisorCard: {
// //     backgroundColor: '#fff',
// //     padding: 12,
// //     borderRadius: 8,
// //     marginBottom: 8,
// //     elevation: 2,
// //   },
// //   supervisorName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
// //   clickableItem: { paddingVertical: 4 },
// //   emptyText: { marginTop: 50, textAlign: 'center', fontSize: 16, color: '#666' },
// // });

// // // export default SupervisorDashboard;
// // import React, { useEffect, useState } from 'react';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import {
// //   View,
// //   Text,
// //   FlatList,
// //   StyleSheet,
// //   TouchableOpacity,
// //   ActivityIndicator,
// //   SafeAreaView,
// //   Alert,
// // } from 'react-native';
// // import apiClient from '../../api/apiClient';
// // import { useAuth } from '../../context/AuthContext';
// // import { useNavigation } from '@react-navigation/native';

// // type SupervisorSummary = {
// //   supervisor_id: number;
// //   supervisor_name: string;
// //   timesheet_count: number;
// //   ticket_count: number;
// //   job_code?: string; // optional, if you want to display
// // };

// // type SubmissionByDate = {
// //   date: string;
// //   submissions: SupervisorSummary[];
// // };

// // const SupervisorDashboard = () => {
// //   const { user, logout } = useAuth();
// //   const navigation = useNavigation<any>();
// //   const [submissions, setSubmissions] = useState<SubmissionByDate[]>([]);
// //   const [loading, setLoading] = useState(false);

// //   useEffect(() => {
// //     loadSubmissions();
// //   }, []);

// // //  const loadSubmissions = async () => {
// // //   setLoading(true);
// // //   try {
// // //     const today = new Date().toISOString().split('T')[0];

// // //     const response = await apiClient.get('/api/project-engineer/submissions', {
// // //       params: { submitted_date: today },
// // //     });

// // //     setSubmissions(response.data);
// // //   } catch (err: any) {
// // //     console.error(err);
// // //     Alert.alert('Error', err.response?.data?.detail || 'Failed to load submissions');
// // //   } finally {
// // //     setLoading(false);
// // //   }
// // // };
// // const loadSubmissions = async () => {
// //   setLoading(true);
// //   try {
// //     const today = new Date().toISOString().split('T')[0];
// //     const response = await apiClient.get('/api/project-engineer/submissions', {
// //       params: { pe_name: user.username, submitted_date: today },
// //     });
// //     setSubmissions(response.data);
// //   } catch (err) {
// //     console.error(err);
// //     Alert.alert('Error', err.response?.data?.detail || 'Failed to load submissions');
// //   } finally {
// //     setLoading(false);
// //   }
// // };


// //   const handleTimesheetPress = (supervisor_id: number, date: string, job_code?: string) => {
// //     navigation.navigate('TimesheetForm', { supervisor_id, date, job_code });
// //   };

// //   const handleTicketPress = (supervisor_id: number, date: string, job_code?: string) => {
// //     navigation.navigate('TicketForm', { supervisor_id, date, job_code });
// //   };

// //   const renderSupervisor = ({ item, date }: { item: SupervisorSummary; date: string }) => (
// //     <View style={styles.supervisorCard}>
// //       <Text style={styles.supervisorName}>
// //         {item.supervisor_name}
// //         {item.job_code && (
// //           <Text style={{ color: "#007AFF", fontSize: 15 }}> ({item.job_code})</Text>
// //         )}
// //       </Text>
// //       <TouchableOpacity
// //         onPress={() => handleTimesheetPress(item.supervisor_id, date, item.job_code)}
// //         style={styles.clickableItem}
// //       >
// //         <Text>Timesheets: {item.timesheet_count}</Text>
// //       </TouchableOpacity>
// //       <TouchableOpacity
// //         onPress={() => handleTicketPress(item.supervisor_id, date, item.job_code)}
// //         style={styles.clickableItem}
// //       >
// //         <Text>Tickets: {item.ticket_count}</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );

// //   const renderDateItem = ({ item }: { item: SubmissionByDate }) => (
// //   <View style={styles.dateSection}>
// //     <Text style={styles.dateTitle}>
// //       {new Date(item.date).toLocaleDateString()}
// //     </Text>
// //     <FlatList
// //       data={item.submissions}
// //       keyExtractor={sub => sub.supervisor_id.toString()}
// //       renderItem={({ item: subItem }) => renderSupervisor({ item: subItem, date: item.date })}
// //       scrollEnabled={false}
// //     />
// //   </View>
// // );


// //   return (
// //     <SafeAreaView style={styles.container}>
// //       {/* Header */}
// //       <View style={styles.header}>
// //         <Text style={styles.welcomeText}>Welcome, {user?.first_name}</Text>
// //         <TouchableOpacity style={styles.logoutButton} onPress={logout}>
// //           <Text style={styles.logoutText}>Logout</Text>
// //         </TouchableOpacity>
// //       </View>

// //       {/* Submissions List */}
// //       {loading ? (
// //         <ActivityIndicator size="large" color="#007AFF" />
// //       ) : submissions.length === 0 ? (
// //         <Text style={styles.emptyText}>No submissions found.</Text>
// //       ) : (
// //         <FlatList
// //           data={submissions}
// //           keyExtractor={item => item.date}
// //           renderItem={renderDateItem}
// //           contentContainerStyle={{ paddingBottom: 20 }}
// //         />
// //       )}
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: '#f0f2f5', padding: 16 },
// //   header: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: 16,
// //   },
// //   welcomeText: { fontSize: 18, fontWeight: 'bold' },
// //   logoutButton: {
// //     backgroundColor: '#ff4d4d',
// //     paddingVertical: 6,
// //     paddingHorizontal: 12,
// //     borderRadius: 6,
// //   },
// //   logoutText: { color: '#fff', fontWeight: 'bold' },
// //   dateSection: { marginBottom: 24 },
// //   dateTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
// //   supervisorCard: {
// //     backgroundColor: '#fff',
// //     padding: 12,
// //     borderRadius: 8,
// //     marginBottom: 8,
// //     elevation: 2,
// //   },
// //   supervisorName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
// //   clickableItem: { paddingVertical: 4 },
// //   emptyText: { marginTop: 50, textAlign: 'center', fontSize: 16, color: '#666' },
// // });

// // export default SupervisorDashboard;








// // import React, { useEffect, useState, useMemo, useCallback } from 'react';
// // import {
// //   View,
// //   Text,
// //   SectionList,
// //   StyleSheet,
// //   ActivityIndicator,
// //   Alert,
// //   TouchableOpacity,
// //   RefreshControl,
// //   SafeAreaView,
// // } from 'react-native';
// // import { useNavigation, CommonActions, NavigationProp } from '@react-navigation/native';
// // import apiClient from '../../api/apiClient';
// // import { useAuth } from '../../context/AuthContext';
// // import type { RootStackParamList } from '../../navigation/AppNavigator';
// // import Ionicons from 'react-native-vector-icons/Ionicons';

// // type PENavigationProp = NavigationProp<RootStackParamList>;

// // interface SubmissionSummary {
// //   id: number;
// //   supervisor_id: number;
// //   supervisor_name: string;
// //   date: string;
// //   ticket_count: number;
// //   timesheet_count: number;
// //   job_code: string;
// // }

// // const COLORS = {
// //   primary: '#007AFF',
// //   background: '#F2F2F7',
// //   card: '#FFFFFF',
// //   textPrimary: '#1C1C1E',
// //   textSecondary: '#636366',
// //   border: '#E5E5EA',
// //   danger: '#FF3B30',
// //   success: '#34C759',
// //   lightBlue: '#90caf9',
// // };

// // const ProjectEngineerDashboard = () => {
// //   const navigation = useNavigation<PENavigationProp>();
// //   const { logout } = useAuth();

// //   const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
// //   const [loading, setLoading] = useState(false);
// //   const [refreshing, setRefreshing] = useState(false);

// //   /** 🔹 Fetch all supervisor-submitted data for this PE */
// //   const loadDashboardData = useCallback(async () => {
// //     try {
// //       setLoading(true);
// //       const response = await apiClient.get('/api/project-engineer/submissions'); 
// //       setSubmissions(response.data);
// //     } catch (error: any) {
// //       console.error('Failed to load PE dashboard data:', error);
// //       Alert.alert('Error', error.response?.data?.detail || 'Failed to load Project Engineer dashboard data');
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     loadDashboardData();
// //   }, [loadDashboardData]);

// //   const onRefresh = async () => {
// //     setRefreshing(true);
// //     await loadDashboardData();
// //     setRefreshing(false);
// //   };

// //   /** 🔹 Group by Date */
// //   const sections = useMemo(() => {
// //     const grouped = submissions.reduce((acc, item) => {
// //       (acc[item.date] = acc[item.date] || []).push(item);
// //       return acc;
// //     }, {} as Record<string, SubmissionSummary[]>);

// //     return Object.entries(grouped)
// //       .sort(([a], [b]) => (a < b ? 1 : -1))
// //       .map(([date, items]) => ({ title: date, data: items }));
// //   }, [submissions]);

// //   const handleLogout = () => {
// //     logout();
// //     navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
// //   };

// //   if (loading && !refreshing) {
// //     return (
// //       <View style={styles.centered}>
// //         <ActivityIndicator size="large" color={COLORS.primary} />
// //       </View>
// //     );
// //   }

// //   return (
// //     <SafeAreaView style={styles.container}>
// //       <View style={styles.header}>
// //         <Text style={styles.headerTitle}>Project Engineer Dashboard</Text>
// //         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
// //           <Text style={styles.logoutButtonText}>Logout</Text>
// //         </TouchableOpacity>
// //       </View>

// //       <SectionList
// //         sections={sections}
// //         keyExtractor={item => item.id.toString()}
// //         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
// //         ListEmptyComponent={
// //           <View style={styles.emptyContainer}>
// //             <Ionicons name="file-tray-stacked-outline" size={60} color={COLORS.border} />
// //             <Text style={styles.emptyText}>No submissions received</Text>
// //             <Text style={styles.emptySubText}>Supervisor submissions will appear here.</Text>
// //           </View>
// //         }
// //         renderSectionHeader={({ section }) => (
// //           <View style={styles.dateGroupContainer}>
// //             <Text style={styles.dateHeader}>
// //               {new Date(section.title + 'T00:00:00').toLocaleDateString()}
// //             </Text>
// //           </View>
// //         )}
// //         renderItem={({ item }) => (
// //           <View style={styles.notificationItem}>
// //             <View
// //               style={{
// //                 flexDirection: 'row',
// //                 justifyContent: 'space-between',
// //                 alignItems: 'center',
// //                 paddingBottom: 8,
// //               }}
// //             >
// //               <Text style={styles.supervisorName}>
// //                 <Ionicons name="person-circle-outline" size={20} /> {item.supervisor_name}
// //               </Text>
// //               <Text style={styles.jobCodeRight}>Job Code: {item.job_code}</Text>
// //             </View>

// //             <TouchableOpacity
// //               style={styles.actionRow}
// //               onPress={() =>
// //                 navigation.navigate('PETimesheetList', {
// //                   supervisorId: item.supervisor_id,
// //                   date: item.date,
// //                   supervisorName: item.supervisor_name,
// //                 })
// //               }
// //             >
// //               <Text style={styles.actionLabel}>Timesheets ({item.timesheet_count ?? 0})</Text>
// //               <Ionicons name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
// //             </TouchableOpacity>

// //             <TouchableOpacity
// //               style={styles.actionRow}
// //               onPress={() =>
// //                 navigation.navigate('PETicketList', {
// //                   supervisorId: item.supervisor_id,
// //                   date: item.date,
// //                   supervisorName: item.supervisor_name,
// //                 })
// //               }
// //             >
// //               <Text style={styles.actionLabel}>Tickets ({item.ticket_count ?? 0})</Text>
// //               <Ionicons name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
// //             </TouchableOpacity>
// //           </View>
// //         )}
// //       />
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: COLORS.background },
// //   header: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     paddingHorizontal: 16,
// //     paddingTop: 12,
// //     paddingBottom: 16,
// //     backgroundColor: COLORS.card,
// //     borderBottomWidth: 1,
// //     borderBottomColor: COLORS.border,
// //   },
// //   headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
// //   logoutButton: {
// //     backgroundColor: '#FF3B301A',
// //     paddingHorizontal: 14,
// //     paddingVertical: 8,
// //     borderRadius: 18,
// //   },
// //   logoutButtonText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
// //   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
// //   dateGroupContainer: { backgroundColor: '#e9ecef', paddingVertical: 10, paddingHorizontal: 16 },
// //   dateHeader: { fontSize: 19, fontWeight: '700', color: '#495057' },
// //   notificationItem: {
// //     marginHorizontal: 16,
// //     marginTop: 12,
// //     padding: 12,
// //     backgroundColor: COLORS.card,
// //     borderRadius: 8,
// //     shadowColor: '#000',
// //     shadowOpacity: 0.08,
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowRadius: 4,
// //     elevation: 3,
// //   },
// //   jobCodeRight: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
// //   supervisorName: {
// //     fontSize: 18,
// //     fontWeight: '600',
// //     marginBottom: 12,
// //     color: COLORS.textPrimary,
// //     paddingBottom: 8,
// //     borderBottomWidth: 1,
// //     borderBottomColor: COLORS.border,
// //   },
// //   actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
// //   actionLabel: { fontSize: 16, fontWeight: '500', color: COLORS.primary },
// //   emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
// //   emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginTop: 16, textAlign: 'center' },
// //   emptySubText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
// // });

// // export default ProjectEngineerDashboard;











// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   SectionList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Alert,
//   SafeAreaView,
//   RefreshControl,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import apiClient from '../../api/apiClient';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const COLORS = {
//   primary: '#007AFF',
//   background: '#F2F2F7',
//   card: '#FFF',
//   textPrimary: '#1C1C1E',
//   textSecondary: '#636366',
// };

// const PEDashboard = () => {
//   const navigation = useNavigation();
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   const loadData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await apiClient.get('/api/project-engineer/submissions');
//       setNotifications(res.data);
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert('Error', 'Failed to load submissions');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadData();
//     setRefreshing(false);
//   };

//   // Group by date
//   const sections: SectionListData<Notification, { title: string }>[] = useMemo(() => {
//   const grouped = notifications.reduce((acc, item) => {
//     (acc[item.date] = acc[item.date] || []).push(item);
//     return acc;
//   }, {} as Record<string, Notification[]>);

//   return Object.entries(grouped)
//     .sort(([a], [b]) => (a < b ? 1 : -1))
//     .map(([date, notifs]) => ({
//       title: date,
//       data: notifs as Notification[], // <-- explicit cast here
//     }));
// }, [notifications]);

//   return (
//     <SafeAreaView style={styles.container}>
//       {loading && !refreshing ? (
//         <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
//       ) : (
//         <SectionList
//           sections={sectionArray}
//           keyExtractor={(item) => item.id.toString()}
//           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//           renderSectionHeader={({ section }) => (
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionHeaderText}>
//                 {new Date(section.title + 'T00:00:00').toLocaleDateString()}
//               </Text>
//             </View>
//           )}
//           renderItem={({ item }) => (
//             <View style={styles.itemContainer}>
//               <View style={styles.row}>
//                 <Text style={styles.supervisorName}>{item.supervisor_name}</Text>
//                 {item.job_code && <Text style={styles.jobCode}>{item.job_code}</Text>}
//               </View>

//               <View style={styles.row}>
//                 {/* <TouchableOpacity
//                   onPress={() =>
//                     navigation.navigate('PETimesheetList', {
//                       supervisorId: item.supervisor_id,
//                       date: item.date,
//                       supervisorName: item.supervisor_name,
//                     })
//                   }
//                 > */}
//                   <Text style={styles.actionLabel}>Timesheets ({item.timesheet_count})</Text>
//                 {/* </TouchableOpacity> */}

//                 {/* <TouchableOpacity
//                   onPress={() =>
//                     navigation.navigate('PETicketList', {
//                       supervisorId: item.supervisor_id,
//                       date: item.date,
//                       supervisorName: item.supervisor_name,
//                     })
//                   }
//                 > */}
//                   <Text style={styles.actionLabel}>Tickets ({item.ticket_count})</Text>
//                 {/* </TouchableOpacity> */}
//               </View>
//             </View>
//           )}
//           ListEmptyComponent={
//             <View style={{ alignItems: 'center', marginTop: 50 }}>
//               <Ionicons name="file-tray-stacked-outline" size={60} color={COLORS.textSecondary} />
//               <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.textSecondary }}>No submissions yet</Text>
//             </View>
//           }
//         />
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background },
//   sectionHeader: { backgroundColor: '#e9ecef', padding: 10 },
//   sectionHeaderText: { fontSize: 18, fontWeight: '700' },
//   itemContainer: { backgroundColor: COLORS.card, marginHorizontal: 10, marginVertical: 6, padding: 12, borderRadius: 8 },
//   row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
//   supervisorName: { fontSize: 16, fontWeight: '600' },
//   jobCode: { fontSize: 15, color: COLORS.primary, fontWeight: '500' },
//   actionLabel: { fontSize: 15, color: COLORS.primary, fontWeight: '600', marginRight: 12 },
// });

// export default PEDashboard;
