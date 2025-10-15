import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native';
import type { RootStackParamList, SupervisorStackParamList } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons'; // Import an icon set

// Define a basic type for the timesheet object for better type safety
type TimesheetSummary = {
  id: number;
  timesheet_name: string;
  date: string;
  foreman_id: number;
};

// Consistent color palette
const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
  danger: '#FF3B30',
};

const SupervisorDashboard = () => {
  const [timesheets, setTimesheets] = useState<TimesheetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  const navigation = useNavigation<NavigationProp<RootStackParamList & SupervisorStackParamList>>();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTimesheets();
    });

    fetchTimesheets();
    
    return unsubscribe;
  }, [navigation]);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/timesheets/for-supervisor');
      setTimesheets(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
    navigation.navigate('TimesheetReview', { timesheetId });
  };

  // --- NEW STYLED RENDER FUNCTION ---
  const renderTimesheet = ({ item }: { item: TimesheetSummary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleViewTimesheet(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.jobTitle}>{item.timesheet_name || 'Untitled Timesheet'}</Text>
        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={16} color={COLORS.textSecondary} style={styles.icon} />
          <Text style={styles.infoText}>Date: {new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="person-outline" size={16} color={COLORS.textSecondary} style={styles.icon} />
          <Text style={styles.infoText}>Foreman ID: {item.foreman_id}</Text>
        </View>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Timesheets</Text>
        {/* Custom Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={timesheets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTimesheet}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="file-tray-stacked-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No Timesheets to Review</Text>
            <Text style={styles.emptySubText}>Submitted timesheets will appear here.</Text>
          </View>
        }
        onRefresh={fetchTimesheets}
        refreshing={loading}
      />
    </SafeAreaView>
  );
};

// --- NEW STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  logoutButton: {
    backgroundColor: '#FF3B301A', // A lighter, transparent red
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32, // Add space at the bottom of the list
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1, // Allows text content to take up available space
  },
  jobTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 10,
    color: COLORS.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SupervisorDashboard;