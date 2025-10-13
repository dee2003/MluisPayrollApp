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
  const [selectedEquipToAdd, setSelectedEquipToAdd] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch timesheet and equipment list
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

        // Fetch full equipment list
        const eqRes = await apiClient.get('/api/equipment');
        setAvailableEquipment(eqRes.data);

        // Fetch foreman name
        const res = await apiClient.get(`/api/users/${tsData.foreman_id}`);
        setForemanName(`${res.data.first_name} ${res.data.middle_name || ''} ${res.data.last_name}`.trim());
      } catch (error) {
        console.error(error);
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

  // Remove equipment
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

  // Add equipment
  const handleAddEquipment = () => {
    if (!selectedEquipToAdd || !timesheet) return;
    const eq = availableEquipment.find((e) => e.id === selectedEquipToAdd);
    if (!eq) return;

    // check if already added
    if (timesheet.data.equipment.some(e => e.id === eq.id)) return;

    setTimesheet((ts) => {
      if (!ts) return ts;
      return {
        ...ts,
        data: {
          ...ts.data,
          equipment: [...ts.data.equipment, eq],
        },
      };
    });
    setEquipmentHours((prev) => ({ ...prev, [eq.id]: {} }));
    setSelectedEquipToAdd(null);
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
        materials: timesheet.data.materials,
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
            value={selectedEquipToAdd}
            onChange={(item) => setSelectedEquipToAdd(item.value)}
            maxHeight={150}
  search={true}               // <-- Correct prop for enabling search
            searchPlaceholder="Search equipment"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddEquipment}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Timesheet info details */}
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
        {/* Phase selection */}
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
        {/* Entity Inputs */}
        {selectedPhase && (
          <View style={styles.contentArea}>
            {renderEntityInputs('Employees', data.employees, employeeHours, 'employee')}
            {renderEntityInputs('Equipment', data.equipment, equipmentHours, 'equipment')}
            {renderEntityInputs('Materials', data.materials, materialHours, 'material')}
            {renderEntityInputs('Vendors', data.vendors, vendorHours, 'vendor')}
          </View>
        )}
      </ScrollView>
      {/* Save button */}
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  infoCard: { padding: 16, backgroundColor: COLORS.card, borderRadius: 12, marginBottom: 12 },
  jobTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: COLORS.text },
  jobCode: { fontSize: 16, color: COLORS.textSecondary },
  infoText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },

  contentArea: { paddingBottom: 20 },

  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: COLORS.text },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  inputLabel: { flex: 1, fontSize: 16, color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    marginLeft: 8,
  },

  dropdown: {
    height: 30,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },

  removeButton: {
    marginLeft: 8,
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  addEquipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.card,
    fontWeight: 'bold',
  },

  phaseButton: { paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderRadius: 8, backgroundColor: '#ddd' },
  selectedPhaseButton: { backgroundColor: COLORS.primary },
  phaseButtonText: { color: COLORS.text },
  selectedPhaseButtonText: { color: '#fff', fontWeight: 'bold' },

  submitButton: { backgroundColor: COLORS.success, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: COLORS.card, fontWeight: 'bold', fontSize: 16 },
});

export default TimesheetEditScreen;
