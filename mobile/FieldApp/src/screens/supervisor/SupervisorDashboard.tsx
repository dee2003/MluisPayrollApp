import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Button,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native';
import type { RootStackParamList, SupervisorStackParamList } from '../../navigation/AppNavigator';

const SupervisorDashboard = () => {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  // Typed navigation as root stack to allow navigating to 'Login'
  const navigation = useNavigation<NavigationProp<RootStackParamList & SupervisorStackParamList>>();

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const res = await apiClient.get('/api/timesheets/for-supervisor');
        setTimesheets(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, []);

  const handleLogout = () => {
    logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  const handleViewTimesheet = (timesheetId: number) => {
    navigation.navigate('TimesheetView', { timesheetId });
  };

  const renderTimesheet = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.jobTitle}>{item.timesheet_name || 'Untitled Timesheet'}</Text>
      <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
      <Text>Foreman ID: {item.foreman_id}</Text>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => handleViewTimesheet(item.id)}
      >
        <Text style={styles.viewButtonText}>View Timesheet</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Button title="Logout" color="#d9534f" onPress={handleLogout} />
      <FlatList
        data={timesheets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTimesheet}
        contentContainerStyle={{ padding: 10 }}
        ListEmptyComponent={<Text>No timesheets found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 12 },
  jobTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
  viewButton: {
    marginTop: 10,
    backgroundColor: '#1D4ED8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SupervisorDashboard;
