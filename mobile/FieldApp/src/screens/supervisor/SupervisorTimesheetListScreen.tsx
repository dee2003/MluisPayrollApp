import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import type { SupervisorStackParamList } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the shape of a single Timesheet object for this list
type TimesheetSummary = {
  id: number;
  timesheet_name: string; // e.g., "Job Name - Date"
  job_name: string;
};

// Define the route and navigation prop types
type TimesheetListRouteProp = RouteProp<SupervisorStackParamList, 'SupervisorTimesheetList'>;
type NavigationProp = StackNavigationProp<SupervisorStackParamList, 'SupervisorTimesheetList'>;

const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
};

const SupervisorTimesheetListScreen = () => {
  const route = useRoute<TimesheetListRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { foremanId, date, foremanName } = route.params;

  const [timesheets, setTimesheets] = useState<TimesheetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimesheets = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<TimesheetSummary[]>(
          `/api/timesheets/for-supervisor?foreman_id=${foremanId}&date=${date}`
        );
        setTimesheets(response.data);
      } catch (error: any) {
        console.error('Failed to fetch timesheets:', error);
        Alert.alert('Error', 'Could not load timesheets for this foreman.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, [foremanId, date]);
  
  const handleSelectTimesheet = (timesheetId: number) => {
    // Navigate to the review screen for the selected timesheet
    navigation.navigate('TimesheetReview', { timesheetId });
  };

  const renderTimesheetItem = ({ item }: { item: TimesheetSummary }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectTimesheet(item.id)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardSubtitle}>{item.timesheet_name}</Text>
      </View>
      <Icon name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={timesheets}
        renderItem={renderTimesheetItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
            <Text style={styles.headerText}>Timesheets from {foremanName}</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="document-text-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No timesheets found for this date.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
});

export default SupervisorTimesheetListScreen;
