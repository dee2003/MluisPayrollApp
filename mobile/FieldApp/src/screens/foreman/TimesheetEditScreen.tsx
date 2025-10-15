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
import apiClient from '../../api/apiClient';
import { Timesheet } from '../../types';
import { ForemanStackParamList } from '../../navigation/AppNavigator';
import { Dropdown } from 'react-native-element-dropdown';


type HourState = Record<string, Record<string, string>>;
type EditScreenRouteProp = RouteProp<ForemanStackParamList, 'TimesheetEdit'>;
type EditScreenNavigationProp = StackNavigationProp<ForemanStackParamList, 'TimesheetEdit'>;


type Props = {
  route: EditScreenRouteProp;
  navigation: EditScreenNavigationProp;
};


const COLORS = {
  primary: '#007AFF',
  success: '#34C759',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#636366',
  border: '#D1D1D6',
};


const TimesheetEditScreen = ({ route, navigation }: Props) => {
  const { timesheetId } = route.params;


  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [foremanName, setForemanName] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);


  const [employeeHours, setEmployeeHours] = useState<HourState>({});
  const [equipmentHours, setEquipmentHours] = useState<HourState>({});
  const [materialHours, setMaterialHours] = useState<HourState>({});
  const [vendorHours, setVendorHours] = useState<HourState>({});


  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
        const tsData = response.data;
        setTimesheet(tsData);
        navigation.setOptions({ title: `${tsData.data.job_name} - Edit` });
        if (tsData.data.job.phase_codes?.length > 0)
          setSelectedPhase(tsData.data.job.phase_codes[0]);


        const populateHours = (entities: any[] = []) => {
          const state: HourState = {};
          entities.forEach((entity) => {
            state[entity.id] = {};
            if (entity.hours_per_phase) {
              for (const phase in entity.hours_per_phase) {
                state[entity.id][phase] = entity.hours_per_phase[phase].toString();
              }
            }
          });
          return state;
        };


        setEmployeeHours(populateHours(tsData.data.employees));
        setEquipmentHours(populateHours(tsData.data.equipment));
        setMaterialHours(populateHours(tsData.data.materials));
        setVendorHours(populateHours(tsData.data.vendors));


        const eqRes = await apiClient.get('/api/equipment');
        setAvailableEquipment(eqRes.data);


        const res = await apiClient.get(`/api/users/${tsData.foreman_id}`);
        setForemanName(`${res.data.first_name} ${res.data.middle_name || ''} ${res.data.last_name}`.trim());
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load timesheet data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timesheetId, navigation]);


  const handleHourChange = (type: 'employee' | 'equipment' | 'material' | 'vendor', entityId: string, phaseCode: string, value: string) => {
    const setters = { employee: setEmployeeHours, equipment: setEquipmentHours, material: setMaterialHours, vendor: setVendorHours };
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    setters[type]((prev) => ({ ...prev, [entityId]: { ...prev[entityId], [phaseCode]: sanitizedValue } }));
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


  // MODIFIED: Combines selection and adding into one step
  const handleAddEquipment = (item: any) => {
    if (!item || !item.id || !timesheet) return;


    const equipmentToAdd = item;


    if (timesheet.data.equipment.some(e => e.id === equipmentToAdd.id)) {
        Alert.alert("Duplicate", "This equipment has already been added.");
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
      const updatedData = {
        ...timesheet.data,
        employees: updatedEmployees,
        equipment: updatedEquipment,
        materials: timesheet.data.materials, // Assuming materials/vendors don't have hours edited this way
        vendors: timesheet.data.vendors,
      };
      await apiClient.put(`/api/timesheets/${timesheet.id}`, { data: updatedData });
      Alert.alert('Success', 'Timesheet saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save timesheet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderEntityInputs = (
    title: string,
    entities: any[],
    hoursState: HourState,
    type: 'employee' | 'equipment' | 'material' | 'vendor'
  ) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {entities.map((entity) => (
        <View key={entity.id} style={styles.inputRow}>
          <Text style={styles.inputLabel}>
            {entity.first_name
              ? `${entity.first_name} ${entity.middle_name || ''} ${entity.last_name}`
              : entity.name}
          </Text>
          {type === 'employee' && (
            <Dropdown
              style={styles.dropdown}
              containerStyle={{ flex: 1 }}
              data={[
                ...(entity.class_1 ? [{ label: entity.class_1, value: entity.class_1 }] : []),
                ...(entity.class_2 ? [{ label: entity.class_2, value: entity.class_2 }] : []),
              ]}
              labelField="label"
              valueField="value"
              placeholder="Select Class"
              value={entity.selected_class || undefined}
              selectedTextStyle={{ fontSize: 16 }}
              placeholderStyle={{ fontSize: 16, color: COLORS.textSecondary }}
              maxHeight={100}
              renderItem={(item) => (
                <View style={{ padding: 12 }}>
                  <Text style={{ fontSize: 16 }}>{item.label}</Text>
                </View>
              )}
              onChange={(item) => {
                setTimesheet((ts) => {
                  if (!ts) return ts;
                  const updatedEmployees = ts.data.employees.map((emp) => {
                    if (emp.id === entity.id) return { ...emp, selected_class: item.value };
                    return emp;
                  });
                  return { ...ts, data: { ...ts.data, employees: updatedEmployees } };
                });
              }}
            />
          )}
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            value={hoursState[entity.id]?.[selectedPhase!] || ''}
            onChangeText={(text) => handleHourChange(type, entity.id, selectedPhase!, text)}
          />
          {type === 'equipment' && (
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveEquipment(entity.id)}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      {type === 'equipment' && (
        <View style={styles.addEquipmentRow}>
          <Dropdown
            style={[styles.dropdown, { flex: 1 }]}
            data={availableEquipment.filter(eq => !timesheet?.data.equipment.some(e => e.id === eq.id))}
            labelField="name"
            valueField="id"
            placeholder="Select equipment to add"
            value={null} // Keep as null to act as a button
            onChange={handleAddEquipment} // MODIFIED: Directly calls the add handler
            maxHeight={150}
            search={true}
            searchPlaceholder="Search equipment..."
          />
        </View>
      )}
    </View>
  );


  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!timesheet)
    return (
      <View style={styles.centered}>
        <Text>Timesheet not found</Text>
      </View>
    );


  const { data, date } = timesheet;
const handleSend = async () => {
  if (!timesheet) return;
  setIsSubmitting(true);
  try {
    await apiClient.post(`/api/timesheets/${timesheet.id}/send`);
    Alert.alert('Success', 'Timesheet sent to supervisor!');
  } catch (error) {
    console.error('Send failed:', error);
    Alert.alert('Error', 'Failed to send timesheet.');
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
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


        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {data.job.phase_codes.map((phase) => (
            <TouchableOpacity
              key={phase}
              style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]}
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
          <View style={styles.contentArea}>
            {renderEntityInputs('Employees', data.employees, employeeHours, 'employee')}
            {renderEntityInputs('Equipment', data.equipment, equipmentHours, 'equipment')}
            {renderEntityInputs('Materials', data.materials, materialHours, 'material')}
            {renderEntityInputs('Vendors', data.vendors, vendorHours, 'vendor')}
          </View>
        )}
      </ScrollView>


      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.card} />
          ) : (
            <Text style={styles.submitButtonText}>Save Timesheet</Text>
          )}
        </TouchableOpacity>
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


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1, padding: 10 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoCard: {
        padding: 16,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        marginBottom: 12,
    },
    jobTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    jobCode: { fontSize: 16, color: COLORS.textSecondary },
    infoText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
    contentArea: { paddingBottom: 20 },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        minHeight: 40, // Ensure consistent row height
    },
    inputLabel: { flex: 1, fontSize: 16, color: COLORS.text },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        width: 70,
        textAlign: 'center',
        fontSize: 16,
        marginLeft: 8,
    },
    dropdown: {
        height: 40,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginLeft: 8,
        minWidth: 120, // Give dropdown more space
    },
    removeButton: {
        marginLeft: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FF3B30',
        borderRadius: 8,
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    addEquipmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12,
    },
    addButton: {
        marginLeft: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: COLORS.card,
        fontWeight: 'bold',
        fontSize: 16,
    },
    phaseButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedPhaseButton: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    phaseButtonText: {
        color: COLORS.text,
        fontWeight: '500',
    },
    selectedPhaseButtonText: {
        color: COLORS.card,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: COLORS.success,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: COLORS.card,
        fontWeight: 'bold',
        fontSize: 18,
    },
});


export default TimesheetEditScreen;
