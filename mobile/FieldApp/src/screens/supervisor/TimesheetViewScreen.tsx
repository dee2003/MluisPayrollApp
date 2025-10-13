import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import type { SupervisorStackParamList } from '../../navigation/AppNavigator';

const TimesheetView = () => {
  const route = useRoute<RouteProp<SupervisorStackParamList, 'TimesheetView'>>();
  const { timesheetId } = route.params;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        const res = await apiClient.get(`/api/timesheets/${timesheetId}/view`);
        setData(res.data);
      } catch (e: any) {
        console.error(e);
        Alert.alert('Error', e.message || 'Failed to load timesheet.');
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheet();
  }, [timesheetId]);

  if (loading) return <ActivityIndicator style={styles.centered} size="large" />;
  if (!data) return <Text style={styles.centered}>No timesheet data found.</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.timesheet_name || 'Untitled Timesheet'}</Text>
      <Text>Date: {data.date}</Text>
      <Text>Foreman: {data.foreman_name}</Text>
      <Text>Status: {data.status}</Text>

      <Text style={styles.sectionTitle}>Employees</Text>
      {data.employees?.map((emp: any) => (
        <View key={emp.id} style={styles.row}>
          <Text>{emp.first_name} {emp.last_name}</Text>
          <Text>Class: {emp.selected_class || emp.class_1}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Equipment</Text>
      {data.equipment?.map((eq: any) => (
        <View key={eq.id} style={styles.row}>
          <Text>{eq.name}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Materials & Vendors</Text>
      {data.materials?.map((m: any) => (
        <View key={m.id} style={styles.row}>
          <Text>{m.vendor}: {m.tickets || 0} tickets</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  sectionTitle: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  row: { marginVertical: 4 },
});

export default TimesheetView;
