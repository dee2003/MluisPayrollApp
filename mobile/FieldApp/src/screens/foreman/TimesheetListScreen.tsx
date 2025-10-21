// /src/screens/foreman/TimesheetListScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../api/apiClient';
import { Timesheet } from '../../types';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { ForemanStackParamList } from '../../navigation/AppNavigator';

type ListNavigationProp = StackNavigationProp<ForemanStackParamList, 'TimesheetList'>;

const TimesheetListScreen = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<ListNavigationProp>();
  const isFocused = useIsFocused();
  const { user } = useAuth(); // Get the logged-in user

  const fetchTimesheets = async () => {
    if (!user) return; // Don't fetch if there's no user

    setLoading(true);
    try {
      // --- FIX: Call the correct endpoint to get timesheets for this foreman ---
      const response = await apiClient.get<Timesheet[]>(`/api/timesheets/by-foreman/${user.id}`);
      setTimesheets(response.data);
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused && user) {
      fetchTimesheets();
    }
  }, [isFocused, user]); // Refetch if the user changes or screen is focused

  // ... (The rest of the component remains the same)
  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  const renderItem = ({ item }: { item: Timesheet }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('TimesheetEdit', { timesheetId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobName}>{item.data.job_name}</Text>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={timesheets}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      ListHeaderComponent={<Text style={styles.title}>All My Timesheets</Text>}
      ListEmptyComponent={<Text style={styles.emptyText}>No timesheets found for you.</Text>}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTimesheets} />}
    />
  );
};

// ... (Styles remain the same)
const styles = StyleSheet.create({
    container: { padding: 15 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 15, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    jobName: { fontSize: 18, fontWeight: 'bold' },
    date: { fontSize: 14, color: '#666', marginTop: 5 },
    statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15, },
    statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12, },
    statusPending: { backgroundColor: '#f39c12' },
    statusSubmitted: { backgroundColor: '#3498db' },
    statusApproved: { backgroundColor: '#2ecc71' },
    statusRejected: { backgroundColor: '#e74c3c' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default TimesheetListScreen;