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
// import type { ProjectEngineerStackParamList } from '../../navigation/AppNavigator';
// import type { Timesheet } from '../../types';

// // --- Type Definitions ---
// type SimpleHourState = Record<string, Record<string, string>>;
// type ComplexHourSubState = { REG?: string; 'S.B'?: string };
// type ComplexHourState = Record<string, Record<string, ComplexHourSubState>>;
// type QuantityState = Record<string, string>;

// type ReviewRouteProp = RouteProp<ProjectEngineerStackParamList, 'TimesheetReview'>;

// // --- Theme Constants ---
// const THEME = {
//   primary: '#007AFF',
//   background: '#F0F0F7',
//   card: '#FFFFFF',
//   text: '#1C1C1E',
//   textSecondary: '#6A6A6A',
//   border: '#E0E0E5',
//   tableHeaderBg: '#F8F8F8',
//   rowAlternateBg: '#FCFCFC',
//   SPACING: 16,
// };

// const PETimesheetReviewScreen = () => {
//   const route = useRoute<ReviewRouteProp>();
//   const { timesheetId } = route.params;

//   const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
//   const [foremanName, setForemanName] = useState<string>('');
//   const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   const [employeeHours, setEmployeeHours] = useState<SimpleHourState>({});
//   const [equipmentHours, setEquipmentHours] = useState<ComplexHourState>({});
//   const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
//   const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
//   const [materialTickets, setMaterialTickets] = useState<SimpleHourState>({});
//   const [vendorTickets, setVendorTickets] = useState<SimpleHourState>({});
//   const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});
//   const [notes, setNotes] = useState<string>('');

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
//         const tsData = response.data;
//         setTimesheet(tsData);

//         if (tsData.data.job.phase_codes?.length > 0) {
//           setSelectedPhase(tsData.data.job.phase_codes[0]);
//         }

//         setNotes(tsData.data.notes || '');

//         const populateSimple = (entities: any[] = [], field: 'hours_per_phase' | 'tickets_per_phase'): SimpleHourState => {
//             const state: SimpleHourState = {};
//             entities.forEach((e) => {
//                 state[e.id] = {};
//                 if (e[field]) {
//                     for (const phase in e[field]) {
//                         state[e.id][phase] = String(e[field][phase] || '0');
//                     }
//                 }
//             });
//             return state;
//         };

//         const populateEmployeesSimpleFlexible = (entities: any[] = []): SimpleHourState => {
//           const state: SimpleHourState = {};
//           entities.forEach((e) => {
//             state[e.id] = {};
//             if (e.hours_per_phase) {
//               for (const phase in e.hours_per_phase) {
//                 const v = e.hours_per_phase[phase];
//                 if (v && typeof v === 'object') {
//                   const reg = parseFloat(v.REG || '0');
//                   const sb = parseFloat(v['S.B'] || '0');
//                   state[e.id][phase] = (reg + sb).toString();
//                 } else {
//                   state[e.id][phase] = (v ?? '').toString();
//                 }
//               }
//             }
//           });
//           return state;
//         };

//         const populateEquipmentComplex = (entities: any[] = []): ComplexHourState => {
//           const state: ComplexHourState = {};
//           entities.forEach((e) => {
//             state[e.id] = {};
//             if (e.hours_per_phase) {
//               for (const phase in e.hours_per_phase) {
//                 const v = e.hours_per_phase[phase];
//                 if (v && typeof v === 'object') {
//                   state[e.id][phase] = {
//                     REG: v.REG?.toString() || '0',
//                     'S.B': v['S.B']?.toString() || '0',
//                   };
//                 } else {
//                   const num = parseFloat((v ?? '0').toString());
//                   state[e.id][phase] = { REG: !isNaN(num) ? num.toString() : '0', 'S.B': '0' };
//                 }
//               }
//             }
//           });
//           return state;
//         };

//         setEmployeeHours(populateEmployeesSimpleFlexible(tsData.data.employees));
//         setEquipmentHours(populateEquipmentComplex(tsData.data.equipment));
//         setMaterialHours(populateSimple(tsData.data.materials, 'hours_per_phase'));
//         setVendorHours(populateSimple(tsData.data.vendors, 'hours_per_phase'));
//         setMaterialTickets(populateSimple(tsData.data.materials, 'tickets_per_phase'));
//         setVendorTickets(populateSimple(tsData.data.vendors, 'tickets_per_phase'));

//         if (tsData.data.total_quantities_per_phase) {
//           const q: QuantityState = {};
//           for (const phase in tsData.data.total_quantities_per_phase) {
//             q[phase] = tsData.data.total_quantities_per_phase[phase].toString();
//           }
//           setTotalQuantities(q);
//         }

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

//   // --- Reuse all render functions and helpers from Supervisor version ---
//   // calculateTotalSimpleHours, calculateTotalComplexHours, renderTableBlock
//   // All UI stays identical
//   const calculateTotalSimpleHours = (hoursState: SimpleHourState, entityId: string): number => {
//     const m = hoursState[entityId];
//     if (!m) return 0;
//     return Object.values(m).reduce((t, v) => t + (parseFloat(v) || 0), 0);
//   };

//   const calculateTotalComplexHours = (hoursState: ComplexHourState, entityId: string): number => {
//     const m = hoursState[entityId];
//     if (!m) return 0;
//     return Object.values(m).reduce((t, v) => {
//       const reg = parseFloat(v?.REG || '0');
//       const sb = parseFloat(v?.['S.B'] || '0');
//       return t + (isNaN(reg) ? 0 : reg) + (isNaN(sb) ? 0 : sb);
//     }, 0);
//   };

//   const renderTableBlock = (
//     title: string,
//     entities: any[],
//     hoursState: SimpleHourState | ComplexHourState,
//     ticketsState: SimpleHourState | undefined,
//     type: 'employee' | 'equipment' | 'material' | 'vendor'
//   ) => {
//     if (!entities || entities.length === 0) return null;

//   if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
//   if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found.</Text></View>;
    
//   const { data, date } = timesheet;

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView contentContainerStyle={{ padding: THEME.SPACING, paddingBottom: 50 }}>
//         {/* Info Card */}
//         <View style={styles.infoCard}>
//           <Text style={styles.jobTitle}>{data.job_name}</Text>
//           <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
//           <View style={styles.infoGrid}>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{new Date(date).toLocaleDateString()}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Foreman</Text><Text style={styles.infoValue}>{foremanName}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Day/Night</Text><Text style={styles.infoValue}>{data.time_of_day || 'N/A'}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{data.location || 'N/A'}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Weather</Text><Text style={styles.infoValue}>{data.weather || 'N/A'}</Text></View>
//             <View style={styles.infoItemFull}><Text style={styles.infoLabel}>Temperature</Text><Text style={styles.infoValue}>{data.temperature || 'N/A'}</Text></View>
//           </View>
//         </View>

//         {/* Phase Selector */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelectorContainer}>
//           {data.job.phase_codes.map((phase) => (
//             <TouchableOpacity
//               key={phase}
//               style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]}
//               onPress={() => setSelectedPhase(phase)}
//             >
//               <Text style={[styles.phaseButtonText, selectedPhase === phase && styles.selectedPhaseButtonText]}>{phase}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Data Tables */}
//         {selectedPhase && (
//           <View>
//             {renderTableBlock('Employees', data.employees, employeeHours, undefined, 'employee')}
//             {renderTableBlock('Equipment', data.equipment, equipmentHours, undefined, 'equipment')}
//             {renderTableBlock('Materials and Trucking', data.materials, materialHours, materialTickets, 'material')}
//             {renderTableBlock('Work Performed', data.vendors, vendorHours, vendorTickets, 'vendor')}
//           </View>
//         )}

//         {/* Total Quantity */}
//         {selectedPhase && totalQuantities[selectedPhase] && (
//             <View style={styles.card}>
//                 <Text style={styles.tableTitle}>Total Quantity</Text>
//                 <View style={styles.quantityRow}>
//                     <Text style={styles.quantityLabel}>Phase {selectedPhase}:</Text>
//                     <View style={styles.totalBox}>
//                         <Text style={styles.totalText}>{totalQuantities[selectedPhase]}</Text>
//                     </View>
//                 </View>
//             </View>
//         )}

//         {/* Notes */}
//         {notes ? (
//             <View style={styles.card}>
//                 <Text style={styles.tableTitle}>Notes</Text>
//                 <Text style={styles.notesText}>{notes}</Text>
//             </View>
//         ) : null}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// // --- Reuse the same styles from Supervisor version ---
// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: THEME.background },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   infoCard: {
//     padding: THEME.SPACING, backgroundColor: THEME.card, borderRadius: 14, marginBottom: THEME.SPACING,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
//   },
//   jobTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
//   jobCode: { fontSize: 16, color: THEME.textSecondary, marginTop: 4 },
//   infoGrid: { marginTop: THEME.SPACING, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   infoItem: { width: '48%', marginBottom: 12 },
//   infoItemFull: { width: '100%', marginBottom: 12 },
//   infoLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
//   infoValue: { fontSize: 16, fontWeight: '500', color: THEME.text },
//   phaseSelectorContainer: { marginVertical: THEME.SPACING / 2 },
//   phaseButton: {
//     paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderRadius: 20,
//     backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border,
//   },
//   selectedPhaseButton: { backgroundColor: THEME.primary, borderColor: THEME.primary },
//   phaseButtonText: { color: THEME.text, fontWeight: '600', fontSize: 16 },
//   selectedPhaseButtonText: { color: '#FFF' },
//   card: {
//     backgroundColor: THEME.card, borderRadius: 14, padding: THEME.SPACING, marginBottom: THEME.SPACING,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
//   },
//   tableTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 12 },
//   tableContainer: { borderWidth: 1, borderColor: THEME.border, borderRadius: 8, overflow: 'hidden' },
//   tableHeader: { flexDirection: 'row', backgroundColor: THEME.tableHeaderBg },
//   tableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: THEME.border },
//   tableRowAlternate: { backgroundColor: THEME.rowAlternateBg },
//   headerCell: {
//     paddingVertical: 12, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: THEME.border,
//     fontSize: 14, fontWeight: '600', color: THEME.textSecondary, textAlign: 'center',
//   },
//   dataCell: {
//     paddingVertical: 12, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: THEME.border,
//     fontSize: 15, color: THEME.text,
//   },
//   lastCell: { borderRightWidth: 0 },
//   colName: { flex: 3, textAlign: 'left', paddingLeft: 10 },
//   colClass: { flex: 2, textAlign: 'center' },
//   colHours: { flex: 1.5, textAlign: 'center' },
//   colTickets: { flex: 1.5, textAlign: 'center' },
//   colTotal: { flex: 1.8, textAlign: 'center', fontWeight: '600' },
//   quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   quantityLabel: { fontSize: 16, fontWeight: '500', color: THEME.text },
//   totalBox: {
//     backgroundColor: THEME.background, borderRadius: 10, minWidth: 80, paddingVertical: 10, paddingHorizontal: 16,
//     justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.border,
//   },
//   totalText: { fontSize: 16, fontWeight: 'bold', color: THEME.text },
//   notesText: { fontSize: 16, color: THEME.text, lineHeight: 24 },
//   phaseTotalRow: {
//       backgroundColor: '#E9E9EB',
//       borderTopWidth: 2,
//       borderTopColor: '#C8C7CC',
//   },
//   phaseTotalText: {
//       fontWeight: 'bold',
//       color: THEME.text,
//       textAlign: 'center'
//   },
// });

// export default PETimesheetReviewScreen;


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
import type { ProjectEngineerStackParamList } from '../../navigation/AppNavigator';
import type { Timesheet } from '../../types';

// --- Type Definitions ---
type SimpleHourState = Record<string, Record<string, string>>;
type ComplexHourSubState = { REG?: string; 'S.B'?: string };
type ComplexHourState = Record<string, Record<string, ComplexHourSubState>>;
type QuantityState = Record<string, string>;

type ReviewRouteProp = RouteProp<ProjectEngineerStackParamList, 'TimesheetReview'>;

// --- Theme Constants ---
const THEME = {
  primary: '#007AFF',
  background: '#F0F0F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#6A6A6A',
  border: '#E0E0E5',
  tableHeaderBg: '#F8F8F8',
  rowAlternateBg: '#FCFCFC',
  SPACING: 16,
};

const PETimesheetReviewScreen = () => {
  const route = useRoute<ReviewRouteProp>();
  const { timesheetId } = route.params;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [foremanName, setForemanName] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [employeeHours, setEmployeeHours] = useState<SimpleHourState>({});
  const [equipmentHours, setEquipmentHours] = useState<ComplexHourState>({});
  const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
  const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
  const [materialTickets, setMaterialTickets] = useState<SimpleHourState>({});
  const [vendorTickets, setVendorTickets] = useState<SimpleHourState>({});
  const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
        const tsData = response.data;
        setTimesheet(tsData);

        if (tsData.data.job.phase_codes?.length > 0) {
          setSelectedPhase(tsData.data.job.phase_codes[0]);
        }

        setNotes(tsData.data.notes || '');

        const populateSimple = (entities: any[] = [], field: 'hours_per_phase' | 'tickets_per_phase'): SimpleHourState => {
            const state: SimpleHourState = {};
            entities.forEach((e) => {
                state[e.id] = {};
                if (e[field]) {
                    for (const phase in e[field]) {
                        state[e.id][phase] = String(e[field][phase] || '0');
                    }
                }
            });
            return state;
        };

        const populateEmployeesSimpleFlexible = (entities: any[] = []): SimpleHourState => {
          const state: SimpleHourState = {};
          entities.forEach((e) => {
            state[e.id] = {};
            if (e.hours_per_phase) {
              for (const phase in e.hours_per_phase) {
                const v = e.hours_per_phase[phase];
                if (v && typeof v === 'object') {
                  const reg = parseFloat(v.REG || '0');
                  const sb = parseFloat(v['S.B'] || '0');
                  state[e.id][phase] = (reg + sb).toString();
                } else {
                  state[e.id][phase] = (v ?? '').toString();
                }
              }
            }
          });
          return state;
        };

        const populateEquipmentComplex = (entities: any[] = []): ComplexHourState => {
          const state: ComplexHourState = {};
          entities.forEach((e) => {
            state[e.id] = {};
            if (e.hours_per_phase) {
              for (const phase in e.hours_per_phase) {
                const v = e.hours_per_phase[phase];
                if (v && typeof v === 'object') {
                  state[e.id][phase] = {
                    REG: v.REG?.toString() || '0',
                    'S.B': v['S.B']?.toString() || '0',
                  };
                } else {
                  const num = parseFloat((v ?? '0').toString());
                  state[e.id][phase] = { REG: !isNaN(num) ? num.toString() : '0', 'S.B': '0' };
                }
              }
            }
          });
          return state;
        };

        setEmployeeHours(populateEmployeesSimpleFlexible(tsData.data.employees));
        setEquipmentHours(populateEquipmentComplex(tsData.data.equipment));
        setMaterialHours(populateSimple(tsData.data.materials, 'hours_per_phase'));
        setVendorHours(populateSimple(tsData.data.vendors, 'hours_per_phase'));
        setMaterialTickets(populateSimple(tsData.data.materials, 'tickets_per_phase'));
        setVendorTickets(populateSimple(tsData.data.vendors, 'tickets_per_phase'));

        if (tsData.data.total_quantities_per_phase) {
          const q: QuantityState = {};
          for (const phase in tsData.data.total_quantities_per_phase) {
            q[phase] = tsData.data.total_quantities_per_phase[phase].toString();
          }
          setTotalQuantities(q);
        }

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

  // --- Helper Functions ---
  const calculateTotalSimpleHours = (hoursState: SimpleHourState, entityId: string): number => {
    const m = hoursState[entityId];
    if (!m) return 0;
    return Object.values(m).reduce((t, v) => t + (parseFloat(v) || 0), 0);
  };

  const calculateTotalComplexHours = (hoursState: ComplexHourState, entityId: string): number => {
    const m = hoursState[entityId];
    if (!m) return 0;
    return Object.values(m).reduce((t, v) => {
      const reg = parseFloat(v?.REG || '0');
      const sb = parseFloat(v?.['S.B'] || '0');
      return t + (isNaN(reg) ? 0 : reg) + (isNaN(sb) ? 0 : sb);
    }, 0);
  };

  const renderTableBlock = (
    title: string,
    entities: any[],
    hoursState: SimpleHourState | ComplexHourState,
    ticketsState: SimpleHourState | undefined,
    type: 'employee' | 'equipment' | 'material' | 'vendor'
  ) => {
    if (!entities || entities.length === 0) return null;

    const isEmployee = type === 'employee';
    const isEquipment = type === 'equipment';
    const isSimple = type === 'material' || type === 'vendor';
    
    const phaseCodes = timesheet?.data.job.phase_codes || [];

    const calculateSimplePhaseTotals = (state: SimpleHourState, phaseCodes: string[]): Record<string, number> => {
        const totals: Record<string, number> = {};
        phaseCodes.forEach(p => { totals[p] = 0 });
        Object.values(state).forEach((perEntity) => {
          Object.entries(perEntity).forEach(([phase, value]) => {
            if (totals[phase] !== undefined) {
              totals[phase] += parseFloat(value) || 0;
            }
          });
        });
        return totals;
    };
    
    const calculateComplexPhaseTotals = (state: ComplexHourState, phaseCodes: string[]): Record<string, { reg: number, sb: number }> => {
        const totals: Record<string, { reg: number, sb: number }> = {};
        phaseCodes.forEach(p => { totals[p] = { reg: 0, sb: 0 } });
        Object.values(state).forEach((perEntity) => {
            Object.entries(perEntity).forEach(([phase, value]) => {
                if (totals[phase]) {
                    totals[phase].reg += parseFloat(value.REG || '0');
                    totals[phase].sb += parseFloat(value['S.B'] || '0');
                }
            });
        });
        return totals;
    };

    const simplePhaseTotals = !isEquipment ? calculateSimplePhaseTotals(hoursState as SimpleHourState, phaseCodes) : {};
    const complexPhaseTotals = isEquipment ? calculateComplexPhaseTotals(hoursState as ComplexHourState, phaseCodes) : {};

    return (
      <View style={styles.card}>
        <Text style={styles.tableTitle}>{title}</Text>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colName]}>Name</Text>
            {isEmployee && <Text style={[styles.headerCell, styles.colClass]}>Class</Text>}
            {isEquipment ? (
              <>
                <Text style={[styles.headerCell, styles.colHours]}>REG</Text>
                <Text style={[styles.headerCell, styles.colHours]}>S.B</Text>
              </>
            ) : (
              <Text style={[styles.headerCell, styles.colHours]}>Hours</Text>
            )}
            {isSimple && <Text style={[styles.headerCell, styles.colTickets]}># Tickets</Text>}
            <Text style={[styles.headerCell, styles.colTotal, styles.lastCell]}>Total</Text>
          </View>

          {/* Table Body */}
          {entities.map((entity, index) => {
            const entityName = entity.first_name
              ? `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim()
              : entity.name;
            
            const totalHours = isEquipment 
              ? calculateTotalComplexHours(hoursState as ComplexHourState, entity.id)
              : calculateTotalSimpleHours(hoursState as SimpleHourState, entity.id);

            return (
              <View key={entity.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlternate]}>
                <Text style={[styles.dataCell, styles.colName]}>{entityName}</Text>
                
                {isEmployee && <Text style={[styles.dataCell, styles.colClass]}>{entity.selected_class || 'N/A'}</Text>}
                
                {isEquipment ? (
                  <>
                    <Text style={[styles.dataCell, styles.colHours]}>
                      {parseFloat((hoursState as ComplexHourState)[entity.id]?.[selectedPhase!]?.REG ?? '0').toFixed(1)}
                    </Text>
                    <Text style={[styles.dataCell, styles.colHours]}>
                      {parseFloat((hoursState as ComplexHourState)[entity.id]?.[selectedPhase!]?.['S.B'] ?? '0').toFixed(1)}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.dataCell, styles.colHours]}>
                    {parseFloat((hoursState as SimpleHourState)[entity.id]?.[selectedPhase!] ?? '0').toFixed(1)}
                  </Text>
                )}

                {isSimple && (
                    <Text style={[styles.dataCell, styles.colTickets]}>
                        {ticketsState ? (ticketsState[entity.id]?.[selectedPhase!] ?? '0') : '0'}
                    </Text>
                )}

                <Text style={[styles.dataCell, styles.colTotal, styles.lastCell]}>{totalHours.toFixed(1)}</Text>
              </View>
            );
          })}
          
          {/* Vertical Totals Row */}
          {(isEmployee || isEquipment) && (
            <View style={[styles.tableRow, styles.phaseTotalRow]}>
              <Text style={[styles.dataCell, styles.colName, styles.phaseTotalText]}>Phase Total</Text>
              {isEmployee && <View style={[styles.dataCell, styles.colClass]} />}
              {isEquipment ? (
                <>
                  <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
                    {(complexPhaseTotals[selectedPhase!]?.reg || 0).toFixed(1)}
                  </Text>
                  <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
                    {(complexPhaseTotals[selectedPhase!]?.sb || 0).toFixed(1)}
                  </Text>
                </>
              ) : (
                <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
                  {(simplePhaseTotals[selectedPhase!] || 0).toFixed(1)}
                </Text>
              )}
              {isSimple && <View style={[styles.dataCell, styles.colTickets]} />}
              <View style={[styles.dataCell, styles.colTotal, styles.lastCell]} />
            </View>
          )}

        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found.</Text></View>;

  const { data, date } = timesheet;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ padding: THEME.SPACING, paddingBottom: 50 }}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.jobTitle}>{data.job_name}</Text>
          <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{new Date(date).toLocaleDateString()}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Foreman</Text><Text style={styles.infoValue}>{foremanName}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Day/Night</Text><Text style={styles.infoValue}>{data.time_of_day || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{data.location || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Weather</Text><Text style={styles.infoValue}>{data.weather || 'N/A'}</Text></View>
            <View style={styles.infoItemFull}><Text style={styles.infoLabel}>Temperature</Text><Text style={styles.infoValue}>{data.temperature || 'N/A'}</Text></View>
          </View>
        </View>

        {/* Phase Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelectorContainer}>
          {data.job.phase_codes.map((phase) => (
            <TouchableOpacity
              key={phase}
              style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]}
              onPress={() => setSelectedPhase(phase)}
            >
              <Text style={[styles.phaseButtonText, selectedPhase === phase && styles.selectedPhaseButtonText]}>{phase}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Data Tables */}
        {selectedPhase && (
          <View>
            {renderTableBlock('Employees', data.employees, employeeHours, undefined, 'employee')}
            {renderTableBlock('Equipment', data.equipment, equipmentHours, undefined, 'equipment')}
            {renderTableBlock('Materials and Trucking', data.materials, materialHours, materialTickets, 'material')}
            {renderTableBlock('Work Performed', data.vendors, vendorHours, vendorTickets, 'vendor')}
          </View>
        )}

        {/* Total Quantity */}
        {selectedPhase && totalQuantities[selectedPhase] && (
            <View style={styles.card}>
                <Text style={styles.tableTitle}>Total Quantity</Text>
                <View style={styles.quantityRow}>
                    <Text style={styles.quantityLabel}>Phase {selectedPhase}:</Text>
                    <View style={styles.totalBox}>
                        <Text style={styles.totalText}>{totalQuantities[selectedPhase]}</Text>
                    </View>
                </View>
            </View>
        )}

        {/* Notes */}
        {notes ? (
            <View style={styles.card}>
                <Text style={styles.tableTitle}>Notes</Text>
                <Text style={styles.notesText}>{notes}</Text>
            </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoCard: {
    padding: THEME.SPACING, backgroundColor: THEME.card, borderRadius: 14, marginBottom: THEME.SPACING,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
  },
  jobTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
  jobCode: { fontSize: 16, color: THEME.textSecondary, marginTop: 4 },
  infoGrid: { marginTop: THEME.SPACING, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { width: '48%', marginBottom: 12 },
  infoItemFull: { width: '100%', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '500', color: THEME.text },
  phaseSelectorContainer: { marginVertical: THEME.SPACING / 2 },
  phaseButton: {
    paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderRadius: 20,
    backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border,
  },
  selectedPhaseButton: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  phaseButtonText: { color: THEME.text },
  selectedPhaseButtonText: { color: '#FFF' },
  card: { padding: THEME.SPACING, backgroundColor: THEME.card, borderRadius: 14, marginBottom: THEME.SPACING },
  tableTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: THEME.text },
  tableContainer: { borderWidth: 1, borderColor: THEME.border, borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: THEME.tableHeaderBg, paddingVertical: 8 },
  headerCell: { fontWeight: 'bold', color: THEME.text, paddingHorizontal: 8, textAlign: 'center' },
  colName: { flex: 2, textAlign: 'left' },
  colClass: { flex: 1 },
  colHours: { flex: 1 },
  colTickets: { flex: 1 },
  colTotal: { flex: 1 },
  lastCell: { borderRightWidth: 0 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 2 },
  tableRowAlternate: { backgroundColor: THEME.rowAlternateBg },
  dataCell: { paddingHorizontal: 8, textAlign: 'center', color: THEME.text },
  phaseTotalRow: { backgroundColor: THEME.tableHeaderBg },
  phaseTotalText: { fontWeight: 'bold' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  quantityLabel: { fontSize: 16, flex: 1 },
  totalBox: { padding: 8, backgroundColor: THEME.primary, borderRadius: 6 },
  totalText: { color: '#FFF', fontWeight: 'bold' },
  notesText: { fontSize: 16, color: THEME.text, marginTop: 6 },
});

export default PETimesheetReviewScreen;
