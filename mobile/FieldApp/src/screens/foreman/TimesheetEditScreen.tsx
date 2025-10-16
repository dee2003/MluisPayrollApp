

// // export default TimesheetEditScreen;
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   SafeAreaView,
//   Alert,
// } from 'react-native';
// import { RouteProp } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import apiClient from '../../api/apiClient';
// import { Timesheet } from '../../types';
// import { ForemanStackParamList } from '../../navigation/AppNavigator';
// import { Dropdown } from 'react-native-element-dropdown';


// type HourState = Record<string, Record<string, string>>;
// type EditScreenRouteProp = RouteProp<ForemanStackParamList, 'TimesheetEdit'>;
// type EditScreenNavigationProp = StackNavigationProp<ForemanStackParamList, 'TimesheetEdit'>;


// type Props = {
//   route: EditScreenRouteProp;
//   navigation: EditScreenNavigationProp;
// };


// const COLORS = {
//   primary: '#007AFF',
//   success: '#34C759',
//   background: '#F2F2F7',
//   card: '#FFFFFF',
//   text: '#1C1C1E',
//   textSecondary: '#636366',
//   border: '#E5E5EA', // Slightly lighter border
// };


// const TimesheetEditScreen = ({ route, navigation }: Props) => {
//   const { timesheetId } = route.params;


//   const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
//   const [foremanName, setForemanName] = useState<string>('');
//   const [selectedPhase, setSelectedPhase] = useState<string | null>(null);


//   const [employeeHours, setEmployeeHours] = useState<HourState>({});
//   const [equipmentHours, setEquipmentHours] = useState<HourState>({});
//   const [materialHours, setMaterialHours] = useState<HourState>({});
//   const [vendorHours, setVendorHours] = useState<HourState>({});


//   const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  
//   const [loading, setLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);


//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
//         const tsData = response.data;
//         setTimesheet(tsData);
//         navigation.setOptions({ title: `${tsData.data.job_name} - Edit` });
//         if (tsData.data.job.phase_codes?.length > 0)
//           setSelectedPhase(tsData.data.job.phase_codes[0]);


//         const populateHours = (entities: any[] = []) => {
//           const state: HourState = {};
//           entities.forEach((entity) => {
//             state[entity.id] = {};
//             if (entity.hours_per_phase) {
//               for (const phase in entity.hours_per_phase) {
//                 state[entity.id][phase] = entity.hours_per_phase[phase].toString();
//               }
//             }
//           });
//           return state;
//         };


//         setEmployeeHours(populateHours(tsData.data.employees));
//         setEquipmentHours(populateHours(tsData.data.equipment));
//         // Re-populating Material and Vendor hours
//         setMaterialHours(populateHours(tsData.data.materials)); 
//         setVendorHours(populateHours(tsData.data.vendors));


//         const eqRes = await apiClient.get('/api/equipment');
//         setAvailableEquipment(eqRes.data);


//         const res = await apiClient.get(`/api/users/${tsData.foreman_id}`);
//         setForemanName(`${res.data.first_name} ${res.data.middle_name || ''} ${res.data.last_name}`.trim());
//       } catch (error) {
//         console.error(error);
//         Alert.alert('Error', 'Failed to load timesheet data.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [timesheetId, navigation]);


//   const handleHourChange = (type: 'employee' | 'equipment' | 'material' | 'vendor', entityId: string, phaseCode: string, value: string) => {
//     const setters = { 
//         employee: setEmployeeHours, 
//         equipment: setEquipmentHours, 
//         material: setMaterialHours, // Added Material
//         vendor: setVendorHours // Added Vendor
//     };
//     const sanitizedValue = value.replace(/[^0-9.]/g, '');
//     setters[type]((prev) => ({ ...prev, [entityId]: { ...prev[entityId], [phaseCode]: sanitizedValue } }));
//   };


//   const handleRemoveEquipment = (id: string) => {
//     setTimesheet((ts) => {
//       if (!ts) return ts;
//       const newEq = ts.data.equipment.filter((eq) => eq.id !== id);
//       return { ...ts, data: { ...ts.data, equipment: newEq } };
//     });
//     setEquipmentHours((prev) => {
//       const copy = { ...prev };
//       delete copy[id];
//       return copy;
//     });
//   };


//   const handleAddEquipment = (item: any) => {
//     if (!item || !item.id || !timesheet) return;


//     const equipmentToAdd = item;


//     if (timesheet.data.equipment.some(e => e.id === equipmentToAdd.id)) {
//         Alert.alert("Duplicate", "This equipment has already been added.");
//         return;
//     }


//     setTimesheet((ts) => {
//         if (!ts) return ts;
//         return {
//             ...ts,
//             data: {
//                 ...ts.data,
//                 equipment: [...ts.data.equipment, equipmentToAdd],
//             },
//         };
//     });


//     setEquipmentHours((prev) => ({ ...prev, [equipmentToAdd.id]: {} }));
//   };


//   const handleSave = async () => {
//     if (!timesheet) return;
//     setIsSubmitting(true);
//     try {
//       const updatedEmployees = timesheet.data.employees.map((emp) => ({
//         ...emp,
//         selected_class: emp.selected_class || '',
//         hours_per_phase: employeeHours[emp.id] || {},
//       }));
//       const updatedEquipment = timesheet.data.equipment.map((eq) => ({
//         ...eq,
//         hours_per_phase: equipmentHours[eq.id] || {},
//       }));
//       // Updated Materials and Vendors to include hours_per_phase
//       const updatedMaterials = timesheet.data.materials.map((mat) => ({
//         ...mat,
//         hours_per_phase: materialHours[mat.id] || {},
//       }));
//       const updatedVendors = timesheet.data.vendors.map((ven) => ({
//         ...ven,
//         hours_per_phase: vendorHours[ven.id] || {},
//       }));

//       const updatedData = {
//         ...timesheet.data,
//         employees: updatedEmployees,
//         equipment: updatedEquipment,
//         materials: updatedMaterials, 
//         vendors: updatedVendors,
//       };
//       await apiClient.put(`/api/timesheets/${timesheet.id}`, { data: updatedData });
//       Alert.alert('Success', 'Timesheet saved successfully!');
//     } catch (error) {
//       console.error('Save failed:', error);
//       Alert.alert('Error', 'Failed to save timesheet. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


//   const calculateTotalHours = (hoursState: HourState, entityId: string): number => {
//     const entityPhases = hoursState[entityId];
//     if (!entityPhases) return 0;
    
//     // Safely sum all hours for the entity, across all phases
//     return Object.values(entityPhases).reduce((total, hours) => total + (parseFloat(hours) || 0), 0);
//   };


//   const renderEntityInputs = (
//     title: string,
//     entities: any[],
//     hoursState: HourState,
//     type: 'employee' | 'equipment' | 'material' | 'vendor'
//   ) => (
//     <View style={styles.card}>
//       <Text style={styles.cardTitle}>{title}</Text>
//       {entities.map((entity) => {
//         const totalHours = calculateTotalHours(hoursState, entity.id);
        
//         // Determine the display name for the entity
//         const entityName = entity.first_name
//             ? `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim()
//             : entity.name;

//         return (
//           <View key={entity.id} style={styles.entityContainer}>
//             {/* --- LINE 1: NAME --- */}
//             <Text style={styles.inputLabel}>
//               {entityName}
//             </Text>
            
//             {/* --- LINE 2: CONTROLS --- */}
//             <View style={styles.controlsRow}>
//               {type === 'employee' && (
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
//               )}
              
//               {/* Spacer for non-employee types to maintain alignment of hour boxes */}
//               {type !== 'employee' && <View style={{flex: 1}} />} 

//               <View style={styles.hoursContainer}>
//                   <View style={styles.inputWithLabel}>
//                       <Text style={styles.inputHeader}>Phase</Text>
//                       <TextInput
//                         style={styles.input}
//                         keyboardType="numeric"
//                         placeholder="0"
//                         value={hoursState[entity.id]?.[selectedPhase!] || ''}
//                         onChangeText={(text) => handleHourChange(type, entity.id, selectedPhase!, text)}
//                       />
//                   </View>
//                   <View style={styles.inputWithLabel}>
//                       <Text style={styles.inputHeader}>Total</Text>
//                       <View style={styles.totalBox}>
//                           <Text style={styles.totalText}>{totalHours.toFixed(1)}</Text>
//                       </View>
//                   </View>
//               </View>

//               {type === 'equipment' && (
//                 <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveEquipment(entity.id)}>
//                   <Text style={styles.removeButtonText}>X</Text>
//                 </TouchableOpacity>
//               )}
//               {/* Add a placeholder for non-removable types to keep total boxes aligned */}
//               {type !== 'equipment' && <View style={{ width: 44, marginLeft: 10 }} />} 
//             </View>
//           </View>
//         );
//       })}
//       {type === 'equipment' && (
//         <View style={styles.addEquipmentRow}>
//           <Dropdown
//             style={[styles.dropdown, { flex: 1 }]}
//             data={availableEquipment.filter(eq => !timesheet?.data.equipment.some(e => e.id === eq.id))}
//             labelField="name"
//             valueField="id"
//             placeholder="Select equipment to add"
//             value={null}
//             onChange={handleAddEquipment}
//             maxHeight={200}
//             search
//             searchPlaceholder="Search..."
//           />
//         </View>
//       )}
//     </View>
//   );


//   if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
//   if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found</Text></View>;


//   const { data, date } = timesheet;
//   const handleSend = async () => {
//     if (!timesheet) return;
//     setIsSubmitting(true);
//     try {
//       await apiClient.post(`/api/timesheets/${timesheet.id}/send`);
//       Alert.alert('Success', 'Timesheet sent to supervisor!');
//     } catch (error) {
//       console.error('Send failed:', error);
//       Alert.alert('Error', 'Failed to send timesheet.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
//        <View style={styles.infoCard}>
//           <Text style={styles.jobTitle}>{data.job_name}</Text>
//           <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
//           <Text style={styles.infoText}>Date: {new Date(date).toLocaleDateString()}</Text>
//           <Text style={styles.infoText}>Foreman: {foremanName}</Text>
//           <Text style={styles.infoText}>Project Engineer: {data.project_engineer || 'N/A'}</Text>
//           <Text style={styles.infoText}>Location: {data.location || 'N/A'}</Text>
//           <Text style={styles.infoText}>Weather: {data.weather || 'N/A'}</Text>
//           <Text style={styles.infoText}>Temp: {data.temperature || 'N/A'}</Text>
//           <Text style={styles.infoText}>Day: {data.time_of_day || 'N/A'}</Text>
//         </View>


//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
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


//         {selectedPhase && (
//           <View>
//             {renderEntityInputs('Employees', data.employees, employeeHours, 'employee')}
//             {renderEntityInputs('Equipment', data.equipment, equipmentHours, 'equipment')}
//             {/* Re-added Material and Vendor Sections */}
//             {renderEntityInputs('Materials', data.materials, materialHours, 'material')}
//             {renderEntityInputs('Vendors', data.vendors, vendorHours, 'vendor')}
//           </View>
//         )}
//       </ScrollView>


//       <View style={styles.footer}>
//         <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={isSubmitting}>
//           {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Save Timesheet</Text>}
//         </TouchableOpacity>
//         {/* <TouchableOpacity style={[styles.submitButton, { backgroundColor: COLORS.primary, marginTop: 10 }]} onPress={handleSend} disabled={isSubmitting}>
//           <Text style={styles.submitButtonText}>Send Timesheet</Text>
//         </TouchableOpacity> */}
//       </View>
//     </SafeAreaView>
//   );
// };


// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: COLORS.background },
//   container: { flex: 1, paddingHorizontal: 10 },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   infoCard: {
//     padding: 16,
//     backgroundColor: COLORS.card,
//     borderRadius: 12,
//     marginTop: 10,
//   },
//   jobTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
//   jobCode: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
//   infoText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8 },
//   card: {
//     backgroundColor: COLORS.card,
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//   },
//   cardTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  
//   // --- Entity Layout Styles ---
//   entityContainer: {
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   inputLabel: {
//     fontSize: 17,
//     color: COLORS.text,
//     marginBottom: 10,
//     fontWeight: '500',
//   },
//   controlsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   hoursContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     // Align hours inputs to the right side of the container
//     justifyContent: 'flex-end',
//     flexShrink: 0,
//   },
//   inputWithLabel: {
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   inputHeader: {
//     fontSize: 12,
//     color: COLORS.textSecondary,
//     marginBottom: 4,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     height: 44,
//     width: 70,
//     textAlign: 'center',
//     fontSize: 16,
//   },
//   totalBox: {
//     backgroundColor: COLORS.background,
//     borderRadius: 8,
//     height: 44,
//     width: 70,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   totalText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: COLORS.text,
//   },
//   dropdown: {
//     height: 44,
//     borderColor: COLORS.border,
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//   },
//   removeButton: {
//     marginLeft: 10,
//     padding: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: 44, // Make remove button a fixed size for alignment
//     height: 44,
//     borderRadius: 8,
//     backgroundColor: '#FF3B301A', // Light red background
//   },
//   removeButtonText: {
//     color: '#FF3B30',
//     fontWeight: 'bold',
//     fontSize: 20
//   },
//   addEquipmentRow: {
//     marginTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//     paddingTop: 12,
//   },
//   phaseButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     marginRight: 8,
//     borderRadius: 20,
//     backgroundColor: COLORS.card,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   selectedPhaseButton: {
//     backgroundColor: COLORS.primary,
//     borderColor: COLORS.primary,
//   },
//   phaseButtonText: {
//     color: COLORS.text,
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   selectedPhaseButtonText: {
//     color: '#FFF',
//   },
//   footer: {
//     padding: 16,
//     backgroundColor: COLORS.card,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//   },
//   submitButton: {
//     backgroundColor: COLORS.success,
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     height: 50,
//   },
//   submitButtonText: {
//     color: '#FFF',
//     fontWeight: 'bold',
//     fontSize: 18,
//   },
// });


// export default TimesheetEditScreen;



// export default TimesheetEditScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DatePicker from 'react-native-date-picker';
import apiClient from '../../api/apiClient';
import { Timesheet } from '../../types';
import { ForemanStackParamList } from '../../navigation/AppNavigator';
import { Dropdown } from 'react-native-element-dropdown';

// --- Type Definitions ---
type EmployeeHourState = Record<string, Record<string, { REG?: string; 'S.B'?: string }>>;
type SimpleHourState = Record<string, Record<string, string>>;
type QuantityState = Record<string, string>;
type PhaseTotalState = Record<string, number>;

type EditScreenRouteProp = RouteProp<ForemanStackParamList, 'TimesheetEdit'>;
type EditScreenNavigationProp = StackNavigationProp<
  ForemanStackParamList,
  'TimesheetEdit'
>;

type Props = {
  route: EditScreenRouteProp;
  navigation: EditScreenNavigationProp;
};

// --- Main Component ---
const TimesheetEditScreen = ({ route, navigation }: Props) => {
  const { timesheetId } = route.params;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [foremanName, setForemanName] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  
  const [timesheetDate, setTimesheetDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // State for hours and quantities
  const [employeeHours, setEmployeeHours] = useState<EmployeeHourState>({});
  const [equipmentHours, setEquipmentHours] = useState<SimpleHourState>({});
  const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
  const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
  const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});

  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<Timesheet>(
          `/api/timesheets/${timesheetId}`
        );
        const tsData = response.data;
        setTimesheet(tsData);
        setTimesheetDate(new Date(tsData.date)); 
        
        navigation.setOptions({ title: `${tsData.data.job_name} - Edit` });
        if (tsData.data.job.phase_codes?.length > 0)
          setSelectedPhase(tsData.data.job.phase_codes[0]);
        
        // --- Data Population Functions ---
        const populateEmployeeHours = (entities: any[] = []): EmployeeHourState => {
          const state: EmployeeHourState = {};
          entities.forEach((entity) => {
            state[entity.id] = {};
            if (entity.hours_per_phase) {
              for (const phase in entity.hours_per_phase) {
                state[entity.id][phase] = {
                  REG: entity.hours_per_phase[phase]?.REG?.toString() || '',
                  'S.B': entity.hours_per_phase[phase]?.['S.B']?.toString() || '',
                };
              }
            }
          });
          return state;
        };
        
        const populateSimpleHours = (entities: any[] = []): SimpleHourState => {
          const state: SimpleHourState = {};
          entities.forEach((entity) => {
            state[entity.id] = {};
            if (entity.hours_per_phase) {
              for (const phase in entity.hours_per_phase) {
                state[entity.id][phase] =
                  entity.hours_per_phase[phase].toString();
              }
            }
          });
          return state;
        };

        setEmployeeHours(populateEmployeeHours(tsData.data.employees));
        setEquipmentHours(populateSimpleHours(tsData.data.equipment));
        setMaterialHours(populateSimpleHours(tsData.data.materials));
        setVendorHours(populateSimpleHours(tsData.data.vendors));

        if (tsData.data.total_quantities_per_phase) {
          const quantities: QuantityState = {};
          for (const phase in tsData.data.total_quantities_per_phase) {
            quantities[phase] = tsData.data.total_quantities_per_phase[phase].toString();
          }
          setTotalQuantities(quantities);
        }

        const eqRes = await apiClient.get('/api/equipment');
        setAvailableEquipment(eqRes.data);

        const res = await apiClient.get(`/api/users/${tsData.foreman_id}`);
        setForemanName(
          `${res.data.first_name} ${res.data.middle_name || ''} ${
            res.data.last_name
          }`.trim()
        );
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load timesheet data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timesheetId, navigation]);

  // --- Handlers for Data Changes ---
  const handleEmployeeHourChange = (employeeId: string, phaseCode: string, hourType: 'REG' | 'S.B', value: string) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    setEmployeeHours((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [phaseCode]: {
          ...prev[employeeId]?.[phaseCode],
          [hourType]: sanitizedValue,
        },
      },
    }));
  };
  
  const handleSimpleHourChange = (
    type: 'equipment' | 'material' | 'vendor',
    entityId: string,
    phaseCode: string,
    value: string
  ) => {
    const setters = {
      equipment: setEquipmentHours,
      material: setMaterialHours,
      vendor: setVendorHours,
    };
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    setters[type]((prev) => ({
      ...prev,
      [entityId]: { ...prev[entityId], [phaseCode]: sanitizedValue },
    }));
  };

  const handleTotalQuantityChange = (phaseCode: string, value: string) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    setTotalQuantities((prev) => ({
      ...prev,
      [phaseCode]: sanitizedValue,
    }));
  };

  const handleRemoveEquipment = (id: string) => {
    setTimesheet((ts) => {
      if (!ts) return ts;
      const newEq = ts.data.equipment.filter((eq) => eq.id !== id);
      return { ...ts, data: { ...ts.data, equipment: newEq } };
    });
    setEquipmentHours((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleAddEquipment = (item: any) => {
    if (!item || !item.id || !timesheet) return;
    const equipmentToAdd = item;
    if (timesheet.data.equipment.some((e) => e.id === equipmentToAdd.id)) {
      Alert.alert('Duplicate', 'This equipment has already been added.');
      return;
    }
    setTimesheet((ts) => {
      if (!ts) return ts;
      return {
        ...ts,
        data: {
          ...ts.data,
          equipment: [...ts.data.equipment, equipmentToAdd],
        },
      };
    });
    setEquipmentHours((prev) => ({ ...prev, [equipmentToAdd.id]: {} }));
  };

  const handleSave = async () => {
    if (!timesheet) return;
    setIsSubmitting(true);
    try {
      const updatedEmployees = timesheet.data.employees.map((emp) => ({
        ...emp,
        selected_class: emp.selected_class || '',
        hours_per_phase: employeeHours[emp.id] || {},
      }));
      const updatedEquipment = timesheet.data.equipment.map((eq) => ({
        ...eq,
        hours_per_phase: equipmentHours[eq.id] || {},
      }));
      const updatedMaterials = timesheet.data.materials.map((mat) => ({
        ...mat,
        hours_per_phase: materialHours[mat.id] || {},
      }));
      const updatedVendors = timesheet.data.vendors.map((ven) => ({
        ...ven,
        hours_per_phase: vendorHours[ven.id] || {},
      }));

      const updatedData = {
        ...timesheet.data,
        employees: updatedEmployees,
        equipment: updatedEquipment,
        materials: updatedMaterials,
        vendors: updatedVendors,
        total_quantities_per_phase: totalQuantities,
      };

      const payload = {
          data: updatedData,
          date: timesheetDate.toISOString(),
      };

      await apiClient.put(`/api/timesheets/${timesheet.id}`, payload);
      Alert.alert('Success', 'Timesheet saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save timesheet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Calculation Functions ---
  const calculateTotalEmployeeHours = (employeeId: string): number => {
    const employeePhases = employeeHours[employeeId];
    if (!employeePhases) return 0;
    return Object.values(employeePhases).reduce((total, phaseData) => {
        const regHours = parseFloat(phaseData.REG || '0');
        const sbHours = parseFloat(phaseData['S.B'] || '0');
        return total + (regHours || 0) + (sbHours || 0);
    }, 0);
  };

  const calculateTotalSimpleHours = (hoursState: SimpleHourState, entityId: string): number => {
    const entityPhases = hoursState[entityId];
    if (!entityPhases) return 0;
    return Object.values(entityPhases).reduce(
      (total, hours) => total + (parseFloat(hours) || 0),
      0
    );
  };
  
  const calculateEmployeePhaseTotals = (phaseCodes: string[]): PhaseTotalState => {
    const totals: PhaseTotalState = {};
    phaseCodes.forEach(phase => { totals[phase] = 0; });
    Object.values(employeeHours).forEach(employeeData => {
        phaseCodes.forEach(phase => {
            const phaseHours = employeeData[phase];
            if (phaseHours) {
                const regHours = parseFloat(phaseHours.REG || '0');
                const sbHours = parseFloat(phaseHours['S.B'] || '0');
                totals[phase] += (regHours || 0) + (sbHours || 0);
            }
        });
    });
    return totals;
  };
  
  const calculateSimplePhaseTotals = (hoursState: SimpleHourState, phaseCodes: string[]): PhaseTotalState => {
    const totals: PhaseTotalState = {};
    phaseCodes.forEach(phase => { totals[phase] = 0; });
    Object.values(hoursState).forEach(entityHours => {
        phaseCodes.forEach(phase => {
            const hourValue = parseFloat(entityHours[phase] || '0');
            if(!isNaN(hourValue)) {
                totals[phase] += hourValue;
            }
        })
    });
    return totals;
  };

  // --- Render Functions ---
  const renderEmployeeInputs = () => {
    const phaseTotals = calculateEmployeePhaseTotals(timesheet?.data.job.phase_codes || []);
    const employees = timesheet?.data.employees || [];

    return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Employees</Text>
          {employees.map((entity, index) => {
            const totalHours = calculateTotalEmployeeHours(entity.id);
            const entityName = `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim();
            const isLast = index === employees.length - 1;
        
            return (
              <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
                <Text style={styles.inputLabel}>{entityName}</Text>
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
                      <Text style={styles.inputHeader}>REG</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="0"
                        value={employeeHours[entity.id]?.[selectedPhase!]?.REG || ''}
                        onChangeText={(text) => handleEmployeeHourChange(entity.id, selectedPhase!, 'REG', text)}
                      />
                    </View>
                    <View style={styles.inputWithLabel}>
                      <Text style={styles.inputHeader}>S.B</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="0"
                        value={employeeHours[entity.id]?.[selectedPhase!]?.['S.B'] || ''}
                        onChangeText={(text) => handleEmployeeHourChange(entity.id, selectedPhase!, 'S.B', text)}
                      />
                    </View>
                    <View style={styles.inputWithLabel}>
                      <Text style={styles.inputHeader}>Total</Text>
                      <View style={styles.totalBox}>
                        <Text style={styles.totalText}>{totalHours.toFixed(1)}</Text>
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
                  {(timesheet?.data.job.phase_codes || []).map(phase => (
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
    hoursState: SimpleHourState,
    type: 'equipment' | 'material' | 'vendor'
  ) => {
    if (entities.length === 0) return null; // Don't render card if no entities
    const phaseTotals = calculateSimplePhaseTotals(hoursState, timesheet?.data.job.phase_codes || []);

    return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{title}</Text>
          {entities.map((entity, index) => {
            const totalHours = calculateTotalSimpleHours(hoursState, entity.id);
            const entityName = entity.name;
            const isLast = index === entities.length - 1 && type !== 'equipment';
        
            return (
              <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
                <Text style={styles.inputLabel}>{entityName}</Text>
                <View style={styles.controlsRow}>
                  <View style={{ flex: 1 }} />
                  <View style={styles.hoursContainer}>
                    <View style={styles.inputWithLabel}>
                      <Text style={styles.inputHeader}>Hours</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="0"
                        value={hoursState[entity.id]?.[selectedPhase!] || ''}
                        onChangeText={(text) =>
                          handleSimpleHourChange(type, entity.id, selectedPhase!, text)
                        }
                      />
                    </View>
                    <View style={styles.inputWithLabel}>
                      <Text style={styles.inputHeader}>Total</Text>
                      <View style={styles.totalBox}>
                        <Text style={styles.totalText}>
                          {totalHours.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {type === 'equipment' ? (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveEquipment(entity.id)}
                    >
                      <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 44, marginLeft: 10 }} /> // Spacer
                  )}
                </View>
              </View>
            );
          })}

          {type === 'equipment' && (
            <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total Hours:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
                    {(timesheet?.data.job.phase_codes || []).map(phase => (
                        <View key={phase} style={styles.totalPhaseItem}>
                            <Text style={styles.totalPhaseHeader}>{phase}</Text>
                            <View style={styles.totalBox}>
                                <Text style={styles.totalText}>{phaseTotals[phase]?.toFixed(1) || '0.0'}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
          )}
          
          {type === 'equipment' && (
            <View style={styles.addEquipmentRow}>
              <Dropdown
                style={[styles.dropdown, { flex: 1 }]}
                data={availableEquipment.filter(
                  (eq) => !timesheet?.data.equipment.some((e) => e.id === eq.id)
                )}
                labelField="name"
                valueField="id"
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

  if (loading)
    return <ActivityIndicator size="large" style={styles.centered} />;
  if (!timesheet)
    return (
      <View style={styles.centered}>
        <Text>Timesheet not found</Text>
      </View>
    );

  const { data } = timesheet;
const handleSend = async () => {
  if (!timesheet) return;
  setIsSubmitting(true);
  try {
    const response = await apiClient.post(`/api/timesheets/${timesheet.id}/send`);
    setTimesheet(response.data);
    Alert.alert('Success', 'Timesheet sent successfully!');
  } catch (error) {
    console.error('Send failed:', error);
    Alert.alert('Error', 'Failed to send timesheet.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: THEME.SPACING, paddingBottom: 100 }} // Added bottom padding
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Text style={styles.jobTitle}>{data.job_name}</Text>
          <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                <Text style={styles.infoValueClickable}>
                  {timesheetDate.toLocaleDateString()}
                </Text>
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
           </ View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.phaseSelectorContainer}
        >
          {data.job.phase_codes.map((phase) => (
            <TouchableOpacity
              key={phase}
              style={[
                styles.phaseButton,
                selectedPhase === phase && styles.selectedPhaseButton,
              ]}
              onPress={() => setSelectedPhase(phase)}
            >
              <Text
                style={[
                  styles.phaseButtonText,
                  selectedPhase === phase && styles.selectedPhaseButtonText,
                ]}
              >
                {phase}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {selectedPhase && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Quantity</Text>
            <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>
                    Phase {selectedPhase}:
                </Text>
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

        {selectedPhase && (
          <View>
            {renderEmployeeInputs()}
            {renderEntityInputs(
              'Equipment',
              data.equipment,
              equipmentHours,
              'equipment'
            )}
            {renderEntityInputs(
              'Materials',
              data.materials,
              materialHours,
              'material'
            )}
            {renderEntityInputs(
              'Vendors',
              data.vendors,
              vendorHours,
              'vendor'
            )}
          </View>
        )}
      </ScrollView>

      {/* --- MODALS AND FOOTER ARE OUTSIDE THE SCROLLVIEW --- */}
      <DatePicker
        modal
        open={isDatePickerVisible}
        date={timesheetDate}
        mode="date"
        onConfirm={(selectedDate) => {
          setDatePickerVisible(false);
          setTimesheetDate(selectedDate);
        }}
        onCancel={() => {
          setDatePickerVisible(false);
        }}
      />
      
      <View style={styles.footer}>
     <TouchableOpacity
  style={[styles.submitButton, { backgroundColor: '#007AFF', marginTop: 10 }]}
  onPress={handleSend}
  disabled={isSubmitting}
>
  <Text style={styles.submitButtonText}>Send Timesheet</Text>
</TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  infoCard: {
    padding: THEME.SPACING,
    backgroundColor: THEME.card,
    borderRadius: 14,
    marginBottom: THEME.SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.text,
  },
  jobCode: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  infoGrid: {
    marginTop: THEME.SPACING,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
  },
  infoValueClickable: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.primary,
  },
  phaseSelectorContainer: {
    marginVertical: THEME.SPACING / 2,
  },
  phaseButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  selectedPhaseButton: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  phaseButtonText: {
    color: THEME.text,
    fontWeight: '600',
    fontSize: 16,
  },
  selectedPhaseButtonText: {
    color: '#FFF',
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    padding: THEME.SPACING,
    marginBottom: THEME.SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  entityContainer: {
    paddingVertical: THEME.SPACING,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  lastEntityContainer: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  inputLabel: {
    fontSize: 18,
    color: THEME.text,
    marginBottom: 12,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  inputWithLabel: {
    alignItems: 'center',
    marginLeft: 10,
  },
  inputHeader: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 48,
    width: 65,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
    backgroundColor: THEME.lightGray,
  },
  totalBox: {
    backgroundColor: THEME.background,
    borderRadius: 10,
    height: 48,
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
  },
  dropdown: {
    height: 48,
    borderColor: THEME.border,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: THEME.lightGray,
  },
  removeButton: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${THEME.danger}1A`,
  },
  removeButtonText: {
    color: THEME.danger,
    fontWeight: 'bold',
    fontSize: 20,
  },
  addEquipmentRow: {
    marginTop: THEME.SPACING,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: THEME.SPACING,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
  },
  quantityInput: {
    width: 150,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.SPACING,
    paddingTop: THEME.SPACING,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  totalsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
    marginRight: 10,
  },
  totalsContainer: {
    flexDirection: 'row',
  },
  totalPhaseItem: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  totalPhaseHeader: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  footer: {
    padding: THEME.SPACING,
    backgroundColor: THEME.card,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: THEME.success,
    padding: THEME.SPACING,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default TimesheetEditScreen;