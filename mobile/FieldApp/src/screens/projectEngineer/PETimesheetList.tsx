// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   SafeAreaView,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
// import apiClient from '../../api/apiClient';
// import type { ProjectEngineerStackParamList } from '../../navigation/AppNavigator';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { StackNavigationProp } from '@react-navigation/stack';

// // Type for each timesheet
// type TimesheetSummary = {
//   id: number;
//   timesheet_name: string;
//   job_name: string;
// };

// // Route and navigation types
// type TimesheetListRouteProp = RouteProp<ProjectEngineerStackParamList, 'PETimesheetList'>;
// type NavigationProp = StackNavigationProp<ProjectEngineerStackParamList, 'PETimesheetList'>;

// const COLORS = {
//   primary: '#007AFF',
//   background: '#F2F2F7',
//   card: '#FFFFFF',
//   textPrimary: '#1C1C1E',
//   textSecondary: '#636366',
//   border: '#E5E5EA',
// };

// const PETimesheetListScreen = () => {
//   const route = useRoute<TimesheetListRouteProp>();
//   const navigation = useNavigation<NavigationProp>();
//   const { foremanId, date, foremanName } = route.params;

//   const [timesheets, setTimesheets] = useState<TimesheetSummary[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchTimesheets = async () => {
//       setLoading(true);
//       try {
//         // 🔹 Adjusted endpoint for Project Engineer API
//         const response = await apiClient.get<TimesheetSummary[]>(
//           `/api/review/pe/timesheets?foreman_id=${foremanId}&date=${date}`
//         );
//         setTimesheets(response.data);
//       } catch (error: any) {
//         console.error('Failed to fetch PE timesheets:', error);
//         Alert.alert('Error', 'Could not load timesheets for this foreman.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTimesheets();
//   }, [foremanId, date]);

//   const handleSelectTimesheet = (timesheetId: number) => {
//     navigation.navigate('TimesheetReview', { timesheetId });
    
//   };

//   const renderTimesheetItem = ({ item }: { item: TimesheetSummary }) => (
//     <TouchableOpacity style={styles.card} onPress={() => handleSelectTimesheet(item.id)}>
//       <View style={styles.cardContent}>
//         <Text style={styles.highlightedTimesheetName}>{item.timesheet_name}</Text>
//       </View>
//       <Icon name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <FlatList
//         data={timesheets}
//         renderItem={renderTimesheetItem}
//         keyExtractor={(item) => item.id.toString()}
//         contentContainerStyle={styles.listContainer}
//         ListHeaderComponent={
//           <Text style={styles.headerText}>Timesheets from {foremanName}</Text>
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Icon name="document-text-outline" size={60} color={COLORS.border} />
//             <Text style={styles.emptyText}>No timesheets found for this date.</Text>
//           </View>
//         }
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   listContainer: { padding: 16 },
//   headerText: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: COLORS.textPrimary,
//     marginBottom: 16,
//     paddingHorizontal: 8,
//   },
//   card: {
//     backgroundColor: COLORS.card,
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   cardContent: { flex: 1 },
//   cardTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
//   cardSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
//   emptyContainer: { alignItems: 'center', marginTop: 80 },
//   emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
//   highlightedTimesheetName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#0b0b0bff',
//     marginBottom: 4,
//   },
// });

// export default PETimesheetListScreen;



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
import type { ProjectEngineerStackParamList } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { StackNavigationProp } from '@react-navigation/stack';

type TimesheetSummary = {
  id: number;
  timesheet_name: string;
  job_name: string;
};

type TimesheetListRouteProp = RouteProp<ProjectEngineerStackParamList, 'PETimesheetList'>;
type NavigationProp = StackNavigationProp<ProjectEngineerStackParamList, 'PETimesheetList'>;

const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
};

const PETimesheetListScreen = () => {
  const route = useRoute<TimesheetListRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { foremanId, date, foremanName } = route.params;

  const [timesheets, setTimesheets] = useState<TimesheetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: `${foremanName} Timesheets`,
    });

    const fetchTimesheets = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<TimesheetSummary[]>(
          `/api/review/pe/timesheets?foreman_id=${foremanId}&date=${date}`
        );
        setTimesheets(response.data);
      } catch (error: any) {
        console.error('Failed to fetch PE timesheets:', error);
        Alert.alert('Error', 'Could not load timesheets for this foreman.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, [foremanId, date]);

  const handleSelectTimesheet = (timesheetId: number) => {
    navigation.navigate('TimesheetReview', { timesheetId });
  };

  const renderTimesheetItem = ({ item }: { item: TimesheetSummary }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectTimesheet(item.id)}>
      <View style={styles.cardContent}>
        <Text style={styles.highlightedTimesheetName}>{item.timesheet_name}</Text>
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
  highlightedTimesheetName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
});

export default PETimesheetListScreen;
