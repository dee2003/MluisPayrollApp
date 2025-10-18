
// // export default TimesheetEditScreen;
// import React, { useState, useEffect } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
//   ActivityIndicator, SafeAreaView, Alert,
// } from 'react-native';
// import { RouteProp } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import DatePicker from 'react-native-date-picker';
// import apiClient from '../../api/apiClient';
// import { Timesheet } from '../../types';
// import { ForemanStackParamList } from '../../navigation/AppNavigator';
// import { Dropdown } from 'react-native-element-dropdown';

// // --- Type Definitions ---
// type EmployeeHourState = Record<string, Record<string, { REG?: string; 'S.B'?: string }>>;
// type ComplexHourState = Record<string, Record<string, { REG?: string; 'S.B'?: string }>>;
// type SimpleHourState = Record<string, Record<string, string>>;
// type QuantityState = Record<string, string>;
// type PhaseTotalState = Record<string, number>;

// type EditScreenRouteProp = RouteProp<ForemanStackParamList, 'TimesheetEdit'>;
// type EditScreenNavigationProp = StackNavigationProp<
//   ForemanStackParamList,
//   'TimesheetEdit'
// >;

// type Props = {
//   route: EditScreenRouteProp;
//   navigation: EditScreenNavigationProp;
// };

// // --- Main Component ---
// // type EditScreenNavigationProp = StackNavigationProp<ForemanStackParamList, 'TimesheetEdit'>;

// // type Props = { route: EditScreenRouteProp; navigation: EditScreenNavigationProp; };

// const TimesheetEditScreen = ({ route, navigation }: Props) => {
//   const { timesheetId } = route.params;

//   const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
//   const [foremanName, setForemanName] = useState('');
//   const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
//   const [timesheetDate, setTimesheetDate] = useState(new Date());
//   const [isDatePickerVisible, setDatePickerVisible] = useState(false);

//   // Notes (max 300)
//   const [notes, setNotes] = useState('');

//   // State: employees are SIMPLE hours; equipment is COMPLEX (REG/S.B)
//   const [employeeHours, setEmployeeHours] = useState<SimpleHourState>({});
//   const [equipmentHours, setEquipmentHours] = useState<ComplexHourState>({});
//   const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
//   const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
//   const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});

//   const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
//         const tsData = response.data;
//         setTimesheet(tsData);
//         setTimesheetDate(new Date(tsData.date));
//         setNotes(tsData.data.notes || '');

//         navigation.setOptions({ title: `${tsData.data.job_name} - Edit` });
//         if (tsData.data.job.phase_codes?.length > 0) setSelectedPhase(tsData.data.job.phase_codes[0]);

//         // Populate helpers
//         const populateEmployeesSimpleFlexible = (entities: any[] = []): SimpleHourState => {
//           const state: SimpleHourState = {};
//           entities.forEach((e) => {
//             state[e.id] = {};
//             if (e.hours_per_phase) {
//               for (const phase in e.hours_per_phase) {
//                 const v = e.hours_per_phase[phase];
//                 // If backend stored {REG,'S.B'}, show sum; if number, use as-is
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
//                     REG: v.REG?.toString() || '',
//                     'S.B': v['S.B']?.toString() || '',
//                   };
//                 } else {
//                   // Legacy numeric -> map to REG, leave S.B empty
//                   const num = parseFloat((v ?? '0').toString());
//                   state[e.id][phase] = { REG: (!isNaN(num) ? num.toString() : ''), 'S.B': '' };
//                 }
//               }
//             }
//           });
//           return state;
//         };

//         const populateSimple = (entities: any[] = []): SimpleHourState => {
//           const state: SimpleHourState = {};
//           entities.forEach((e) => {
//             state[e.id] = {};
//             if (e.hours_per_phase) {
//               for (const phase in e.hours_per_phase) {
//                 state[e.id][phase] = e.hours_per_phase[phase]?.toString() || '';
//               }
//             }
//           });
//           return state;
//         };

//         setEmployeeHours(populateEmployeesSimpleFlexible(tsData.data.employees));
//         setEquipmentHours(populateEquipmentComplex(tsData.data.equipment));
//         setMaterialHours(populateSimple(tsData.data.materials));
//         setVendorHours(populateSimple(tsData.data.vendors));

//         if (tsData.data.total_quantities_per_phase) {
//           const q: QuantityState = {};
//           for (const phase in tsData.data.total_quantities_per_phase) {
//             q[phase] = tsData.data.total_quantities_per_phase[phase].toString();
//           }
//           setTotalQuantities(q);
//         }

//         const eqRes = await apiClient.get('/api/equipment');
//         setAvailableEquipment(eqRes.data);

//         const res = await apiClient.get(`/api/users/${tsData.foreman_id}`);
//         setForemanName(`${res.data.first_name} ${res.data.middle_name || ''} ${res.data.last_name}`.trim());
//       } catch (err) {
//         console.error(err);
//         Alert.alert('Error', 'Failed to load timesheet data.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [timesheetId, navigation]);

        

//  const handleEmployeeHourChange = (employeeId: string, phaseCode: string, value: string) => {
//     const sanitized = value.replace(/[^0-9.]/g, '');
//     setEmployeeHours((prev) => ({
//       ...prev,
//       [employeeId]: { ...prev[employeeId], [phaseCode]: sanitized },
//     }));
//   };
//   const handleComplexHourChange = (
//     setter: React.Dispatch<React.SetStateAction<ComplexHourState>>,
//     entityId: string,
//     phaseCode: string,
//     hourType: 'REG' | 'S.B',
//     value: string
//   ) => {
//     const sanitized = value.replace(/[^0-9.]/g, '');
//     setter((prev) => ({
//       ...prev,
//       [entityId]: { 
//         ...prev[entityId], 
//         [phaseCode]: { ...(prev[entityId]?.[phaseCode] || {}), [hourType]: sanitized } 
//       },
//     }));
//   };

//   const handleSimpleHourChange = (
//     type: 'material' | 'vendor',
//     entityId: string,
//     phaseCode: string,
//     value: string
//   ) => {
//     const setters = { material: setMaterialHours, vendor: setVendorHours };
//     const sanitized = value.replace(/[^0-9.]/g, '');
//     setters[type]((prev) => ({
//       ...prev,
//       [entityId]: { ...prev[entityId], [phaseCode]: sanitized },
//     }));
//   };

//   const handleTotalQuantityChange = (phaseCode: string, value: string) => {
//     const sanitized = value.replace(/[^0-9.]/g, '');
//     setTotalQuantities((prev) => ({ ...prev, [phaseCode]: sanitized }));
//   };
//   // Handlers
//   const handleRemoveEquipment = (id: string) => {
//     setTimesheet((ts) => {
//       if (!ts) return ts;
//       return { ...ts, data: { ...ts.data, equipment: ts.data.equipment.filter((eq) => eq.id !== id) } };
//     });
//     setEquipmentHours((prev) => {
//       const copy = { ...prev };
//       delete copy[id];
//       return copy;
//     });
//   };

//   const handleAddEquipment = (item: any) => {
//     if (!item || !item.id || !timesheet) return;
//     if (timesheet.data.equipment.some((e) => e.id === item.id)) {
//       Alert.alert('Duplicate', 'This equipment has already been added.');
//       return;
//     }
//     setTimesheet((ts) => {
//       if (!ts) return ts;
//       return { ...ts, data: { ...ts.data, equipment: [...ts.data.equipment, item] } };
//     });
//     setEquipmentHours((prev) => ({ ...prev, [item.id]: {} }));
//   };

//   // Save
//   const handleSave = async () => {
//     if (!timesheet) return;
//     setIsSubmitting(true);
//     try {
//       // employees -> simple numbers per phase
//       const toNumbers = (m: Record<string, string>) => {
//         const out: Record<string, number> = {};
//         Object.keys(m).forEach((phase) => {
//           const num = parseFloat(m[phase] || '0');
//           if (!isNaN(num) && num > 0) out[phase] = num;
//         });
//         return out;
//       };

//       const processComplex = (m: Record<string, { REG?: string; 'S.B'?: string }>) => {
//         const out: Record<string, { REG: number; 'S.B': number }> = {};
//         Object.keys(m).forEach((phase) => {
//           const reg = parseFloat(m[phase].REG || '0');
//           const sb = parseFloat(m[phase]['S.B'] || '0');
//           if ((reg > 0) || (sb > 0)) out[phase] = { REG: isNaN(reg) ? 0 : reg, 'S.B': isNaN(sb) ? 0 : sb };
//         });
//         return out;
//       };

//       const updatedEmployees = timesheet.data.employees.map((emp) => ({
//         ...emp,
//         selected_class: emp.selected_class || '',
//         hours_per_phase: toNumbers(employeeHours[emp.id] || {}),
//       }));

//       const updatedEquipment = timesheet.data.equipment.map((eq) => ({
//         ...eq,
//         hours_per_phase: processComplex(equipmentHours[eq.id] || {}),
//       }));

//       const updatedMaterials = timesheet.data.materials.map((mat) => ({
//         ...mat,
//         hours_per_phase: toNumbers(materialHours[mat.id] || {}),
//       }));

//       const updatedVendors = timesheet.data.vendors.map((ven) => ({
//         ...ven,
//         hours_per_phase: toNumbers(vendorHours[ven.id] || {}),
//       }));

//       const updatedData = {
//         ...timesheet.data,
//         employees: updatedEmployees,
//         equipment: updatedEquipment,
//         materials: updatedMaterials,
//         vendors: updatedVendors,
//         total_quantities_per_phase: totalQuantities,
//         notes,
//       };

//       const payload = { data: updatedData, date: timesheetDate.toISOString() };

//       await apiClient.put(`/api/timesheets/${timesheet.id}`, payload);
//       Alert.alert('Success', 'Timesheet saved successfully!');
//     } catch (e) {
//       console.error('Save failed:', e);
//       Alert.alert('Error', 'Failed to save timesheet. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSend = async () => {
//     if (!timesheet) return;
//     setIsSubmitting(true);
//     try {
//       await handleSave();
//       const response = await apiClient.post(`/api/timesheets/${timesheet.id}/send`);
//       setTimesheet(response.data);
//       Alert.alert('Success', 'Timesheet sent successfully!');
//     } catch (e) {
//       console.error('Send failed:', e);
//       Alert.alert('Error', 'Failed to send timesheet.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Calculations
//   const calculateTotalSimpleHours = (hoursState: SimpleHourState, entityId: string): number => {
//     const m = hoursState[entityId];
//     if (!m) return 0;
//     return Object.values(m).reduce((t, v) => t + (parseFloat(v) || 0), 0);
//   };

//   const calculateSimplePhaseTotals = (hoursState: SimpleHourState, phaseCodes: string[]): PhaseTotalState => {
//     const totals: PhaseTotalState = {};
//     phaseCodes.forEach((p) => (totals[p] = 0));
//     Object.values(hoursState).forEach((perEntity) => {
//       phaseCodes.forEach((p) => {
//         const val = parseFloat(perEntity[p] || '0');
//         if (!isNaN(val)) totals[p] += val;
//       });
//     });
//     return totals;
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

//   const calculateComplexPhaseTotals = (hoursState: ComplexHourState, phaseCodes: string[]): PhaseTotalState => {
//     const totals: PhaseTotalState = {};
//     phaseCodes.forEach((p) => (totals[p] = 0));
//     Object.values(hoursState).forEach((perEntity) => {
//       phaseCodes.forEach((p) => {
//         const reg = parseFloat(perEntity[p]?.REG || '0');
//         const sb = parseFloat(perEntity[p]?.['S.B'] || '0');
//         if (!isNaN(reg)) totals[p] += reg;
//         if (!isNaN(sb)) totals[p] += sb;
//       });
//     });
//     return totals;
//   };

//   // Renders
//   const renderEmployeeInputs = () => {
//     const phaseTotals = calculateSimplePhaseTotals(employeeHours, timesheet?.data.job.phase_codes || []);
//     const employees = timesheet?.data.employees || [];

//     return (
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Employees</Text>
//         {employees.map((entity, index) => {
//           const total = calculateTotalSimpleHours(employeeHours, entity.id);
//           const name = `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim();
//           const isLast = index === employees.length - 1;

//           return (
//             <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
//               <Text style={styles.inputLabel}>{name}</Text>
//               <View style={styles.controlsRow}>
//                 <Dropdown
//                   style={[styles.dropdown, { flex: 1 }]}
//                   containerStyle={{ flex: 1 }}
//                   data={[
//                     ...(entity.class_1 ? [{ label: entity.class_1, value: entity.class_1 }] : []),
//                     ...(entity.class_2 ? [{ label: entity.class_2, value: entity.class_2 }] : []),
//                   ]}
//                   labelField="label"
//                   valueField="value"
//                   placeholder="Select Class"
//                   value={entity.selected_class || undefined}
//                   onChange={(item) => {
//                     setTimesheet((ts) => {
//                       if (!ts) return ts;
//                       const updatedEmployees = ts.data.employees.map((emp) =>
//                         emp.id === entity.id ? { ...emp, selected_class: item.value } : emp
//                       );
//                       return { ...ts, data: { ...ts.data, employees: updatedEmployees } };
//                     });
//                   }}
//                 />
//                 <View style={styles.hoursContainer}>
//                   <View style={styles.inputWithLabel}>
//                     <Text style={styles.inputHeader}>Hours</Text>
//                     <TextInput
//                       style={styles.input}
//                       keyboardType="numeric"
//                       placeholder="0"
//                       value={employeeHours[entity.id]?.[selectedPhase!] || ''}
//                       onChangeText={(text) => handleEmployeeHourChange(entity.id, selectedPhase!, text)}
//                     />
//                   </View>
//                   <View style={styles.inputWithLabel}>
//                     <Text style={styles.inputHeader}>Total</Text>
//                     <View style={styles.totalBox}>
//                       <Text style={styles.totalText}>{total.toFixed(1)}</Text>
//                     </View>
//                   </View>
//                 </View>
//               </View>
//             </View>
//           );
//         })}

//         <View style={styles.totalsRow}>
//           <Text style={styles.totalsLabel}>Total Hours:</Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
//             {(timesheet?.data.job.phase_codes || []).map((phase) => (
//               <View key={phase} style={styles.totalPhaseItem}>
//                 <Text style={styles.totalPhaseHeader}>{phase}</Text>
//                 <View style={styles.totalBox}>
//                   <Text style={styles.totalText}>{phaseTotals[phase]?.toFixed(1) || '0.0'}</Text>
//                 </View>
//               </View>
//             ))}
//           </ScrollView>
//         </View>
//       </View>
//     );
//   };

//   const renderEntityInputs = (
//     title: string,
//     entities: any[],
//     type: 'equipment' | 'material' | 'vendor'
//   ) => {
//     if (entities.length === 0 && type !== 'equipment') return null;
//     const isEquipment = type === 'equipment';

//     const phaseTotals = isEquipment
//       ? calculateComplexPhaseTotals(equipmentHours, timesheet?.data.job.phase_codes || [])
//       : calculateSimplePhaseTotals(type === 'material' ? materialHours : vendorHours, timesheet?.data.job.phase_codes || []);

//     return (
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>{title}</Text>
//         {entities.map((entity, index) => {
//           const total = isEquipment
//             ? calculateTotalComplexHours(equipmentHours, entity.id)
//             : calculateTotalSimpleHours(type === 'material' ? materialHours : vendorHours, entity.id);
//           const name = entity.name;
//           const isLast = index === entities.length - 1 && !isEquipment;

//           return (
//             <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
//               <Text style={styles.inputLabel}>{name}</Text>
//               <View style={styles.controlsRow}>
//                 <View style={{ flex: 1 }} />
//                 <View style={styles.hoursContainer}>
//                   {isEquipment ? (
//                     <>
//                       <View style={styles.inputWithLabel}>
//                         <Text style={styles.inputHeader}>REG</Text>
//                         <TextInput
//                           style={styles.input}
//                           keyboardType="numeric"
//                           placeholder="0"
//                           value={equipmentHours[entity.id]?.[selectedPhase!]?.REG || ''}
//                           onChangeText={(text) => handleComplexHourChange(setEquipmentHours, entity.id, selectedPhase!, 'REG', text)}
//                         />
//                       </View>
//                       <View style={styles.inputWithLabel}>
//                         <Text style={styles.inputHeader}>S.B</Text>
//                         <TextInput
//                           style={styles.input}
//                           keyboardType="numeric"
//                           placeholder="0"
//                           value={equipmentHours[entity.id]?.[selectedPhase!]?.['S.B'] || ''}
//                           onChangeText={(text) => handleComplexHourChange(setEquipmentHours, entity.id, selectedPhase!, 'S.B', text)}
//                         />
//                       </View>
//                     </>
//                   ) : (
//                     <View style={styles.inputWithLabel}>
//                       <Text style={styles.inputHeader}>Hours</Text>
//                       <TextInput
//                         style={styles.input}
//                         keyboardType="numeric"
//                         placeholder="0"
//                         value={(type === 'material' ? materialHours : vendorHours)[entity.id]?.[selectedPhase!] || ''}
//                         onChangeText={(text) => handleSimpleHourChange(type, entity.id, selectedPhase!, text)}
//                       />
//                     </View>
//                   )}
//                   <View style={styles.inputWithLabel}>
//                     <Text style={styles.inputHeader}>Total</Text>
//                     <View style={styles.totalBox}>
//                       <Text style={styles.totalText}>{total.toFixed(1)}</Text>
//                     </View>
//                   </View>
//                 </View>

//                 {isEquipment ? (
//                   <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveEquipment(entity.id)}>
//                     <Text style={styles.removeButtonText}>X</Text>
//                   </TouchableOpacity>
//                 ) : (
//                   <View style={{ width: 44, marginLeft: 10 }} />
//                 )}
//               </View>
//             </View>
//           );
//         })}

//         <View style={styles.totalsRow}>
//           <Text style={styles.totalsLabel}>Total Hours:</Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
//             {(timesheet?.data.job.phase_codes || []).map((phase) => (
//               <View key={phase} style={styles.totalPhaseItem}>
//                 <Text style={styles.totalPhaseHeader}>{phase}</Text>
//                 <View style={styles.totalBox}>
//                   <Text style={styles.totalText}>{phaseTotals[phase]?.toFixed(1) || '0.0'}</Text>
//                 </View>
//               </View>
//             ))}
//           </ScrollView>
//         </View>

//         {isEquipment && (
//           <View style={styles.addEquipmentRow}>
//             <Dropdown
//               style={[styles.dropdown, { flex: 1 }]}
//               data={availableEquipment.filter((eq) => !timesheet?.data.equipment.some((e) => e.id === eq.id))}
//               labelField="name"
//               valueField="id"
//               placeholder="Select equipment to add"
//               value={null}
//               onChange={handleAddEquipment}
//               maxHeight={200}
//               search
//               searchPlaceholder="Search..."
//             />
//           </View>
//         )}
//       </View>
//     );
//   };

//   if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
//   if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found</Text></View>;

//   const { data } = timesheet;

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: THEME.SPACING, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
//         <View style={styles.infoCard}>
//           <Text style={styles.jobTitle}>{data.job_name}</Text>
//           <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
//           <View style={styles.infoGrid}>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Date</Text>
//               <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
//                 <Text style={styles.infoValueClickable}>{timesheetDate.toLocaleDateString()}</Text>
//               </TouchableOpacity>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Foreman</Text>
//               <Text style={styles.infoValue}>{foremanName}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Project Engineer</Text>
//               <Text style={styles.infoValue}>{data.project_engineer || 'N/A'}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Day</Text>
//               <Text style={styles.infoValue}>{data.time_of_day || 'N/A'}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Location</Text>
//               <Text style={styles.infoValue}>{data.location || 'N/A'}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Weather</Text>
//               <Text style={styles.infoValue}>{data.weather || 'N/A'}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Temperature</Text>
//               <Text style={styles.infoValue}>{data.temperature || 'N/A'}</Text>
//             </View>
//           </View>
//         </View>

//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelectorContainer}>
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

//         {/* --- MOVED: Notes and Quantity are now at the bottom --- */}

//         {selectedPhase && (
//           <View>
//             {renderEmployeeInputs()}
//             {renderEntityInputs('Equipment', data.equipment, 'equipment')}
//             {renderEntityInputs('Materials', data.materials, 'material')}
//             {renderEntityInputs('Vendors', data.vendors, 'vendor')}
//           </View>
//         )}
        
//         {selectedPhase && (
//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>Total Quantity</Text>
//             <View style={styles.quantityRow}>
//               <Text style={styles.quantityLabel}>Phase {selectedPhase}:</Text>
//               <TextInput
//                 style={[styles.input, styles.quantityInput]}
//                 keyboardType="numeric"
//                 placeholder="Enter quantity"
//                 value={totalQuantities[selectedPhase] || ''}
//                 onChangeText={(text) => handleTotalQuantityChange(selectedPhase, text)}
//               />
//             </View>
//           </View>
//         )}

//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>Notes</Text>
//           <TextInput
//             style={styles.notesInput}
//             multiline
//             maxLength={300}
//             placeholder="Enter any notes for this timesheet..."
//             value={notes}
//             onChangeText={setNotes}
//           />
//           <Text style={styles.characterCount}>{`${notes.length} / 300`}</Text>
//         </View>

//       </ScrollView>

//       <DatePicker
//         modal
//         open={isDatePickerVisible}
//         date={timesheetDate}
//         mode="date"
//         onConfirm={(d) => { setDatePickerVisible(false); setTimesheetDate(d); }}
//         onCancel={() => setDatePickerVisible(false)}
//       />

//       <View style={styles.footer}>

//         <TouchableOpacity
//           style={[styles.submitButton, { backgroundColor: THEME.primary, marginTop: 10 }]}
//           onPress={handleSend}
//           disabled={isSubmitting}
//         >
//           <Text style={styles.submitButtonText}>Send Timesheet</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// // --- Stylesheet ---
// const THEME = {
//   primary: '#007AFF',
//   success: '#34C759',
//   danger: '#FF3B30',
//   background: '#F0F0F7',
//   card: '#FFFFFF',
//   text: '#1C1C1E',
//   textSecondary: '#6A6A6A',
//   border: '#E0E0E5',
//   lightGray: '#F8F8F8',
//   SPACING: 16,
// };

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: THEME.background },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
//   infoCard: {
//     padding: THEME.SPACING, backgroundColor: THEME.card, borderRadius: 14, marginBottom: THEME.SPACING,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
//   },
//   jobTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
//   jobCode: { fontSize: 16, color: THEME.textSecondary, marginTop: 4 },
//   infoGrid: { marginTop: THEME.SPACING, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   infoItem: { width: '48%', marginBottom: 8 },
//   infoLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
//   infoValue: { fontSize: 16, fontWeight: '500', color: THEME.text },
//   infoValueClickable: { fontSize: 16, fontWeight: '500', color: THEME.primary },
//   phaseSelectorContainer: { marginVertical: THEME.SPACING / 2 },
//   phaseButton: {
//     paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderRadius: 20,
//     backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border,
//   },
//   selectedPhaseButton: {
//     backgroundColor: THEME.primary, borderColor: THEME.primary,
//     shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6,
//   },
//   phaseButtonText: { color: THEME.text, fontWeight: '600', fontSize: 16 },
//   selectedPhaseButtonText: { color: '#FFF' },
//   card: {
//     backgroundColor: THEME.card, borderRadius: 14, padding: THEME.SPACING, marginBottom: THEME.SPACING,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
//   },
//   cardTitle: {
//     fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 8, paddingBottom: 8,
//     borderBottomWidth: 1, borderBottomColor: THEME.border,
//   },
//   entityContainer: { paddingVertical: THEME.SPACING, borderBottomWidth: 1, borderBottomColor: THEME.border },
//   lastEntityContainer: { borderBottomWidth: 0, paddingBottom: 0 },
//   inputLabel: { fontSize: 18, color: THEME.text, marginBottom: 12, fontWeight: '600' },
//   controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   hoursContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
//   inputWithLabel: { alignItems: 'center', marginLeft: 10 },
//   inputHeader: { fontSize: 13, color: THEME.textSecondary, marginBottom: 4, fontWeight: '500' },
//   input: {
//     borderWidth: 1.5, borderColor: THEME.border, borderRadius: 10, paddingHorizontal: 10,
//     height: 48, width: 65, textAlign: 'center', fontSize: 16, fontWeight: '500', color: THEME.text, backgroundColor: THEME.lightGray,
//   },
//   totalBox: {
//     backgroundColor: THEME.background, borderRadius: 10, height: 48, width: 70,
//     justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.border,
//   },
//   totalText: { fontSize: 16, fontWeight: 'bold', color: THEME.text },
//   dropdown: {
//     height: 48, borderColor: THEME.border, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, backgroundColor: THEME.lightGray,
//   },
//   removeButton: {
//     marginLeft: 10, width: 48, height: 48, borderRadius: 10, justifyContent: 'center',
//     alignItems: 'center', backgroundColor: `${THEME.danger}1A`,
//   },
//   removeButtonText: { color: THEME.danger, fontWeight: 'bold', fontSize: 20 },
//   addEquipmentRow: { marginTop: THEME.SPACING, borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: THEME.SPACING },
//   quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   quantityLabel: { fontSize: 16, fontWeight: '500', color: THEME.text },
//   quantityInput: { width: 150 },
//   totalsRow: {
//     flexDirection: 'row', alignItems: 'center', marginTop: THEME.SPACING, paddingTop: THEME.SPACING,
//     borderTopWidth: 1, borderTopColor: THEME.border,
//   },
//   totalsLabel: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginRight: 10 },
//   totalsContainer: { flexDirection: 'row' },
//   totalPhaseItem: { alignItems: 'center', marginHorizontal: 4 },
//   totalPhaseHeader: { fontSize: 12, color: THEME.textSecondary, marginBottom: 4 },
//   footer: {
//     padding: THEME.SPACING, backgroundColor: THEME.card, borderTopWidth: 1, borderTopColor: THEME.border,
//     shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5,
//   },
//   submitButton: {
//     padding: THEME.SPACING, borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 56,
//   },
//   submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
//   notesInput: {
//     borderWidth: 1.5, borderColor: THEME.border, borderRadius: 10, padding: 12, height: 100,
//     textAlignVertical: 'top', fontSize: 16, color: THEME.text, backgroundColor: THEME.lightGray,
//   },
//   characterCount: { fontSize: 12, color: THEME.textSecondary, textAlign: 'right', marginTop: 4 },
// });

// export default TimesheetEditScreen;




import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DatePicker from 'react-native-date-picker';
import apiClient from '../../api/apiClient';
import { Timesheet } from '../../types';
import { ForemanStackParamList } from '../../navigation/AppNavigator';
import { Dropdown } from 'react-native-element-dropdown';

// --- Theme Constants ---
const THEME = {
  primary: '#007AFF',
  success: '#34C759',
  danger: '#FF3B30',
  background: '#F0F0F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#6A6A6A',
  border: '#E0E0E5',
  lightGray: '#F8F8F8',
  SPACING: 16,
};

// --- Type Definitions ---
type ComplexHourState = Record<string, Record<string, { REG?: string; 'S.B'?: string }>>;
type SimpleHourState = Record<string, Record<string, string>>;
type QuantityState = Record<string, string>;
type PhaseTotalState = Record<string, number>;

type EditScreenRouteProp = RouteProp<ForemanStackParamList, 'TimesheetEdit'>;
type EditScreenNavigationProp = StackNavigationProp<ForemanStackParamList, 'TimesheetEdit'>;

type Props = { route: EditScreenRouteProp; navigation: EditScreenNavigationProp; };

const TimesheetEditScreen = ({ route, navigation }: Props) => {
  const { timesheetId } = route.params;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [foremanName, setForemanName] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [timesheetDate, setTimesheetDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [notes, setNotes] = useState('');

  const [employeeHours, setEmployeeHours] = useState<SimpleHourState>({});
  const [equipmentHours, setEquipmentHours] = useState<ComplexHourState>({});
  const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
  const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
  const [materialTickets, setMaterialTickets] = useState<SimpleHourState>({});
  const [vendorTickets, setVendorTickets] = useState<SimpleHourState>({});

  const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
        const tsData = response.data;
        setTimesheet(tsData);
        setTimesheetDate(new Date(tsData.date));
        setNotes(tsData.data.notes || '');

        navigation.setOptions({ title: `${tsData.data.job_name} - Edit` });
        if (tsData.data.job.phase_codes?.length > 0) setSelectedPhase(tsData.data.job.phase_codes[0]);

        const populateSimple = (entities: any[] = [], field: 'hours_per_phase' | 'tickets_per_phase'): SimpleHourState => {
            const state: SimpleHourState = {};
            entities.forEach((e) => {
                state[e.id] = {};
                if (e[field]) {
                    for (const phase in e[field]) {
                        state[e.id][phase] = e[field][phase]?.toString() || '';
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
                    REG: v.REG?.toString() || '',
                    'S.B': v['S.B']?.toString() || '',
                  };
                } else {
                  const num = parseFloat((v ?? '0').toString());
                  state[e.id][phase] = { REG: (!isNaN(num) ? num.toString() : ''), 'S.B': '' };
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

        const eqRes = await apiClient.get('/api/equipment');
        setAvailableEquipment(eqRes.data);

        const res = await apiClient.get(`/api/users/${tsData.foreman_id}`);
        setForemanName(`${res.data.first_name} ${res.data.middle_name || ''} ${res.data.last_name}`.trim());
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load timesheet data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timesheetId, navigation]);

  const handleEmployeeHourChange = (employeeId: string, phaseCode: string, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setEmployeeHours((prev) => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], [phaseCode]: sanitized },
    }));
  };

  const handleComplexHourChange = (
    setter: React.Dispatch<React.SetStateAction<ComplexHourState>>,
    entityId: string, phaseCode: string, hourType: 'REG' | 'S.B', value: string
  ) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setter((prev) => ({
      ...prev,
      [entityId]: { ...prev[entityId], [phaseCode]: { ...(prev[entityId]?.[phaseCode] || {}), [hourType]: sanitized } },
    }));
  };

  const handleSimpleValueChange = (
    type: 'material' | 'vendor',
    field: 'hours' | 'tickets',
    entityId: string, phaseCode: string, value: string
  ) => {
      const setters = {
          material: { hours: setMaterialHours, tickets: setMaterialTickets },
          vendor: { hours: setVendorHours, tickets: setVendorTickets },
      };
      const sanitize = (val: string, fieldType: 'hours' | 'tickets') => {
        return fieldType === 'hours' ? val.replace(/[^0-9.]/g, '') : val.replace(/[^0-9]/g, '');
      }
      const sanitized = sanitize(value, field);
      setters[type][field]((prev) => ({
          ...prev,
          [entityId]: { ...prev[entityId], [phaseCode]: sanitized },
      }));
  };
  
  const handleTotalQuantityChange = (phaseCode: string, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setTotalQuantities((prev) => ({ ...prev, [phaseCode]: sanitized }));
  };

  const handleRemoveEquipment = (id: string) => {
    setTimesheet((ts) => {
      if (!ts) return ts;
      return { ...ts, data: { ...ts.data, equipment: ts.data.equipment.filter((eq) => eq.id !== id) } };
    });
    setEquipmentHours((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleAddEquipment = (item: any) => {
    if (!item || !item.value || !timesheet) return;
    
    const equipmentToAdd = availableEquipment.find(eq => eq.id === item.value);

    if (timesheet.data.equipment.some((e) => e.id === equipmentToAdd.id)) {
      Alert.alert('Duplicate', 'This equipment has already been added.');
      return;
    }
    setTimesheet((ts) => {
      if (!ts) return ts;
      return { ...ts, data: { ...ts.data, equipment: [...ts.data.equipment, equipmentToAdd] } };
    });
    setEquipmentHours((prev) => ({ ...prev, [equipmentToAdd.id]: {} }));
  };

  const handleSave = async (andSend: boolean = false) => {
    if (!timesheet) return false;
    setIsSubmitting(true);
    let success = false;
    try {
      const toNumbers = (m: Record<string, string>) => {
        const out: Record<string, number> = {};
        Object.keys(m).forEach((phase) => {
          const num = parseFloat(m[phase] || '0');
          if (!isNaN(num) && num > 0) out[phase] = num;
        });
        return out;
      };

      const processComplex = (m: Record<string, { REG?: string; 'S.B'?: string }>) => {
        const out: Record<string, { REG: number; 'S.B': number }> = {};
        Object.keys(m).forEach((phase) => {
          const reg = parseFloat(m[phase]?.REG || '0');
          const sb = parseFloat(m[phase]?.['S.B'] || '0');
          if ((reg > 0) || (sb > 0)) out[phase] = { REG: isNaN(reg) ? 0 : reg, 'S.B': isNaN(sb) ? 0 : sb };
        });
        return out;
      };
      
      const updatedEmployees = timesheet.data.employees.map((emp) => ({
        ...emp,
        selected_class: emp.selected_class || '',
        hours_per_phase: toNumbers(employeeHours[emp.id] || {}),
      }));

      const updatedEquipment = timesheet.data.equipment.map((eq) => ({
        ...eq,
        hours_per_phase: processComplex(equipmentHours[eq.id] || {}),
      }));

      const updatedMaterials = timesheet.data.materials.map((mat) => ({
        ...mat,
        hours_per_phase: toNumbers(materialHours[mat.id] || {}),
        tickets_per_phase: toNumbers(materialTickets[mat.id] || {}),
      }));

      const updatedVendors = timesheet.data.vendors.map((ven) => ({
        ...ven,
        hours_per_phase: toNumbers(vendorHours[ven.id] || {}),
        tickets_per_phase: toNumbers(vendorTickets[ven.id] || {}),
      }));

      const updatedData = {
        ...timesheet.data,
        employees: updatedEmployees,
        equipment: updatedEquipment,
        materials: updatedMaterials,
        vendors: updatedVendors,
        total_quantities_per_phase: totalQuantities,
        notes,
      };

      const payload = { data: updatedData, date: timesheetDate.toISOString() };

      await apiClient.put(`/api/timesheets/${timesheet.id}`, payload);
      if (!andSend) {
        Alert.alert('Success', 'Timesheet saved successfully!');
      }
      success = true;
    } catch (e) {
      console.error('Save failed:', e);
      Alert.alert('Error', 'Failed to save timesheet. Please try again.');
    } finally {
      if (!andSend) {
          setIsSubmitting(false);
      }
    }
    return success;
  };

  const handleSubmit = async () => {
    const saved = await handleSave(true);
    if (!saved || !timesheet) {
        setIsSubmitting(false);
        return;
    }
    try {
      const response = await apiClient.post(`/api/timesheets/${timesheet.id}/send`);
      setTimesheet(response.data);
      Alert.alert('Success', 'Timesheet submitted successfully!');
    } catch (e) {
      console.error('Send failed:', e);
      Alert.alert('Error', 'Failed to send timesheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalSimple = (state: SimpleHourState, entityId: string): number => {
    const m = state[entityId];
    if (!m) return 0;
    return Object.values(m).reduce((t, v) => t + (parseFloat(v) || 0), 0);
  };
  
  const calculateSimplePhaseTotals = (state: SimpleHourState, phaseCodes: string[]): PhaseTotalState => {
    const totals: PhaseTotalState = {};
    phaseCodes.forEach((p) => (totals[p] = 0));
    Object.values(state).forEach((perEntity) => {
      phaseCodes.forEach((p) => {
        const val = parseFloat(perEntity[p] || '0');
        if (!isNaN(val)) totals[p] += val;
      });
    });
    return totals;
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

  const calculateComplexPhaseTotals = (hoursState: ComplexHourState, phaseCodes: string[]): PhaseTotalState => {
    const totals: PhaseTotalState = {};
    phaseCodes.forEach((p) => (totals[p] = 0));
    Object.values(hoursState).forEach((perEntity) => {
      phaseCodes.forEach((p) => {
        const reg = parseFloat(perEntity[p]?.REG || '0');
        const sb = parseFloat(perEntity[p]?.['S.B'] || '0');
        if (!isNaN(reg)) totals[p] += reg;
        if (!isNaN(sb)) totals[p] += sb;
      });
    });
    return totals;
  };

  const renderEmployeeInputs = () => {
    const phaseTotals = calculateSimplePhaseTotals(employeeHours, timesheet?.data.job.phase_codes || []);
    const employees = timesheet?.data.employees || [];

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Employees</Text>
            {employees.map((entity, index) => {
                const total = calculateTotalSimple(employeeHours, entity.id);
                const name = `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim();
                const isLast = index === employees.length - 1;

                return (
                    <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
                        <Text style={styles.inputLabel}>{name}</Text>
                        <View style={styles.controlsRow}>
                            <Dropdown
                                style={[styles.dropdown, { flex: 1 }]}
                                containerStyle={{ flex: 1 }}
                                data={[
                                    ...(entity.class_1 ? [{ label: entity.class_1, value: entity.class_1 }] : []),
                                    ...(entity.class_2 ? [{ label: entity.class_2, value: entity.class_2 }] : []),
                                ]}
                                labelField="label"
                                valueField="value"
                                placeholder="Select Class"
                                value={entity.selected_class || undefined}
                                onChange={(item) => {
                                    setTimesheet((ts) => {
                                        if (!ts) return ts;
                                        const updatedEmployees = ts.data.employees.map((emp) =>
                                            emp.id === entity.id ? { ...emp, selected_class: item.value } : emp
                                        );
                                        return { ...ts, data: { ...ts.data, employees: updatedEmployees } };
                                    });
                                }}
                            />
                            <View style={styles.hoursContainer}>
                                <View style={styles.inputWithLabel}>
                                    <Text style={styles.inputHeader}>Hours</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        value={employeeHours[entity.id]?.[selectedPhase!] || ''}
                                        onChangeText={(text) => handleEmployeeHourChange(entity.id, selectedPhase!, text)}
                                    />
                                </View>
                                <View style={styles.inputWithLabel}>
                                    <Text style={styles.inputHeader}>Total</Text>
                                    <View style={styles.totalBox}>
                                        <Text style={styles.totalText}>{total.toFixed(1)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                );
            })}

            <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total Hours:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
                    {(timesheet?.data.job.phase_codes || []).map((phase) => (
                        <View key={phase} style={styles.totalPhaseItem}>
                            <Text style={styles.totalPhaseHeader}>{phase}</Text>
                            <View style={styles.totalBox}>
                                <Text style={styles.totalText}>{phaseTotals[phase]?.toFixed(1) || '0.0'}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
  };

  const renderEntityInputs = (
    title: string,
    entities: any[],
    type: 'equipment' | 'material' | 'vendor'
  ) => {
    if (entities.length === 0 && type !== 'equipment') return null;
    const isEquipment = type === 'equipment';

    const hoursState = isEquipment ? equipmentHours : (type === 'material' ? materialHours : vendorHours);

    const phaseHourTotals = isEquipment
      ? calculateComplexPhaseTotals(hoursState as ComplexHourState, timesheet?.data.job.phase_codes || [])
      : calculateSimplePhaseTotals(hoursState as SimpleHourState, timesheet?.data.job.phase_codes || []);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        {entities.map((entity, index) => {
          const totalHours = isEquipment
            ? calculateTotalComplexHours(hoursState as ComplexHourState, entity.id)
            : calculateTotalSimple(hoursState as SimpleHourState, entity.id);

          const name = isEquipment ? `${entity.id} - ${entity.name}` : entity.name;
          const isLast = index === entities.length - 1 && !isEquipment;

          return (
            <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
              <Text style={styles.inputLabel}>{name}</Text>
              <View style={styles.controlsRow}>
                <View style={{ flex: 1 }} />
                <View style={styles.hoursContainer}>
                  {isEquipment ? (
                    <>
                      <View style={styles.inputWithLabel}>
                        <Text style={styles.inputHeader}>REG</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          placeholder="0"
                          value={equipmentHours[entity.id]?.[selectedPhase!]?.REG || ''}
                          onChangeText={(text) => handleComplexHourChange(setEquipmentHours, entity.id, selectedPhase!, 'REG', text)}
                        />
                      </View>
                      <View style={styles.inputWithLabel}>
                        <Text style={styles.inputHeader}>S.B</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          placeholder="0"
                          value={equipmentHours[entity.id]?.[selectedPhase!]?.['S.B'] || ''}
                          onChangeText={(text) => handleComplexHourChange(setEquipmentHours, entity.id, selectedPhase!, 'S.B', text)}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                        <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>Hours</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="0"
                                value={(type === 'material' ? materialHours : vendorHours)[entity.id]?.[selectedPhase!] || ''}
                                onChangeText={(text) => handleSimpleValueChange(type, 'hours', entity.id, selectedPhase!, text)}
                            />
                        </View>
                        <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}># Tickets</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                placeholder="0"
                                value={(type === 'material' ? materialTickets : vendorTickets)[entity.id]?.[selectedPhase!] || ''}
                                onChangeText={(text) => handleSimpleValueChange(type, 'tickets', entity.id, selectedPhase!, text)}
                            />
                        </View>
                    </>
                  )}
                  <View style={styles.inputWithLabel}>
                    <Text style={styles.inputHeader}>Total Hrs</Text>
                    <View style={styles.totalBox}>
                      <Text style={styles.totalText}>{totalHours.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>

                {isEquipment ? (
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveEquipment(entity.id)}>
                    <Text style={styles.removeButtonText}>X</Text>
                  </TouchableOpacity>
                ) : ( <View style={{ width: 44, marginLeft: 10 }} /> )}
              </View>
            </View>
          );
        })}

        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Total Hours:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
            {(timesheet?.data.job.phase_codes || []).map((phase) => (
              <View key={`${phase}-h`} style={styles.totalPhaseItem}>
                <Text style={styles.totalPhaseHeader}>{phase}</Text>
                <View style={styles.totalBox}>
                  <Text style={styles.totalText}>{phaseHourTotals[phase]?.toFixed(1) || '0.0'}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {isEquipment && (
          <View style={styles.addEquipmentRow}>
            <Dropdown
              style={[styles.dropdown, { flex: 1 }]}
              data={availableEquipment
                .filter((eq) => !timesheet?.data.equipment.some((e) => e.id === eq.id))
                .map(eq => ({ label: `${eq.id} - ${eq.name}`, value: eq.id }))
              }
              labelField="label"
              valueField="value"
              placeholder="Select equipment to add"
              value={null}
              onChange={handleAddEquipment}
              maxHeight={200}
              search
              searchPlaceholder="Search..."
            />
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found</Text></View>;

  const { data } = timesheet;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: THEME.SPACING, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Text style={styles.jobTitle}>{data.job_name}</Text>
          <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                <Text style={styles.infoValueClickable}>{timesheetDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Foreman</Text>
              <Text style={styles.infoValue}>{foremanName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Project Engineer</Text>
              <Text style={styles.infoValue}>{data.project_engineer || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Day</Text>
              <Text style={styles.infoValue}>{data.time_of_day || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{data.location || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Weather</Text>
              <Text style={styles.infoValue}>{data.weather || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Temperature</Text>
              <Text style={styles.infoValue}>{data.temperature || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelectorContainer}>
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
            {renderEmployeeInputs()}
            {renderEntityInputs('Equipment', data.equipment, 'equipment')}
            {renderEntityInputs('Materials and Trucking', data.materials, 'material')}
            {renderEntityInputs('Work Performed', data.vendors, 'vendor')}
          </View>
        )}
        
        {selectedPhase && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Quantity</Text>
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Phase {selectedPhase}:</Text>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                keyboardType="numeric"
                placeholder="Enter quantity"
                value={totalQuantities[selectedPhase] || ''}
                onChangeText={(text) => handleTotalQuantityChange(selectedPhase, text)}
              />
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            maxLength={300}
            placeholder="Enter any notes for this timesheet..."
            value={notes}
            onChangeText={setNotes}
          />
          <Text style={styles.characterCount}>{`${notes.length} / 300`}</Text>
        </View>

      </ScrollView>

      <DatePicker
        modal
        open={isDatePickerVisible}
        date={timesheetDate}
        mode="date"
        onConfirm={(d) => { setDatePickerVisible(false); setTimesheetDate(d); }}
        onCancel={() => setDatePickerVisible(false)}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: THEME.primary }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>Submit Timesheet</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    infoCard: {
        padding: THEME.SPACING, backgroundColor: THEME.card, borderRadius: 14, marginBottom: THEME.SPACING,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
    },
    jobTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
    jobCode: { fontSize: 16, color: THEME.textSecondary, marginTop: 4 },
    infoGrid: { marginTop: THEME.SPACING, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    infoItem: { width: '48%', marginBottom: 8 },
    infoLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
    infoValue: { fontSize: 16, fontWeight: '500', color: THEME.text },
    infoValueClickable: { fontSize: 16, fontWeight: '500', color: THEME.primary },
    phaseSelectorContainer: { marginVertical: THEME.SPACING / 2 },
    phaseButton: {
        paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderRadius: 20,
        backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border,
    },
    selectedPhaseButton: {
        backgroundColor: THEME.primary, borderColor: THEME.primary,
        shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6,
    },
    phaseButtonText: { color: THEME.text, fontWeight: '600', fontSize: 16 },
    selectedPhaseButtonText: { color: '#FFF' },
    card: {
        backgroundColor: THEME.card, borderRadius: 14, padding: THEME.SPACING, marginBottom: THEME.SPACING,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardTitle: {
        fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 8, paddingBottom: 8,
        borderBottomWidth: 1, borderBottomColor: THEME.border,
    },
    entityContainer: { paddingVertical: THEME.SPACING, borderBottomWidth: 1, borderBottomColor: THEME.border },
    lastEntityContainer: { borderBottomWidth: 0, paddingBottom: 0 },
    inputLabel: { fontSize: 18, color: THEME.text, marginBottom: 12, fontWeight: '600' },
    controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    hoursContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    inputWithLabel: { alignItems: 'center', marginLeft: 10 },
    inputHeader: { fontSize: 13, color: THEME.textSecondary, marginBottom: 4, fontWeight: '500' },
    input: {
        borderWidth: 1.5, borderColor: THEME.border, borderRadius: 10, paddingHorizontal: 10,
        height: 48, width: 65, textAlign: 'center', fontSize: 16, fontWeight: '500', color: THEME.text, backgroundColor: THEME.lightGray,
    },
    totalBox: {
        backgroundColor: THEME.background, borderRadius: 10, height: 48, width: 70,
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.border,
    },
    totalText: { fontSize: 16, fontWeight: 'bold', color: THEME.text },
    dropdown: {
        height: 48, borderColor: THEME.border, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, backgroundColor: THEME.lightGray,
    },
    removeButton: {
        marginLeft: 10, width: 48, height: 48, borderRadius: 10, justifyContent: 'center',
        alignItems: 'center', backgroundColor: `${THEME.danger}1A`,
    },
    removeButtonText: { color: THEME.danger, fontWeight: 'bold', fontSize: 20 },
    addEquipmentRow: { marginTop: THEME.SPACING, borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: THEME.SPACING },
    quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    quantityLabel: { fontSize: 16, fontWeight: '500', color: THEME.text },
    quantityInput: { width: 150 },
    totalsRow: {
        flexDirection: 'row', alignItems: 'center', marginTop: THEME.SPACING, paddingTop: THEME.SPACING,
        borderTopWidth: 1, borderTopColor: THEME.border,
    },
    totalsLabel: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginRight: 10 },
    totalsContainer: { flexDirection: 'row' },
    totalPhaseItem: { alignItems: 'center', marginHorizontal: 4 },
    totalPhaseHeader: { fontSize: 12, color: THEME.textSecondary, marginBottom: 4 },
    footer: {
        padding: THEME.SPACING, backgroundColor: THEME.card, borderTopWidth: 1, borderTopColor: THEME.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5,
    },
    submitButton: {
        padding: THEME.SPACING, borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 56,
    },
    submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    notesInput: {
        borderWidth: 1.5, borderColor: THEME.border, borderRadius: 10, padding: 12, height: 100,
        textAlignVertical: 'top', fontSize: 16, color: THEME.text, backgroundColor: THEME.lightGray,
    },
    characterCount: { fontSize: 12, color: THEME.textSecondary, textAlign: 'right', marginTop: 4 },
});

export default TimesheetEditScreen;
