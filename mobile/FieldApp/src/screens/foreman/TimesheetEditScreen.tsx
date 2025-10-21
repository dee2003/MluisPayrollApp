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

// --- Theme & Unit Constants ---
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

const MATERIAL_UNITS = ['CUBE', 'YARD', 'TON', 'LOAD', 'EACH'].map(u => ({ label: u, value: u }));
const VENDOR_UNITS = ['CY', 'TON', 'SF', 'SY', 'LF', 'EA'].map(u => ({ label: u, value: u }));


// --- Type Definitions ---
type EmployeeHourState = Record<string, Record<string, { [className: string]: string }>>;
type EquipmentHourState = Record<string, Record<string, { REG?: string; 'S.B'?: string }>>;
type SimpleValueState = Record<string, Record<string, string>>;
type UnitState = Record<string, string>;
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

  // State for entity data
  const [employeeHours, setEmployeeHours] = useState<EmployeeHourState>({});
  const [equipmentHours, setEquipmentHours] = useState<EquipmentHourState>({});
  const [materialHours, setMaterialHours] = useState<SimpleValueState>({});
  const [materialQuantities, setMaterialQuantities] = useState<SimpleValueState>({});
  const [materialUnits, setMaterialUnits] = useState<UnitState>({});
  const [vendorQuantities, setVendorQuantities] = useState<SimpleValueState>({});
  const [vendorUnits, setVendorUnits] = useState<UnitState>({});
  
  const [totalQuantities, setTotalQuantities] = useState<Record<string, string>>({});
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

        const populateSimple = (entities: any[] = [], field: 'hours_per_phase' | 'quantities_per_phase' | 'tickets_per_phase'): SimpleValueState => {
            const state: SimpleValueState = {};
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

        const populateUnits = (entities: any[] = [], defaultUnit: string): UnitState => {
            const state: UnitState = {};
            entities.forEach(e => {
                state[e.id] = e.unit || defaultUnit;
            });
            return state;
        };

        const populateEmployeesComplex = (entities: any[] = []): EmployeeHourState => {
          const state: EmployeeHourState = {};
          entities.forEach((e) => {
            state[e.id] = {};
            if (e.hours_per_phase) {
              for (const phase in e.hours_per_phase) {
                const phaseHours = e.hours_per_phase[phase];
                state[e.id][phase] = {};
                if (phaseHours && typeof phaseHours === 'object') {
                  if (e.class_1) state[e.id][phase][e.class_1] = (phaseHours[e.class_1] || '').toString();
                  if (e.class_2) state[e.id][phase][e.class_2] = (phaseHours[e.class_2] || '').toString();
                } else {
                   // Fallback for older data format
                  if(e.class_1) state[e.id][phase][e.class_1] = (phaseHours || '').toString();
                }
              }
            }
          });
          return state;
        };

        const populateEquipmentComplex = (entities: any[] = []): EquipmentHourState => {
          const state: EquipmentHourState = {};
          entities.forEach((e) => {
            state[e.id] = {};
            if (e.hours_per_phase) {
              for (const phase in e.hours_per_phase) {
                const v = e.hours_per_phase[phase];
                if (v && typeof v === 'object') {
                  state[e.id][phase] = { REG: v.REG?.toString() || '', 'S.B': v['S.B']?.toString() || '' };
                } else {
                  const num = parseFloat((v ?? '0').toString());
                  state[e.id][phase] = { REG: !isNaN(num) ? num.toString() : '', 'S.B': '' };
                }
              }
            }
          });
          return state;
        };

        setEmployeeHours(populateEmployeesComplex(tsData.data.employees));
        setEquipmentHours(populateEquipmentComplex(tsData.data.equipment));
        setMaterialHours(populateSimple(tsData.data.materials, 'hours_per_phase'));
        setMaterialQuantities(populateSimple(tsData.data.materials, 'quantities_per_phase'));
        setMaterialUnits(populateUnits(tsData.data.materials, MATERIAL_UNITS[0].value));
        setVendorQuantities(populateSimple(tsData.data.vendors, 'quantities_per_phase'));
        setVendorUnits(populateUnits(tsData.data.vendors, VENDOR_UNITS[0].value));

        if (tsData.data.total_quantities_per_phase) {
          const q: Record<string, string> = {};
          for (const phase in tsData.data.total_quantities_per_phase) {
            q[phase] = tsData.data.total_quantities_per_phase[phase].toString();
          }
          setTotalQuantities(q);
        }

        setAvailableEquipment((await apiClient.get('/api/equipment')).data);
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

  // --- Handlers ---

  const handleEmployeeHourChange = (employeeId: string, phaseCode: string, className: string, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setEmployeeHours(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [phaseCode]: {
          ...(prev[employeeId]?.[phaseCode] || {}),
          [className]: sanitized
        }
      }
    }));
  };

  const handleEquipmentHourChange = (entityId: string, phaseCode: string, hourType: 'REG' | 'S.B', value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setEquipmentHours(prev => ({
      ...prev,
      [entityId]: { ...prev[entityId], [phaseCode]: { ...(prev[entityId]?.[phaseCode] || {}), [hourType]: sanitized } },
    }));
  };
  
  const handleMaterialVendorChange = (
    type: 'material' | 'vendor',
    field: 'hours' | 'quantity' | 'unit',
    entityId: string,
    value: string,
    phaseCode?: string,
  ) => {
    const sanitize = (val: string) => val.replace(/[^0-9.]/g, '');

    if (type === 'material') {
        if (field === 'hours' && phaseCode) {
            setMaterialHours(p => ({ ...p, [entityId]: { ...p[entityId], [phaseCode]: sanitize(value) }}));
        } else if (field === 'quantity' && phaseCode) {
            setMaterialQuantities(p => ({ ...p, [entityId]: { ...p[entityId], [phaseCode]: sanitize(value) }}));
        } else if (field === 'unit') {
            setMaterialUnits(p => ({ ...p, [entityId]: value }));
        }
    } else if (type === 'vendor') {
        if (field === 'quantity' && phaseCode) {
            setVendorQuantities(p => ({ ...p, [entityId]: { ...p[entityId], [phaseCode]: sanitize(value) }}));
        } else if (field === 'unit') {
            setVendorUnits(p => ({ ...p, [entityId]: value }));
        }
    }
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
    setEquipmentHours((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
  };

  const handleAddEquipment = (item: any) => {
    if (!item || !item.value || !timesheet) return;
    const equipmentToAdd = availableEquipment.find(eq => eq.id === item.value);
    if (timesheet.data.equipment.some((e) => e.id === equipmentToAdd.id)) {
      Alert.alert('Duplicate', 'This equipment has already been added.');
      return;
    }
    setTimesheet((ts) => !ts ? ts : { ...ts, data: { ...ts.data, equipment: [...ts.data.equipment, equipmentToAdd] } });
    setEquipmentHours((prev) => ({ ...prev, [equipmentToAdd.id]: {} }));
  };

  // --- Save & Submit Logic ---

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

      const toNumbersFromObject = (obj: Record<string, { [key: string]: string }>) => {
        const out: Record<string, Record<string, number>> = {};
        for(const phase in obj) {
            out[phase] = {};
            for(const key in obj[phase]) {
                const num = parseFloat(obj[phase][key] || '0');
                if (!isNaN(num) && num > 0) out[phase][key] = num;
            }
        }
        return out;
      }
      
      const processEquipment = (m: Record<string, { REG?: string; 'S.B'?: string }>) => {
        const out: Record<string, { REG: number; 'S.B': number }> = {};
        Object.keys(m).forEach((phase) => {
          const reg = parseFloat(m[phase]?.REG || '0');
          const sb = parseFloat(m[phase]?.['S.B'] || '0');
          if ((reg > 0) || (sb > 0)) out[phase] = { REG: isNaN(reg) ? 0 : reg, 'S.B': isNaN(sb) ? 0 : sb };
        });
        return out;
      };

      const updatedData = {
        ...timesheet.data,
        employees: timesheet.data.employees.map((emp) => ({
          ...emp,
          hours_per_phase: toNumbersFromObject(employeeHours[emp.id] || {}),
        })),
        equipment: timesheet.data.equipment.map((eq) => ({
          ...eq,
          hours_per_phase: processEquipment(equipmentHours[eq.id] || {}),
        })),
        materials: timesheet.data.materials.map((mat) => ({
          ...mat,
          unit: materialUnits[mat.id],
          hours_per_phase: toNumbers(materialHours[mat.id] || {}),
          quantities_per_phase: toNumbers(materialQuantities[mat.id] || {}),
        })),
        vendors: timesheet.data.vendors.map((ven) => ({
          ...ven,
          unit: vendorUnits[ven.id],
          quantities_per_phase: toNumbers(vendorQuantities[ven.id] || {}),
        })),
        total_quantities_per_phase: toNumbers(totalQuantities),
        notes,
      };

      await apiClient.put(`/api/timesheets/${timesheet.id}`, { data: updatedData, date: timesheetDate.toISOString() });
      if (!andSend) Alert.alert('Success', 'Timesheet saved successfully!');
      success = true;
    } catch (e) {
      console.error('Save failed:', e);
      Alert.alert('Error', 'Failed to save timesheet. Please try again.');
    } finally {
      if (!andSend) setIsSubmitting(false);
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

  // --- Calculation Helpers ---
  const calculateTotalEmployeeHours = (state: EmployeeHourState, entityId: string): number => {
    const entityPhases = state[entityId];
    if (!entityPhases) return 0;
    return Object.values(entityPhases).reduce((phaseTotal, classHours) => {
        const classTotal = Object.values(classHours).reduce((acc, h) => acc + (parseFloat(h) || 0), 0);
        return phaseTotal + classTotal;
    }, 0);
  };

  const calculateEmployeePhaseTotals = (state: EmployeeHourState, phaseCodes: string[]): PhaseTotalState => {
    const totals: PhaseTotalState = {};
    phaseCodes.forEach(p => totals[p] = 0);
    Object.values(state).forEach(perEntity => {
        phaseCodes.forEach(p => {
            if (perEntity[p]) {
                Object.values(perEntity[p]).forEach(h => {
                    const val = parseFloat(h || '0');
                    if (!isNaN(val)) totals[p] += val;
                });
            }
        });
    });
    return totals;
  };
  
  const calculateTotalSimple = (state: SimpleValueState, entityId: string): number => {
    return Object.values(state[entityId] || {}).reduce((t, v) => t + (parseFloat(v) || 0), 0);
  };
  
  const calculateSimplePhaseTotals = (state: SimpleValueState, phaseCodes: string[]): PhaseTotalState => {
    const totals: PhaseTotalState = {};
    phaseCodes.forEach(p => totals[p] = 0);
    Object.values(state).forEach(perEntity => {
      phaseCodes.forEach(p => {
        totals[p] += parseFloat(perEntity[p] || '0') || 0;
      });
    });
    return totals;
  };

  const calculateTotalComplex = (state: EquipmentHourState, entityId: string): number => {
    return Object.values(state[entityId] || {}).reduce((t, v) => {
      return t + (parseFloat(v?.REG || '0') || 0) + (parseFloat(v?.['S.B'] || '0') || 0);
    }, 0);
  };

  const calculateComplexPhaseTotals = (state: EquipmentHourState, phaseCodes: string[]): PhaseTotalState => {
    const totals: PhaseTotalState = {};
    phaseCodes.forEach(p => totals[p] = 0);
    Object.values(state).forEach(perEntity => {
      phaseCodes.forEach(p => {
        totals[p] += (parseFloat(perEntity[p]?.REG || '0') || 0) + (parseFloat(perEntity[p]?.['S.B'] || '0') || 0);
      });
    });
    return totals;
  };


  // --- Render Functions ---

  const renderEmployeeInputs = () => {
    const phaseTotals = calculateEmployeePhaseTotals(employeeHours, timesheet?.data.job.phase_codes || []);
    const employees = timesheet?.data.employees || [];

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Employees</Text>
            {employees.map((entity, index) => {
                const total = calculateTotalEmployeeHours(employeeHours, entity.id);
                const name = `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`.trim();
                const isLast = index === employees.length - 1;

                return (
                    <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
                        <Text style={styles.employeeName}>{entity.id} - {name}</Text>
                        <View style={styles.controlsRow}>
                            <View style={{ flex: 1 }} />
                            <View style={styles.hoursContainer}>
                                {[entity.class_1, entity.class_2].filter(Boolean).map(className => (
                                    <View key={className} style={styles.inputWithLabel}>
                                        <Text style={styles.inputHeader}>{className}</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            value={employeeHours[entity.id]?.[selectedPhase!]?.[className!] || ''}
                                            onChangeText={(text) => handleEmployeeHourChange(entity.id, selectedPhase!, className!, text)}
                                        />
                                    </View>
                                ))}
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
                            <View style={styles.totalBox}><Text style={styles.totalText}>{phaseTotals[phase]?.toFixed(1) || '0.0'}</Text></View>
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
    const isMaterial = type === 'material';
    const isVendor = type === 'vendor';

    const phaseCodes = timesheet?.data.job.phase_codes || [];
    const hourTotals = isEquipment ? calculateComplexPhaseTotals(equipmentHours, phaseCodes)
      : (isMaterial ? calculateSimplePhaseTotals(materialHours, phaseCodes) : {});
    const quantityTotals = isMaterial ? calculateSimplePhaseTotals(materialQuantities, phaseCodes)
      : (isVendor ? calculateSimplePhaseTotals(vendorQuantities, phaseCodes) : {});
    
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        {entities.map((entity, index) => {
          const totalHours = isEquipment ? calculateTotalComplex(equipmentHours, entity.id)
            : (isMaterial ? calculateTotalSimple(materialHours, entity.id) : 0);
          
          const name = isEquipment ? `${entity.id} - ${entity.name}` : entity.name;
          const isLast = index === entities.length - 1 && !isEquipment;

          const currentPhaseHours = parseFloat(materialHours[entity.id]?.[selectedPhase!] || '0') || 0;
          const currentPhaseQty = parseFloat(materialQuantities[entity.id]?.[selectedPhase!] || '0') || 0;
          const laborRate = currentPhaseQty > 0 ? (currentPhaseHours / currentPhaseQty).toFixed(2) : 'N/A';
          
          return (
            <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
              <Text style={styles.inputLabel}>{name}</Text>
              <View style={[styles.controlsRow, { marginBottom: isMaterial || isVendor ? 10 : 0 }]}>
                {isEquipment ? (
                    <>
                      <View style={{ flex: 1 }} />
                      <View style={styles.hoursContainer}>
                          <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>REG</Text>
                            <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={equipmentHours[entity.id]?.[selectedPhase!]?.REG || ''} onChangeText={(text) => handleEquipmentHourChange(entity.id, selectedPhase!, 'REG', text)} />
                          </View>
                          <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>S.B</Text>
                            <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={equipmentHours[entity.id]?.[selectedPhase!]?.['S.B'] || ''} onChangeText={(text) => handleEquipmentHourChange(entity.id, selectedPhase!, 'S.B', text)} />
                          </View>
                          <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>Total Hrs</Text>
                            <View style={styles.totalBox}><Text style={styles.totalText}>{totalHours.toFixed(1)}</Text></View>
                          </View>
                      </View>
                      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveEquipment(entity.id)}>
                        <Text style={styles.removeButtonText}>X</Text>
                      </TouchableOpacity>
                    </>
                ) : (
                  <>
                    <View style={styles.hoursContainer}>
                      {isMaterial && (
                          <View style={styles.inputWithLabel}>
                              <Text style={styles.inputHeader}>Hours</Text>
                              <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={materialHours[entity.id]?.[selectedPhase!] || ''} onChangeText={(text) => handleMaterialVendorChange('material', 'quantity', entity.id, text, selectedPhase!)} />
                          </View>
                      )}
                      <View style={styles.inputWithLabel}>
                          <Text style={styles.inputHeader}>Quantity</Text>
                          <TextInput style={styles.input} keyboardType="numeric" placeholder="0" 
                            value={(isMaterial ? materialQuantities : vendorQuantities)[entity.id]?.[selectedPhase!] || ''}
                            onChangeText={(text) => handleMaterialVendorChange(type, 'quantity', entity.id, text, selectedPhase!)}
                          />
                      </View>
                      {isMaterial && (
                        <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>Labor</Text>
                            <View style={styles.totalBox}><Text style={styles.totalText}>{laborRate}</Text></View>
                        </View>
                      )}
                    </View>
                    <View style={{ width: 44, marginLeft: 10 }} />
                  </>
                )}
              </View>

              {(isMaterial || isVendor) && (
                <View style={styles.unitDropdownContainer}>
                    <Dropdown
                        style={[styles.dropdown, { flex: 1 }]}
                        data={isMaterial ? MATERIAL_UNITS : VENDOR_UNITS}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Unit"
                        value={(isMaterial ? materialUnits : vendorUnits)[entity.id]}
                        onChange={(item) => handleMaterialVendorChange(type, 'unit', entity.id, item.value)}
                    />
                </View>
              )}
            </View>
          );
        })}

        {(isMaterial || isEquipment) &&
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Hours:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
              {phaseCodes.map(p => <View key={`${p}-h`} style={styles.totalPhaseItem}><Text style={styles.totalPhaseHeader}>{p}</Text><View style={styles.totalBox}><Text style={styles.totalText}>{hourTotals[p]?.toFixed(1) || '0.0'}</Text></View></View>)}
            </ScrollView>
          </View>
        }
        {(isMaterial || isVendor) &&
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Qty:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
              {phaseCodes.map(p => <View key={`${p}-q`} style={styles.totalPhaseItem}><Text style={styles.totalPhaseHeader}>{p}</Text><View style={styles.totalBox}><Text style={styles.totalText}>{quantityTotals[p]?.toFixed(1) || '0.0'}</Text></View></View>)}
            </ScrollView>
          </View>
        }

        {isEquipment && (
          <View style={styles.addEquipmentRow}>
            <Dropdown style={[styles.dropdown, { flex: 1 }]}
              data={availableEquipment.filter(eq => !timesheet?.data.equipment.some(e => e.id === eq.id)).map(eq => ({ label: `${eq.id} - ${eq.name}`, value: eq.id }))}
              labelField="label" valueField="value" placeholder="Select equipment to add" value={null} onChange={handleAddEquipment}
              maxHeight={200} search searchPlaceholder="Search..."
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Text style={styles.jobTitle}>{data.job_name}</Text>
          <Text style={styles.jobCode}>Job Code: {data.job.job_code}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Date</Text><TouchableOpacity onPress={() => setDatePickerVisible(true)}><Text style={styles.infoValueClickable}>{timesheetDate.toLocaleDateString()}</Text></TouchableOpacity></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Foreman</Text><Text style={styles.infoValue}>{foremanName}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Project Engineer</Text><Text style={styles.infoValue}>{data.project_engineer || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Day</Text><Text style={styles.infoValue}>{data.time_of_day || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{data.location || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Weather</Text><Text style={styles.infoValue}>{data.weather || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Temperature</Text><Text style={styles.infoValue}>{data.temperature || 'N/A'}</Text></View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelectorContainer}>
          {data.job.phase_codes.map((phase) => (
            <TouchableOpacity key={phase} style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]} onPress={() => setSelectedPhase(phase)}>
              <Text style={[styles.phaseButtonText, selectedPhase === phase && styles.selectedPhaseButtonText]}>{phase}</Text>
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
              <TextInput style={[styles.input, styles.quantityInput]} keyboardType="numeric" placeholder="Enter quantity" value={totalQuantities[selectedPhase] || ''} onChangeText={(text) => handleTotalQuantityChange(selectedPhase, text)} />
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <TextInput style={styles.notesInput} multiline maxLength={300} placeholder="Enter any notes for this timesheet..." value={notes} onChangeText={setNotes} />
          <Text style={styles.characterCount}>{`${notes.length} / 300`}</Text>
        </View>

      </ScrollView>

      <DatePicker modal open={isDatePickerVisible} date={timesheetDate} mode="date" onConfirm={(d) => { setDatePickerVisible(false); setTimesheetDate(d); }} onCancel={() => setDatePickerVisible(false)} />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: THEME.primary, marginRight: THEME.SPACING/2 }]} onPress={() => handleSave()} disabled={isSubmitting}><Text style={styles.buttonText}>Save Draft</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: THEME.success, marginLeft: THEME.SPACING/2 }]} onPress={handleSubmit} disabled={isSubmitting}><Text style={styles.buttonText}>{isSubmitting ? 'Submitting...' : 'Submit Timesheet'}</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    scrollContent: { padding: THEME.SPACING, paddingBottom: 100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    infoCard: { padding: THEME.SPACING, backgroundColor: THEME.card, borderRadius: 14, marginBottom: THEME.SPACING, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
    jobTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
    jobCode: { fontSize: 16, color: THEME.textSecondary, marginTop: 4 },
    infoGrid: { marginTop: THEME.SPACING, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    infoItem: { width: '48%', marginBottom: 8 },
    infoLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
    infoValue: { fontSize: 16, fontWeight: '500', color: THEME.text },
    infoValueClickable: { fontSize: 16, fontWeight: '500', color: THEME.primary },
    phaseSelectorContainer: { marginVertical: THEME.SPACING / 2 },
    phaseButton: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderRadius: 20, backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border },
    selectedPhaseButton: { backgroundColor: THEME.primary, borderColor: THEME.primary, shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
    phaseButtonText: { color: THEME.text, fontWeight: '600', fontSize: 16 },
    selectedPhaseButtonText: { color: '#FFF' },
    card: { backgroundColor: THEME.card, borderRadius: 14, padding: THEME.SPACING, marginBottom: THEME.SPACING, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: THEME.border },
    entityContainer: { paddingVertical: THEME.SPACING, borderBottomWidth: 1, borderBottomColor: THEME.border },
    lastEntityContainer: { borderBottomWidth: 0, paddingBottom: 0 },
    inputLabel: { fontSize: 18, color: THEME.text, marginBottom: 12, fontWeight: '600' },
    employeeName: { fontSize: 16, color: THEME.text, marginBottom: 12, fontWeight: '600' },
    controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    hoursContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', flexWrap: 'wrap' },
    inputWithLabel: { alignItems: 'center', marginLeft: 8 },
    inputHeader: { fontSize: 13, color: THEME.textSecondary, marginBottom: 4, fontWeight: '500' },
    input: { borderWidth: 1.5, borderColor: THEME.border, borderRadius: 10, paddingHorizontal: 10, height: 48, width: 65, textAlign: 'center', fontSize: 16, fontWeight: '500', color: THEME.text, backgroundColor: THEME.lightGray },
    totalBox: { backgroundColor: THEME.background, borderRadius: 10, height: 48, width: 70, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
    totalText: { fontSize: 16, fontWeight: 'bold', color: THEME.text },
    dropdown: { height: 48, borderColor: THEME.border, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, backgroundColor: THEME.lightGray },
    unitDropdownContainer: { marginTop: 10 },
    removeButton: { marginLeft: 10, width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: `${THEME.danger}1A` },
    removeButtonText: { color: THEME.danger, fontWeight: 'bold', fontSize: 20 },
    addEquipmentRow: { marginTop: THEME.SPACING, borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: THEME.SPACING },
    quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    quantityLabel: { fontSize: 16, fontWeight: '500', color: THEME.text },
    quantityInput: { width: 150 },
    totalsRow: { flexDirection: 'row', alignItems: 'center', marginTop: THEME.SPACING, paddingTop: THEME.SPACING, borderTopWidth: 1, borderTopColor: THEME.border },
    totalsLabel: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginRight: 10 },
    totalsContainer: { flexDirection: 'row' },
    totalPhaseItem: { alignItems: 'center', marginHorizontal: 4 },
    totalPhaseHeader: { fontSize: 12, color: THEME.textSecondary, marginBottom: 4 },
    footer: { padding: THEME.SPACING, backgroundColor: THEME.card, borderTopWidth: 1, borderTopColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5, flexDirection: 'row', justifyContent: 'space-between' },
    button: { padding: THEME.SPACING, borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 56, flex: 1 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    notesInput: { borderWidth: 1.5, borderColor: THEME.border, borderRadius: 10, padding: 12, height: 100, textAlignVertical: 'top', fontSize: 16, color: THEME.text, backgroundColor: THEME.lightGray },
    characterCount: { fontSize: 12, color: THEME.textSecondary, textAlign: 'right', marginTop: 4 },
});

export default TimesheetEditScreen;
