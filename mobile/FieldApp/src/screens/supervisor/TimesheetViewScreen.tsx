// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   SafeAreaView,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import { RouteProp, useRoute } from '@react-navigation/native';
// import apiClient from '../../api/apiClient';
// import type { SupervisorStackParamList } from '../../navigation/AppNavigator';
// import type { Timesheet } from '../../types'; // Assuming you have this type defined

// // Define a type for the hour state, which maps entity IDs to their phase hours
// type HourState = Record<string, Record<string, string>>;

// // Define the navigation route prop for this screen
// type ReviewRouteProp = RouteProp<SupervisorStackParamList, 'TimesheetReview'>;

// // Define your color palette for consistent styling
// const COLORS = {
//   primary: '#007AFF',
//   success: '#34C759',
//   background: '#F2F2F7',
//   card: '#FFFFFF',
//   text: '#1C1C1E',
//   textSecondary: '#636366',
//   border: '#E5E5EA',
// };

// const TimesheetReviewScreen = () => {
//   const route = useRoute<ReviewRouteProp>();
//   const { timesheetId } = route.params;

//   // State for the timesheet data, loading status, and selected phase
//   const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
//   const [foremanName, setForemanName] = useState<string>('');
//   const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   // States to hold the pre-calculated hours for each entity type
//   const [employeeHours, setEmployeeHours] = useState<HourState>({});
//   const [equipmentHours, setEquipmentHours] = useState<HourState>({});
//   const [materialHours, setMaterialHours] = useState<HourState>({});
//   const [vendorHours, setVendorHours] = useState<HourState>({});

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // Fetch the complete timesheet data, not from a '/view' endpoint
//         const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
//         const tsData = response.data;
//         setTimesheet(tsData);

//         // Set the default selected phase to the first one available
//         if (tsData.data.job.phase_codes?.length > 0) {
//           setSelectedPhase(tsData.data.job.phase_codes[0]);
//         }

//         // Helper function to populate hour states from the fetched data
//         const populateHours = (entities: any[] = []): HourState => {
//           const state: HourState = {};
//           entities.forEach((entity) => {
//             state[entity.id] = {};
//             if (entity.hours_per_phase) {
//               for (const phase in entity.hours_per_phase) {
//                 state[entity.id][phase] = String(entity.hours_per_phase[phase] || '0');
//               }
//             }
//           });
//           return state;
//         };

//         // Populate hours for all entity types
//         setEmployeeHours(populateHours(tsData.data.employees));
//         setEquipmentHours(populateHours(tsData.data.equipment));
//         setMaterialHours(populateHours(tsData.data.materials));
//         setVendorHours(populateHours(tsData.data.vendors));

//         // Fetch the foreman's name for display
//         const userRes = await apiClient.get(`/api/users/${tsData.foreman_id}`);
//         setForemanName(`${userRes.data.first_name} ${userRes.data.last_name}`.trim());

//       } catch (error) {
//         console.error('Failed to load timesheet:', error);
//         Alert.alert('Error', 'Failed to load timesheet data.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [timesheetId]);

//   // Function to calculate the total hours for an entity across all phases
//   const calculateTotalHours = (hoursState: HourState, entityId: string): number => {
//     const entityPhases = hoursState[entityId];
//     if (!entityPhases) return 0;
//     return Object.values(entityPhases).reduce((total, hours) => total + (parseFloat(hours) || 0), 0);
//   };

//   // A reusable component to render a read-only block for each entity type
//   const renderReadOnlyBlock = (
//     title: string,
//     entities: any[],
//     hoursState: HourState,
//     type: 'employee' | 'equipment' | 'material' | 'vendor'
//   ) => {
//     if (!entities || entities.length === 0) return null; // Don't render empty sections

//     return (
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>{title}</Text>
//         {entities.map((entity) => {
//           const totalHours = calculateTotalHours(hoursState, entity.id);
//           const entityName = entity.first_name
//             ? `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim()
//             : entity.name;

//           const phaseValue = (selectedPhase && hoursState[entity.id]?.[selectedPhase]) || '0';

//           return (
//             <View key={entity.id} style={styles.entityContainer}>
//               <Text style={styles.inputLabel}>{entityName}</Text>
              
//               <View style={styles.controlsRow}>
//                 {/* For employees, display the selected class */}
//                 {type === 'employee' && (
//                   <View style={styles.classDisplay}>
//                     <Text style={styles.classText}>Class: {entity.selected_class || 'N/A'}</Text>
//                   </View>
//                 )}
//                 {/* Spacer for other types to maintain alignment */}
//                 {type !== 'employee' && <View style={{ flex: 1 }} />}

//                 {/* Hour display section */}
//                 <View style={styles.hoursContainer}>
//                   <View style={styles.inputWithLabel}>
//                     <Text style={styles.inputHeader}>Phase</Text>
//                     <View style={styles.readonlyBox}>
//                       <Text style={styles.readonlyText}>{phaseValue}</Text>
//                     </View>
//                   </View>
//                   <View style={styles.inputWithLabel}>
//                     <Text style={styles.inputHeader}>Total</Text>
//                     <View style={styles.totalBox}>
//                       <Text style={styles.totalText}>{totalHours.toFixed(1)}</Text>
//                     </View>
//                   </View>
//                 </View>
//               </View>
//             </View>
//           );
//         })}
//       </View>
//     );
//   };

//   // Loading and error states
//   if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
//   if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found.</Text></View>;

//   const { data, date } = timesheet;

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView style={styles.container}>
//         {/* Info Card with all the header details */}
//         <View style={styles.infoCard}>
//           <Text style={styles.jobTitle}>{data.job_name}</Text>
//           <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
//           <Text style={styles.infoText}>Date: {new Date(date).toLocaleDateString()}</Text>
//           <Text style={styles.infoText}>Foreman: {foremanName}</Text>
//           <Text style={styles.infoText}>Project Engineer: {data.project_engineer || 'N/A'}</Text>
//         </View>

//         {/* Horizontal scroll for phase codes */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelector}>
//           {data.job.phase_codes.map((phase) => (
//             <TouchableOpacity
//               key={phase}
//               style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]}
//               onPress={() => setSelectedPhase(phase)}
//             >
//               <Text style={[styles.phaseButtonText, selectedPhase === phase && styles.selectedPhaseButtonText]}>
//                 {phase}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Render the read-only blocks for each entity type */}
//         {selectedPhase && (
//           <View>
//             {renderReadOnlyBlock('Employees', data.employees, employeeHours, 'employee')}
//             {renderReadOnlyBlock('Equipment', data.equipment, equipmentHours, 'equipment')}
//             {renderReadOnlyBlock('Materials', data.materials, materialHours, 'material')}
//             {renderReadOnlyBlock('Vendors', data.vendors, vendorHours, 'vendor')}
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: COLORS.background },
//   container: { flex: 1, paddingHorizontal: 10, paddingBottom: 20 },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   infoCard: { padding: 16, backgroundColor: COLORS.card, borderRadius: 12, marginTop: 10 },
//   jobTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
//   jobCode: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
//   infoText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8 },
//   card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12 },
//   cardTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
//   entityContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
//   inputLabel: { fontSize: 17, color: COLORS.text, marginBottom: 10, fontWeight: '500' },
//   controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   classDisplay: { flex: 1, justifyContent: 'center' },
//   classText: { fontSize: 16, color: COLORS.textSecondary },
//   hoursContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
//   inputWithLabel: { alignItems: 'center', marginLeft: 8 },
//   inputHeader: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
//   readonlyBox: {
//     backgroundColor: COLORS.background,
//     borderRadius: 8,
//     height: 44,
//     width: 70,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   readonlyText: { fontSize: 16, fontWeight: '500', color: COLORS.text },
//   totalBox: {
//     backgroundColor: COLORS.background,
//     borderRadius: 8,
//     height: 44,
//     width: 70,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   totalText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
//   phaseSelector: { marginVertical: 10 },
//   phaseButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     marginRight: 8,
//     borderRadius: 20,
//     backgroundColor: COLORS.card,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   selectedPhaseButton: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
//   phaseButtonText: { color: COLORS.text, fontWeight: '600', fontSize: 16 },
//   selectedPhaseButtonText: { color: '#FFF' },
// });

// export default TimesheetReviewScreen;
// export default TimesheetReviewScreen;
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import type { SupervisorStackParamList } from '../../navigation/AppNavigator';
import type { Timesheet } from '../../types';

type HourState = Record<string, Record<string, string>>;
type ReviewRouteProp = RouteProp<SupervisorStackParamList, 'TimesheetReview'>;

const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
  tableHeaderBg: '#F2F2F7',
  rowAlternateBg: '#F9F9F9',
};

const TimesheetReviewScreen = () => {
  const route = useRoute<ReviewRouteProp>();
  const { timesheetId } = route.params;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [foremanName, setForemanName] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [employeeHours, setEmployeeHours] = useState<HourState>({});
  const [equipmentHours, setEquipmentHours] = useState<HourState>({});
  const [materialHours, setMaterialHours] = useState<HourState>({});
  const [vendorHours, setVendorHours] = useState<HourState>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
        const tsData = response.data;
        setTimesheet(tsData);

        if (tsData.data.job.phase_codes?.length > 0) {
          setSelectedPhase(tsData.data.job.phase_codes[0]);
        }

        const populateHours = (entities: any[] = []): HourState => {
          const state: HourState = {};
          entities.forEach((entity) => {
            state[entity.id] = {};
            if (entity.hours_per_phase) {
              for (const phase in entity.hours_per_phase) {
                state[entity.id][phase] = String(entity.hours_per_phase[phase] || '0');
              }
            }
          });
          return state;
        };

        setEmployeeHours(populateHours(tsData.data.employees));
        setEquipmentHours(populateHours(tsData.data.equipment));
        setMaterialHours(populateHours(tsData.data.materials));
        setVendorHours(populateHours(tsData.data.vendors));

        const userRes = await apiClient.get(`/api/users/${tsData.foreman_id}`);
        setForemanName(`${userRes.data.first_name} ${userRes.data.last_name}`.trim());

      } catch (error) {
        console.error('Failed to load timesheet:', error);
        Alert.alert('Error', 'Failed to load timesheet data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timesheetId]);

  const calculateTotalHours = (hoursState: HourState, entityId: string): number => {
    const entityPhases = hoursState[entityId];
    if (!entityPhases) return 0;
    return Object.values(entityPhases).reduce((total, hours) => total + (parseFloat(hours) || 0), 0);
  };

  // Reusable component to render data in a table format
  const renderTableBlock = (
    title: string,
    entities: any[],
    hoursState: HourState,
    type: 'employee' | 'equipment' | 'material' | 'vendor'
  ) => {
    if (!entities || entities.length === 0) return null;

    const isEmployee = type === 'employee';

    return (
      <View style={styles.card}>
        <Text style={styles.tableTitle}>{title}</Text>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, isEmployee ? styles.colName : styles.colNameWide]}>Name</Text>
            {isEmployee && <Text style={[styles.headerCell, styles.colClass]}>Class</Text>}
            <Text style={[styles.headerCell, styles.colHours]}>Hours</Text>
            <Text style={[styles.headerCell, styles.colTotal, styles.lastCell]}>Total</Text>
          </View>

          {/* Table Body */}
          {entities.map((entity, index) => {
            const totalHours = calculateTotalHours(hoursState, entity.id);
            const entityName = entity.first_name
              ? `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim()
              : entity.name;
            const phaseValue = (selectedPhase && hoursState[entity.id]?.[selectedPhase]) || '0';

            return (
              <View key={entity.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlternate]}>
                <Text style={[styles.dataCell, isEmployee ? styles.colName : styles.colNameWide]}>{entityName}</Text>
                {isEmployee && <Text style={[styles.dataCell, styles.colClass]}>{entity.selected_class || 'N/A'}</Text>}
                <Text style={[styles.dataCell, styles.colHours]}>{phaseValue}</Text>
                <Text style={[styles.dataCell, styles.colTotal, styles.lastCell]}>{totalHours.toFixed(1)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found.</Text></View>;

  const { data, date } = timesheet;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.infoCard}>
          <Text style={styles.jobTitle}>{data.job_name}</Text>
          <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
          <Text style={styles.infoText}>Date: {new Date(date).toLocaleDateString()}</Text>
          <Text style={styles.infoText}>Foreman: {foremanName}</Text>
          <Text style={styles.infoText}>Project Engineer: {data.project_engineer || 'N/A'}</Text>
          
                    <Text style={styles.infoText}>Location: {data.location || 'N/A'}</Text>
                    <Text style={styles.infoText}>Weather: {data.weather || 'N/A'}</Text>
                    <Text style={styles.infoText}>Temp: {data.temperature || 'N/A'}</Text>
                    <Text style={styles.infoText}>Day: {data.time_of_day || 'N/A'}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelector}>
          {data.job.phase_codes.map((phase) => (
            <TouchableOpacity
              key={phase}
              style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]}
              onPress={() => setSelectedPhase(phase)}
            >
              <Text style={[styles.phaseButtonText, selectedPhase === phase && styles.selectedPhaseButtonText]}>
                {phase}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedPhase && (
          <View>
            {renderTableBlock('Employees', data.employees, employeeHours, 'employee')}
            {renderTableBlock('Equipment', data.equipment, equipmentHours, 'equipment')}
            {renderTableBlock('Materials', data.materials, materialHours, 'material')}
            {renderTableBlock('Vendors', data.vendors, vendorHours, 'vendor')}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- UPDATED TABLE STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoCard: { padding: 16, backgroundColor: COLORS.card, borderRadius: 12, marginTop: 10, marginBottom: 10 },
  jobTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  jobCode: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  infoText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8 },
  phaseSelector: { marginVertical: 10 },
  phaseButton: {
    paddingHorizontal: 20, paddingVertical: 10, marginRight: 8, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  selectedPhaseButton: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  phaseButtonText: { color: COLORS.text, fontWeight: '600', fontSize: 16 },
  selectedPhaseButtonText: { color: '#FFF' },

  // --- Table Styles ---
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  // This container has the border and hides overflowing content
  tableContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden', // This is important to make inner rows respect the container's borderRadius
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.tableHeaderBg,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1, // Use top border for rows to separate them
    borderTopColor: COLORS.border,
  },
  tableRowAlternate: {
    backgroundColor: COLORS.rowAlternateBg,
  },
  // Base style for all cells
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  headerCell: {
    // Inherit from base cell style
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    // Header-specific styles
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  dataCell: {
    // Inherit from base cell style
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    // Data-specific styles
    fontSize: 16,
    color: COLORS.text,
  },
  // Style to remove the right border from the last cell in a row
  lastCell: {
    borderRightWidth: 0,
  },
  // Column-specific widths and alignments
  colName: {
    flex: 3.5,
    textAlign: 'left',
  },
  colNameWide: {
    flex: 5.5, // Takes up the space of Name + Class columns
    textAlign: 'left',
  },
  colClass: {
    flex: 2,
    textAlign: 'center',
  },
  colHours: {
    flex: 1.5,
    textAlign: 'center',
  },
  colTotal: {
    flex: 1.5,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default TimesheetReviewScreen;