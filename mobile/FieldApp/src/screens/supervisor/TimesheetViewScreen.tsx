
// // // export default TimesheetReviewScreen;
// // // export default TimesheetReviewScreen;
// // import React, { useEffect, useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   ScrollView,
// //   ActivityIndicator,
// //   SafeAreaView,
// //   TouchableOpacity,
// //   Alert,
// // } from 'react-native';
// // import { RouteProp, useRoute } from '@react-navigation/native';
// // import apiClient from '../../api/apiClient';
// // import type { SupervisorStackParamList } from '../../navigation/AppNavigator';
// // import type { Timesheet } from '../../types';

// // // Define state types consistent with TimesheetEditScreen
// // type SimpleHourState = Record<string, Record<string, string>>;
// // type ComplexHourSubState = { REG?: string; 'S.B'?: string };
// // type ComplexHourState = Record<string, Record<string, ComplexHourSubState>>;
// // type QuantityState = Record<string, string>;

// // type ReviewRouteProp = RouteProp<SupervisorStackParamList, 'TimesheetReview'>;

// // // Centralized theme for styling
// // const THEME = {
// //   primary: '#007AFF',
// //   background: '#F0F0F7',
// //   card: '#FFFFFF',
// //   text: '#1C1C1E',
// //   textSecondary: '#6A6A6A',
// //   border: '#E0E0E5',
// //   tableHeaderBg: '#F8F8F8',
// //   rowAlternateBg: '#FCFCFC',
// //   SPACING: 16,
// // };

// // const TimesheetReviewScreen = () => {
// //   const route = useRoute<ReviewRouteProp>();
// //   const { timesheetId } = route.params;

// //   const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
// //   const [foremanName, setForemanName] = useState<string>('');
// //   const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
// //   const [loading, setLoading] = useState(true);

// //   // States to hold processed data for display
// //   const [employeeHours, setEmployeeHours] = useState<SimpleHourState>({});
// //   const [equipmentHours, setEquipmentHours] = useState<ComplexHourState>({});
// //   const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
// //   const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
// //   const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});
// //   const [notes, setNotes] = useState<string>('');

// //   useEffect(() => {
// //     const fetchData = async () => {
// //       try {
// //         const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
// //         const tsData = response.data;
// //         setTimesheet(tsData);

// //         if (tsData.data.job.phase_codes?.length > 0) {
// //           setSelectedPhase(tsData.data.job.phase_codes[0]);
// //         }
        
// //         setNotes(tsData.data.notes || '');

// //         // --- Data Population Functions ---
// //         const populateEmployeesSimpleFlexible = (entities: any[] = []): SimpleHourState => {
// //           const state: SimpleHourState = {};
// //           entities.forEach((e) => {
// //             state[e.id] = {};
// //             if (e.hours_per_phase) {
// //               for (const phase in e.hours_per_phase) {
// //                 const v = e.hours_per_phase[phase];
// //                 if (v && typeof v === 'object') {
// //                   const reg = parseFloat(v.REG || '0');
// //                   const sb = parseFloat(v['S.B'] || '0');
// //                   state[e.id][phase] = (reg + sb).toString();
// //                 } else {
// //                   state[e.id][phase] = (v ?? '').toString();
// //                 }
// //               }
// //             }
// //           });
// //           return state;
// //         };

// //         const populateEquipmentComplex = (entities: any[] = []): ComplexHourState => {
// //           const state: ComplexHourState = {};
// //           entities.forEach((e) => {
// //             state[e.id] = {};
// //             if (e.hours_per_phase) {
// //               for (const phase in e.hours_per_phase) {
// //                 const v = e.hours_per_phase[phase];
// //                 if (v && typeof v === 'object') {
// //                   state[e.id][phase] = {
// //                     REG: v.REG?.toString() || '0',
// //                     'S.B': v['S.B']?.toString() || '0',
// //                   };
// //                 } else {
// //                   const num = parseFloat((v ?? '0').toString());
// //                   state[e.id][phase] = { REG: !isNaN(num) ? num.toString() : '0', 'S.B': '0' };
// //                 }
// //               }
// //             }
// //           });
// //           return state;
// //         };

// //         const populateSimple = (entities: any[] = []): SimpleHourState => {
// //             const state: SimpleHourState = {};
// //             entities.forEach((e) => {
// //                 state[e.id] = {};
// //                 if (e.hours_per_phase) {
// //                     for (const phase in e.hours_per_phase) {
// //                         state[e.id][phase] = String(e.hours_per_phase[phase] || '0');
// //                     }
// //                 }
// //             });
// //             return state;
// //         };

// //         setEmployeeHours(populateEmployeesSimpleFlexible(tsData.data.employees));
// //         setEquipmentHours(populateEquipmentComplex(tsData.data.equipment));
// //         setMaterialHours(populateSimple(tsData.data.materials));
// //         setVendorHours(populateSimple(tsData.data.vendors));

// //         if (tsData.data.total_quantities_per_phase) {
// //           const q: QuantityState = {};
// //           for (const phase in tsData.data.total_quantities_per_phase) {
// //             q[phase] = tsData.data.total_quantities_per_phase[phase].toString();
// //           }
// //           setTotalQuantities(q);
// //         }

// //         const userRes = await apiClient.get(`/api/users/${tsData.foreman_id}`);
// //         setForemanName(`${userRes.data.first_name} ${userRes.data.last_name}`.trim());

// //       } catch (error) {
// //         console.error('Failed to load timesheet:', error);
// //         Alert.alert('Error', 'Failed to load timesheet data.');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchData();
// //   }, [timesheetId]);

// //   // --- Calculation Functions ---
// //   const calculateTotalSimpleHours = (hoursState: SimpleHourState, entityId: string): number => {
// //     const m = hoursState[entityId];
// //     if (!m) return 0;
// //     return Object.values(m).reduce((t, v) => t + (parseFloat(v) || 0), 0);
// //   };

// //   const calculateTotalComplexHours = (hoursState: ComplexHourState, entityId: string): number => {
// //     const m = hoursState[entityId];
// //     if (!m) return 0;
// //     return Object.values(m).reduce((t, v) => {
// //       const reg = parseFloat(v?.REG || '0');
// //       const sb = parseFloat(v?.['S.B'] || '0');
// //       return t + (isNaN(reg) ? 0 : reg) + (isNaN(sb) ? 0 : sb);
// //     }, 0);
// //   };

// //   // --- Render Functions (UPDATED) ---
// //   const renderTableBlock = (
// //     title: string,
// //     entities: any[],
// //     hoursState: SimpleHourState | ComplexHourState,
// //     type: 'employee' | 'equipment' | 'material' | 'vendor'
// //   ) => {
// //     if (!entities || entities.length === 0) return null;

// //     const isEmployee = type === 'employee';
// //     const isEquipment = type === 'equipment';

// //     return (
// //       <View style={styles.card}>
// //         <Text style={styles.tableTitle}>{title}</Text>
// //         <View style={styles.tableContainer}>
// //           {/* Table Header */}
// //           <View style={styles.tableHeader}>
// //             <Text style={[styles.headerCell, isEmployee || isEquipment ? styles.colName : styles.colNameWide]}>Name</Text>
// //             {isEmployee && <Text style={[styles.headerCell, styles.colClass]}>Class</Text>}
// //             {isEquipment ? (
// //               <>
// //                 <Text style={[styles.headerCell, styles.colHours]}>REG</Text>
// //                 <Text style={[styles.headerCell, styles.colHours]}>S.B</Text>
// //               </>
// //             ) : (
// //               <Text style={[styles.headerCell, styles.colHours]}>Hours</Text>
// //             )}
// //             <Text style={[styles.headerCell, styles.colTotal, styles.lastCell]}>Total</Text>
// //           </View>

// //           {/* Table Body */}
// //           {entities.map((entity, index) => {
// //             const entityName = entity.first_name
// //               ? `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim()
// //               : entity.name;
            
// //             // Calculate total hours based on type
// //             const totalHours = isEquipment 
// //               ? calculateTotalComplexHours(hoursState as ComplexHourState, entity.id)
// //               : calculateTotalSimpleHours(hoursState as SimpleHourState, entity.id);

// //             return (
// //               <View key={entity.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlternate]}>
// //                 <Text style={[styles.dataCell, isEmployee || isEquipment ? styles.colName : styles.colNameWide]}>{entityName}</Text>
                
// //                 {isEmployee && <Text style={[styles.dataCell, styles.colClass]}>{entity.selected_class || 'N/A'}</Text>}
                
// //                 {isEquipment ? (
// //                   <>
// //                     <Text style={[styles.dataCell, styles.colHours]}>
// //                       {parseFloat((hoursState as ComplexHourState)[entity.id]?.[selectedPhase!]?.REG ?? '0').toFixed(1)}
// //                     </Text>
// //                     <Text style={[styles.dataCell, styles.colHours]}>
// //                       {parseFloat((hoursState as ComplexHourState)[entity.id]?.[selectedPhase!]?.['S.B'] ?? '0').toFixed(1)}
// //                     </Text>
// //                   </>
// //                 ) : (
// //                   <Text style={[styles.dataCell, styles.colHours]}>
// //                     {parseFloat((hoursState as SimpleHourState)[entity.id]?.[selectedPhase!] ?? '0').toFixed(1)}
// //                   </Text>
// //                 )}

// //                 <Text style={[styles.dataCell, styles.colTotal, styles.lastCell]}>{totalHours.toFixed(1)}</Text>
// //               </View>
// //             );
// //           })}
// //         </View>
// //       </View>
// //     );
// //   };

// //   if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
// //   if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found.</Text></View>;

// //   const { data, date } = timesheet;

// //   return (
// //     <SafeAreaView style={styles.safeArea}>
// //       <ScrollView contentContainerStyle={{ padding: THEME.SPACING, paddingBottom: 50 }}>
// //         {/* Info Card */}
// //         <View style={styles.infoCard}>
// //           <Text style={styles.jobTitle}>{data.job_name}</Text>
// //           <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
// //           <View style={styles.infoGrid}>
// //             <View style={styles.infoItem}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{new Date(date).toLocaleDateString()}</Text></View>
// //             <View style={styles.infoItem}><Text style={styles.infoLabel}>Foreman</Text><Text style={styles.infoValue}>{foremanName}</Text></View>
// //             <View style={styles.infoItem}><Text style={styles.infoLabel}>Project Engineer</Text><Text style={styles.infoValue}>{data.project_engineer || 'N/A'}</Text></View>
// //             <View style={styles.infoItem}><Text style={styles.infoLabel}>Day/Night</Text><Text style={styles.infoValue}>{data.time_of_day || 'N/A'}</Text></View>
// //             <View style={styles.infoItem}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{data.location || 'N/A'}</Text></View>
// //             <View style={styles.infoItem}><Text style={styles.infoLabel}>Weather</Text><Text style={styles.infoValue}>{data.weather || 'N/A'}</Text></View>
// //             <View style={styles.infoItemFull}><Text style={styles.infoLabel}>Temperature</Text><Text style={styles.infoValue}>{data.temperature || 'N/A'}</Text></View>
// //           </View>
// //         </View>

// //         {/* Phase Selector */}
// //         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelectorContainer}>
// //           {data.job.phase_codes.map((phase) => (
// //             <TouchableOpacity
// //               key={phase}
// //               style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]}
// //               onPress={() => setSelectedPhase(phase)}
// //             >
// //               <Text style={[styles.phaseButtonText, selectedPhase === phase && styles.selectedPhaseButtonText]}>{phase}</Text>
// //             </TouchableOpacity>
// //           ))}
// //         </ScrollView>

// //         {/* Data Tables */}
// //         {selectedPhase && (
// //           <View>
// //             {renderTableBlock('Employees', data.employees, employeeHours, 'employee')}
// //             {renderTableBlock('Equipment', data.equipment, equipmentHours, 'equipment')}
// //             {renderTableBlock('Materials', data.materials, materialHours, 'material')}
// //             {renderTableBlock('Vendors', data.vendors, vendorHours, 'vendor')}
// //           </View>
// //         )}

// //         {/* Total Quantity */}
// //         {selectedPhase && totalQuantities[selectedPhase] && (
// //             <View style={styles.card}>
// //                 <Text style={styles.tableTitle}>Total Quantity</Text>
// //                 <View style={styles.quantityRow}>
// //                     <Text style={styles.quantityLabel}>Phase {selectedPhase}:</Text>
// //                     <View style={styles.totalBox}>
// //                         <Text style={styles.totalText}>{totalQuantities[selectedPhase]}</Text>
// //                     </View>
// //                 </View>
// //             </View>
// //         )}

// //         {/* Notes */}
// //         {notes ? (
// //             <View style={styles.card}>
// //                 <Text style={styles.tableTitle}>Notes</Text>
// //                 <Text style={styles.notesText}>{notes}</Text>
// //             </View>
// //         ) : null}
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // };

// // // --- Styles ---
// // const styles = StyleSheet.create({
// //   safeArea: { flex: 1, backgroundColor: THEME.background },
// //   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
// //   infoCard: {
// //     padding: THEME.SPACING, backgroundColor: THEME.card, borderRadius: 14, marginBottom: THEME.SPACING,
// //     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
// //   },
// //   jobTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
// //   jobCode: { fontSize: 16, color: THEME.textSecondary, marginTop: 4 },
// //   infoGrid: { marginTop: THEME.SPACING, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
// //   infoItem: { width: '48%', marginBottom: 12 },
// //   infoItemFull: { width: '100%', marginBottom: 12 },
// //   infoLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
// //   infoValue: { fontSize: 16, fontWeight: '500', color: THEME.text },
// //   phaseSelectorContainer: { marginVertical: THEME.SPACING / 2 },
// //   phaseButton: {
// //     paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderRadius: 20,
// //     backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border,
// //   },
// //   selectedPhaseButton: { backgroundColor: THEME.primary, borderColor: THEME.primary },
// //   phaseButtonText: { color: THEME.text, fontWeight: '600', fontSize: 16 },
// //   selectedPhaseButtonText: { color: '#FFF' },
// //   card: {
// //     backgroundColor: THEME.card, borderRadius: 14, padding: THEME.SPACING, marginBottom: THEME.SPACING,
// //     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
// //   },
// //   tableTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 12 },
// //   tableContainer: { borderWidth: 1, borderColor: THEME.border, borderRadius: 8, overflow: 'hidden' },
// //   tableHeader: { flexDirection: 'row', backgroundColor: THEME.tableHeaderBg },
// //   tableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: THEME.border },
// //   tableRowAlternate: { backgroundColor: THEME.rowAlternateBg },
// //   headerCell: {
// //     paddingVertical: 12, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: THEME.border,
// //     fontSize: 14, fontWeight: '600', color: THEME.textSecondary, textAlign: 'center',
// //   },
// //   dataCell: {
// //     paddingVertical: 12, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: THEME.border,
// //     fontSize: 15, color: THEME.text,
// //   },
// //   lastCell: { borderRightWidth: 0 },
// //   colName: { flex: 3, textAlign: 'left', paddingLeft: 10 },
// //   colNameWide: { flex: 5, textAlign: 'left', paddingLeft: 10 },
// //   colClass: { flex: 2.5, textAlign: 'center' },
// //   colHours: { flex: 1.5, textAlign: 'center' },
// //   colTotal: { flex: 1.8, textAlign: 'center', fontWeight: '600' },
// //   quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
// //   quantityLabel: { fontSize: 16, fontWeight: '500', color: THEME.text },
// //   totalBox: {
// //     backgroundColor: THEME.background, borderRadius: 10, minWidth: 80, paddingVertical: 10, paddingHorizontal: 16,
// //     justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.border,
// //   },
// //   totalText: { fontSize: 16, fontWeight: 'bold', color: THEME.text },
// //   notesText: { fontSize: 16, color: THEME.text, lineHeight: 24 },
// // });

// // export default TimesheetReviewScreen;


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
// import type { Timesheet } from '../../types';

// // --- Type Definitions ---
// type SimpleHourState = Record<string, Record<string, string>>;
// type ComplexHourSubState = { REG?: string; 'S.B'?: string };
// type ComplexHourState = Record<string, Record<string, ComplexHourSubState>>;
// type QuantityState = Record<string, string>;

// type ReviewRouteProp = RouteProp<SupervisorStackParamList, 'TimesheetReview'>;

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

// const TimesheetReviewScreen = () => {
//   const route = useRoute<ReviewRouteProp>();
//   const { timesheetId } = route.params;

//   const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
//   const [foremanName, setForemanName] = useState<string>('');
//   const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   // States to hold processed data for display
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

//     const isEmployee = type === 'employee';
//     const isEquipment = type === 'equipment';
//     const isSimple = type === 'material' || type === 'vendor';
    
//     const phaseCodes = timesheet?.data.job.phase_codes || [];

//     const calculateSimplePhaseTotals = (state: SimpleHourState, phaseCodes: string[]): Record<string, number> => {
//         const totals: Record<string, number> = {};
//         phaseCodes.forEach(p => { totals[p] = 0 });
//         Object.values(state).forEach((perEntity) => {
//           Object.entries(perEntity).forEach(([phase, value]) => {
//             if (totals[phase] !== undefined) {
//               totals[phase] += parseFloat(value) || 0;
//             }
//           });
//         });
//         return totals;
//     };
    
//     const calculateComplexPhaseTotals = (state: ComplexHourState, phaseCodes: string[]): Record<string, { reg: number, sb: number }> => {
//         const totals: Record<string, { reg: number, sb: number }> = {};
//         phaseCodes.forEach(p => { totals[p] = { reg: 0, sb: 0 } });
//         Object.values(state).forEach((perEntity) => {
//             Object.entries(perEntity).forEach(([phase, value]) => {
//                 if (totals[phase]) {
//                     totals[phase].reg += parseFloat(value.REG || '0');
//                     totals[phase].sb += parseFloat(value['S.B'] || '0');
//                 }
//             });
//         });
//         return totals;
//     };

//     const simplePhaseTotals = !isEquipment ? calculateSimplePhaseTotals(hoursState as SimpleHourState, phaseCodes) : {};
//     const complexPhaseTotals = isEquipment ? calculateComplexPhaseTotals(hoursState as ComplexHourState, phaseCodes) : {};

//     return (
//       <View style={styles.card}>
//         <Text style={styles.tableTitle}>{title}</Text>
//         <View style={styles.tableContainer}>
//           {/* Table Header */}
//           <View style={styles.tableHeader}>
//             <Text style={[styles.headerCell, styles.colName]}>Name</Text>
//             {isEmployee && <Text style={[styles.headerCell, styles.colClass]}>Class</Text>}
//             {isEquipment ? (
//               <>
//                 <Text style={[styles.headerCell, styles.colHours]}>REG</Text>
//                 <Text style={[styles.headerCell, styles.colHours]}>S.B</Text>
//               </>
//             ) : (
//               <Text style={[styles.headerCell, styles.colHours]}>Hours</Text>
//             )}
//             {isSimple && <Text style={[styles.headerCell, styles.colTickets]}># Tickets</Text>}
//             <Text style={[styles.headerCell, styles.colTotal, styles.lastCell]}>Total</Text>
//           </View>

//           {/* Table Body */}
//           {entities.map((entity, index) => {
//             const entityName = entity.first_name
//               ? `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim()
//               : entity.name;
            
//             const totalHours = isEquipment 
//               ? calculateTotalComplexHours(hoursState as ComplexHourState, entity.id)
//               : calculateTotalSimpleHours(hoursState as SimpleHourState, entity.id);

//             return (
//               <View key={entity.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlternate]}>
//                 <Text style={[styles.dataCell, styles.colName]}>{entityName}</Text>
                
//                 {isEmployee && <Text style={[styles.dataCell, styles.colClass]}>{entity.selected_class || 'N/A'}</Text>}
                
//                 {isEquipment ? (
//                   <>
//                     <Text style={[styles.dataCell, styles.colHours]}>
//                       {parseFloat((hoursState as ComplexHourState)[entity.id]?.[selectedPhase!]?.REG ?? '0').toFixed(1)}
//                     </Text>
//                     <Text style={[styles.dataCell, styles.colHours]}>
//                       {parseFloat((hoursState as ComplexHourState)[entity.id]?.[selectedPhase!]?.['S.B'] ?? '0').toFixed(1)}
//                     </Text>
//                   </>
//                 ) : (
//                   <Text style={[styles.dataCell, styles.colHours]}>
//                     {parseFloat((hoursState as SimpleHourState)[entity.id]?.[selectedPhase!] ?? '0').toFixed(1)}
//                   </Text>
//                 )}

//                 {isSimple && (
//                     <Text style={[styles.dataCell, styles.colTickets]}>
//                         {ticketsState ? (ticketsState[entity.id]?.[selectedPhase!] ?? '0') : '0'}
//                     </Text>
//                 )}

//                 <Text style={[styles.dataCell, styles.colTotal, styles.lastCell]}>{totalHours.toFixed(1)}</Text>
//               </View>
//             );
//           })}
          
//           {/* Vertical Totals Row */}
//           {(isEmployee || isEquipment) && (
//             <View style={[styles.tableRow, styles.phaseTotalRow]}>
//               <Text style={[styles.dataCell, styles.colName, styles.phaseTotalText]}>Phase Total</Text>
//               {isEmployee && <View style={[styles.dataCell, styles.colClass]} />}
//               {isEquipment ? (
//                 <>
//                   <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
//                     {(complexPhaseTotals[selectedPhase!]?.reg || 0).toFixed(1)}
//                   </Text>
//                   <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
//                     {(complexPhaseTotals[selectedPhase!]?.sb || 0).toFixed(1)}
//                   </Text>
//                 </>
//               ) : (
//                 <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
//                   {(simplePhaseTotals[selectedPhase!] || 0).toFixed(1)}
//                 </Text>
//               )}
//               {isSimple && <View style={[styles.dataCell, styles.colTickets]} />}
//               <View style={[styles.dataCell, styles.colTotal, styles.lastCell]} />
//             </View>
//           )}

//         </View>
//       </View>
//     );
//   };

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
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Project Engineer</Text><Text style={styles.infoValue}>{data.project_engineer || 'N/A'}</Text></View>
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

// // --- Styles ---
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

// --- Type Definitions ---
type SimpleHourState = Record<string, Record<string, string>>;
// EmployeeHourState is complex: { empId: { phaseCode: { classCode: '5' } } }
type EmployeeHourState = Record<string, Record<string, Record<string, string>>>;
type ComplexHourSubState = { REG?: string; 'S.B'?: string };
// ComplexHourState is for Equipment: { equipmentId: { phaseCode: { REG: '5', 'S.B': '1' } } }
type ComplexHourState = Record<string, Record<string, ComplexHourSubState>>;
type QuantityState = Record<string, string>;
type UnitState = Record<string, string | null>;
type ReviewRouteProp = RouteProp<SupervisorStackParamList, 'TimesheetReview'>;

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

const TimesheetReviewScreen = () => {
    const route = useRoute<ReviewRouteProp>();
    const { timesheetId } = route.params;

    const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
    const [foremanName, setForemanName] = useState<string>('');
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // States to hold processed data for display
    const [employeeHours, setEmployeeHours] = useState<EmployeeHourState>({});
    const [equipmentHours, setEquipmentHours] = useState<ComplexHourState>({});
    const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
    const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
    const [materialTickets, setMaterialTickets] = useState<SimpleHourState>({});
    const [vendorTickets, setVendorTickets] = useState<SimpleHourState>({});
    const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});
    const [notes, setNotes] = useState<string>('');
    const [materialUnits, setMaterialUnits] = useState<UnitState>({});
    const [vendorUnits, setVendorUnits] = useState<UnitState>({});

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

                const populateUnits = (entities: any[] = []): UnitState => {
                    const state: UnitState = {};
                    entities.forEach(e => {
                        state[e.id] = e.unit || null;
                    });
                    return state;
                };

                const populateEmployeeComplex = (entities: any[] = []): EmployeeHourState => {
                    const state: EmployeeHourState = {};
                    entities.forEach((e) => {
                        state[e.id] = {};
                        if (e.hours_per_phase) {
                            for (const phase in e.hours_per_phase) {
                                state[e.id][phase] = {};
                                const phaseHours = e.hours_per_phase[phase];

                                if (phaseHours && typeof phaseHours === 'object') {
                                    // New Timesheet format: { '122': 4, '133': 4 }
                                    for (const classCode in phaseHours) {
                                        state[e.id][phase][classCode] = String(phaseHours[classCode] || '0');
                                    }
                                } else {
                                    // Old Timesheet format: Simple hours value, assign to class_1 if available
                                    if (e.class_1) {
                                        state[e.id][phase][e.class_1] = String(phaseHours || '0');
                                    }
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

                setEmployeeHours(populateEmployeeComplex(tsData.data.employees));
                setEquipmentHours(populateEquipmentComplex(tsData.data.equipment));
                setMaterialHours(populateSimple(tsData.data.materials, 'hours_per_phase'));
                setVendorHours(populateSimple(tsData.data.vendors, 'hours_per_phase'));
                setMaterialTickets(populateSimple(tsData.data.materials, 'tickets_per_phase'));
                setVendorTickets(populateSimple(tsData.data.vendors, 'tickets_per_phase'));
                setMaterialUnits(populateUnits(tsData.data.materials || []));
                setVendorUnits(populateUnits(tsData.data.vendors || []));

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

    // --- Calculation Functions ---

    const calculateTotalSimpleHours = (hoursState: SimpleHourState, entityId: string): number => {
        const m = hoursState[entityId];
        if (!m) return 0;
        return Object.values(m).reduce((t, v) => t + (parseFloat(v) || 0), 0);
    };

    const calculateTotalEmployeeHours = (hoursState: EmployeeHourState, entityId: string): number => {
        const m = hoursState[entityId];
        if (!m) return 0;
        return Object.values(m).reduce((phaseTotal, classHours) => {
            return phaseTotal + Object.values(classHours).reduce((classTotal, hoursStr) => {
                return classTotal + (parseFloat(hoursStr) || 0);
            }, 0);
        }, 0);
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
    
    // ComplexPhaseTotals (for Equipment)
    const calculateComplexPhaseTotals = (state: ComplexHourState, phaseCodes: string[]): Record<string, { REG: number, 'S.B': number }> => {
        const totals: Record<string, { REG: number, 'S.B': number }> = {};
        phaseCodes.forEach(p => { totals[p] = { REG: 0, 'S.B': 0 } });
        Object.values(state).forEach((perEntity) => {
            Object.entries(perEntity).forEach(([phase, value]) => {
                if (totals[phase]) {
                    totals[phase].REG += parseFloat(value.REG || '0');
                    totals[phase]['S.B'] += parseFloat(value['S.B'] || '0');
                }
            });
        });
        return totals;
    };

    // Employee Phase Total
    const calculateEmployeePhaseTotal = (state: EmployeeHourState, phase: string): number => {
        let total = 0;
        Object.values(state).forEach((perEntity) => {
            const phaseData = perEntity[phase];
            if (phaseData) {
                Object.values(phaseData).forEach((hoursStr) => {
                    total += parseFloat(hoursStr) || 0;
                });
            }
        });
        return total;
    };

    // --- Table Renderer Component ---

    const renderTableBlock = (
        title: string,
        entities: any[],
        hoursState: SimpleHourState | ComplexHourState | EmployeeHourState,
        ticketsState: SimpleHourState | undefined,
        type: 'employee' | 'equipment' | 'material' | 'vendor',
        unitState: UnitState | undefined,
    ) => {
        if (!entities || entities.length === 0 || !selectedPhase) return null;

        const isEmployee = type === 'employee';
        const isEquipment = type === 'equipment';
        const isMaterial = type === 'material';
        const isSimple = isMaterial || type === 'vendor';
        const phaseCodes = timesheet?.data.job.phase_codes || [];

        // Calculate phase totals for the footer within the component scope
        let phaseTotalHours = 0;
        let equipmentPhaseTotals: Record<string, { REG: number, 'S.B': number }> = {};
        let simplePhaseTotals: Record<string, number> = {};

        if (isEmployee) {
            phaseTotalHours = calculateEmployeePhaseTotal(hoursState as EmployeeHourState, selectedPhase);
        } else if (isEquipment) {
            equipmentPhaseTotals = calculateComplexPhaseTotals(hoursState as ComplexHourState, phaseCodes);
            phaseTotalHours = equipmentPhaseTotals[selectedPhase!]?.REG + equipmentPhaseTotals[selectedPhase!]?.['S.B'] || 0;
        } else if (isSimple) {
            simplePhaseTotals = calculateSimplePhaseTotals(hoursState as SimpleHourState, phaseCodes);
            phaseTotalHours = simplePhaseTotals[selectedPhase!] || 0;
        }


        return (
            <View style={styles.card}>
                <Text style={styles.tableTitle}>{title}</Text>
                <View style={styles.tableContainer}>
                    
                    {/* -------------------- TABLE HEADER START -------------------- */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.colName]}>Name</Text>
                        
                        {isEmployee && (
                            <>
                                <Text style={[styles.headerCell, styles.colClassCode]}>Class Code</Text>
                                <Text style={[styles.headerCell, styles.colHours]}>Hours</Text>
                            </>
                        )}
                        
                        {isEquipment ? (
                            <>
                                <Text style={[styles.headerCell, styles.colHours]}>REG</Text>
                                <Text style={[styles.headerCell, styles.colHours]}>S.B</Text>
                            </>
                        ) : (
                            (!isEmployee && !isEquipment) && (
                                <Text style={[styles.headerCell, styles.colHours]}>
                                    {/* Header for Materials/Vendors - consistent name for column */}
                                    {isMaterial ? 'Hours/Qty' : 'Quantity'} 
                                </Text>
                            )
                        )}
                        
                        {isSimple && <Text style={[styles.headerCell, styles.colTickets]}># of Tickets</Text>}
                        
                        <Text style={[styles.headerCell, styles.colTotal, styles.lastCell]}>Total</Text>
                    </View>
                    {/* -------------------- TABLE HEADER END -------------------- */}


                    {/* -------------------- TABLE BODY START -------------------- */}
                    {isEmployee ? (
                        entities.flatMap((entity, index) => {
                            const rows: React.ReactNode[] = []; 
                            
                            const employeePhaseHours = (hoursState as EmployeeHourState)[entity.id]?.[selectedPhase!];
                            const totalHours = calculateTotalEmployeeHours(hoursState as EmployeeHourState, entity.id);

                            const class1Code = entity.class_1 || 'N/A';
                            const class2Code = entity.class_2 || null;

                            const class1Hours = parseFloat(employeePhaseHours?.[class1Code] || '0');
                            const class2Hours = parseFloat(class2Code ? employeePhaseHours?.[class2Code] || '0' : '0');

                            const entityName = `${entity.first_name} ${entity.last_name}`.trim();

                            const activeClasses = [];
                            if (class1Hours > 0) activeClasses.push({ code: class1Code, hours: class1Hours });
                            if (class2Code && class2Hours > 0) activeClasses.push({ code: class2Code, hours: class2Hours });

                            const needsSpanning = activeClasses.length > 1;
                            const hasAnyHours = activeClasses.length > 0;

                            // --- 1. Generate Rows for Active Classes ---
                            if (hasAnyHours) {
                                activeClasses.forEach((classData, classIndex) => {
                                    const isFirstClassRow = classIndex === 0;

                                    const borderStyle = isFirstClassRow && needsSpanning ? styles.noBottomBorder : {};
                                    
                                    rows.push(
                                        <View key={`${entity.id}-${classIndex + 1}`} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlternate]}>
                                            
                                            {isFirstClassRow ? (
                                                <Text 
                                                    style={[styles.dataCell, styles.colName, borderStyle]} 
                                                    numberOfLines={2}
                                                >
                                                    {entityName}
                                                </Text>
                                            ) : (
                                                <View style={[styles.dataCell, styles.colName]} />
                                            )}
                                            
                                            <Text style={[styles.dataCell, styles.colClassCode]}>{classData.code}</Text>
                                            <Text style={[styles.dataCell, styles.colHours]}>{classData.hours.toFixed(1)}</Text>
                                            
                                            {isFirstClassRow ? (
                                                <Text 
                                                    style={[styles.dataCell, styles.colTotal, styles.lastCell, borderStyle]}
                                                >
                                                    {totalHours.toFixed(1)}
                                                </Text>
                                            ) : (
                                                <View style={[styles.dataCell, styles.colTotal, styles.lastCell]} />
                                            )}
                                        </View>
                                    );
                                });
                            }
                            
                            // --- 2. Fallback Row (If employee has 0 hours total) ---
                            if (!hasAnyHours) {
                                const displayCode = class1Code || 'N/A';
                                const displayHours = 0; 
                                
                                rows.push(
                                    <View key={`${entity.id}-0`} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlternate]}>
                                        <Text style={[styles.dataCell, styles.colName]}>{entityName}</Text>
                                        <Text style={[styles.dataCell, styles.colClassCode]}>{displayCode}</Text>
                                        <Text style={[styles.dataCell, styles.colHours]}>{displayHours.toFixed(1)}</Text>
                                        <Text style={[styles.dataCell, styles.colTotal, styles.lastCell]}>{totalHours.toFixed(1)}</Text>
                                    </View>
                                );
                            }

                            return rows;
                        })
                    ) : (
                    // --- LOGIC FOR EQUIPMENT/MATERIAL/VENDOR ---
                        entities.map((entity, index) => {
                            const entityName = entity.first_name
                                ? `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim()
                                : entity.name;
                            
                            const totalHours = isEquipment 
                                ? calculateTotalComplexHours(hoursState as ComplexHourState, entity.id)
                                : calculateTotalSimpleHours(hoursState as SimpleHourState, entity.id);

                            return (
                                <View key={entity.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlternate]}>
                                    <Text style={[styles.dataCell, styles.colName]}>{entityName}</Text>
                                    
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
                                        // Simple Logic (Material/Vendor) - COMBINING UNIT AND HOURS
                                        (() => {
                                            const hoursValue = parseFloat((hoursState as SimpleHourState)[entity.id]?.[selectedPhase!] ?? '0').toFixed(1);
                                            const unitValue = unitState?.[entity.id] || '';
                                            
                                            // 🌟 CORRECTED LOGIC: Include unit if unitValue exists for BOTH Materials and Vendors
                                            const displayValue = unitValue ? `${hoursValue} ${unitValue}` : hoursValue;

                                            return (
                                                <Text style={[styles.dataCell, styles.colHours]}>
                                                    {displayValue}
                                                </Text>
                                            );
                                        })()
                                    )}
                                    
                                    {isSimple && (
                                        <>
                                            <Text style={[styles.dataCell, styles.colTickets]}>
                                                {ticketsState ? (ticketsState[entity.id]?.[selectedPhase!] ?? '0') : '0'}
                                            </Text>
                                        </>
                                    )}
                                    <Text style={[styles.dataCell, styles.colTotal, styles.lastCell]}>{totalHours.toFixed(1)}</Text>
                                </View>
                            );
                        })
                    )}
                    {/* -------------------- TABLE BODY END -------------------- */}

                    {/* -------------------- VERTICAL TOTALS ROW -------------------- */}
                    {selectedPhase && (isEmployee || isEquipment || isSimple) && (
                        <View style={[styles.tableRow, styles.phaseTotalRow]}>
                            <Text style={[styles.dataCell, styles.colName, styles.phaseTotalText]}>Phase Total</Text>
                            
                            {isEmployee && (
                                <Text
                                    style={[
                                        styles.dataCell,
                                        styles.phaseTotalText,
                                        { flex: 3, textAlign: 'center' } 
                                    ]}
                                >
                                    {phaseTotalHours.toFixed(1)}
                                </Text>
                            )}
                            
                            {isEquipment ? (
                                <>
                                    <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
                                        {(equipmentPhaseTotals[selectedPhase!]?.REG || 0).toFixed(1)}
                                    </Text>
                                    <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
                                        {(equipmentPhaseTotals[selectedPhase!]?.['S.B'] || 0).toFixed(1)}
                                    </Text>
                                </>
                            ) : (isSimple &&
                                <Text style={[styles.dataCell, styles.colHours, styles.phaseTotalText]}>
                                    {(simplePhaseTotals[selectedPhase!] || 0).toFixed(1)}
                                </Text>
                            )}
                            
                            {isSimple && (
                                <>
                                    {/* Placeholder for Tickets column */}
                                    <View style={[styles.dataCell, styles.colTickets]} /> 
                                </>
                            )}
                            
                            {/* Final empty cell under the Total column */}
                            <View style={[styles.dataCell, styles.colTotal, styles.lastCell]} />
                        </View>
                    )}
                    {/* -------------------- VERTICAL TOTALS ROW END -------------------- */}

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
                        <View style={styles.infoItem}><Text style={styles.infoLabel}>Project Engineer</Text><Text style={styles.infoValue}>{data.project_engineer || 'N/A'}</Text></View>
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
                        {renderTableBlock('Employees', data.employees, employeeHours, undefined, 'employee', undefined)} 
                        {renderTableBlock('Equipment', data.equipment, equipmentHours, undefined, 'equipment', undefined)}
                        {renderTableBlock('Materials and Trucking', data.materials, materialHours, materialTickets, 'material', materialUnits)} 
                        {renderTableBlock('Work Performed', data.vendors, vendorHours, vendorTickets, 'vendor', vendorUnits)} 
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
    phaseButtonText: { color: THEME.text, fontWeight: '600', fontSize: 16 },
    selectedPhaseButtonText: { color: '#FFF' },
    card: {
        backgroundColor: THEME.card, borderRadius: 14, padding: THEME.SPACING, marginBottom: THEME.SPACING,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    tableTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 12 },
    tableContainer: { borderWidth: 1, borderColor: THEME.border, borderRadius: 8, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: THEME.tableHeaderBg },
    tableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: THEME.border },
    tableRowAlternate: { backgroundColor: THEME.rowAlternateBg },
    headerCell: {
        paddingVertical: 10, paddingHorizontal: 5, fontWeight: '700', color: THEME.text, fontSize: 12,
        textAlign: 'center', borderRightWidth: 1, borderRightColor: THEME.border,
    },
    dataCell: {
        paddingVertical: 8, paddingHorizontal: 5, color: THEME.text, fontSize: 14,
        textAlign: 'center', borderRightWidth: 1, borderRightColor: THEME.border,
        minHeight: 40, justifyContent: 'center', 
    },
    lastCell: { borderRightWidth: 0 },
    
    // Column Widths (Adjust as needed for layout)
    colName: { flex: 3 }, 
    colClassCode: { flex: 1.5 },
    colHours: { flex: 1.5 }, 
    colTickets: { flex: 1.2 },
    colTotal: { flex: 1.5 },

    // Phase Total Row Styles
    phaseTotalRow: { backgroundColor: THEME.tableHeaderBg, borderTopWidth: 2, borderTopColor: THEME.textSecondary },
    phaseTotalText: { fontWeight: 'bold', fontSize: 14, color: THEME.text, paddingVertical: 10 },
    
    // Missing style property 'noBottomBorder'
    noBottomBorder: { borderBottomWidth: 0 }, 

    // Total Quantity Styles
    quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    quantityLabel: { fontSize: 16, color: THEME.textSecondary, fontWeight: '500' },
    totalBox: { 
        paddingHorizontal: 15, paddingVertical: 8, backgroundColor: THEME.primary, 
        borderRadius: 8, minWidth: 80, alignItems: 'center' 
    },
    totalText: { fontSize: 18, fontWeight: 'bold', color: THEME.card },

    // Notes Styles
    notesText: { fontSize: 15, color: THEME.text, lineHeight: 22, marginTop: 5 },
});

export default TimesheetReviewScreen;
