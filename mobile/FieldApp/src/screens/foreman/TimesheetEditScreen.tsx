// /src/screens/foreman/TimesheetEditScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../api/apiClient';
import { Timesheet } from '../../types';
import { ForemanStackParamList } from '../../navigation/AppNavigator';

// Helper component for displaying details neatly
const DetailRow = ({ label, value }: { label: string; value?: string | string[] }) => {
  if (value === undefined || value === null || value.length === 0) return null;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{displayValue}</Text>
    </View>
  );
};

type EditScreenRouteProp = RouteProp<ForemanStackParamList, 'TimesheetEdit'>;
type EditScreenNavigationProp = StackNavigationProp<ForemanStackParamList, 'TimesheetEdit'>;
type Props = { route: EditScreenRouteProp; navigation: EditScreenNavigationProp; };

const TimesheetEditScreen = ({ route, navigation }: Props) => {
  const { timesheetId } = route.params;
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [employeeHours, setEmployeeHours] = useState<Record<string, string>>({});
  const [equipmentHours, setEquipmentHours] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditable = timesheet?.status === 'Pending';

  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
        const tsData = response.data;
        setTimesheet(tsData);
        navigation.setOptions({ title: tsData.data.job_name });

        // --- FIX: Pre-populate the hour fields ---
        const initialEmpHours: Record<string, string> = {};
        tsData.data.employees.forEach(emp => {
          const key = `${emp.first_name} ${emp.last_name}`;
          initialEmpHours[key] = emp.hours?.toString() || '';
        });
        setEmployeeHours(initialEmpHours);

        const initialEquipHours: Record<string, string> = {};
        tsData.data.equipment.forEach(eq => {
          initialEquipHours[eq.name] = eq.hours?.toString() || '';
        });
        setEquipmentHours(initialEquipHours);

      } catch (error) { Alert.alert("Error", "Could not load timesheet details."); } 
      finally { setLoading(false); }
    };
    fetchTimesheet();
  }, [timesheetId, navigation]);
  
  // This function now correctly updates the state, allowing the input to be edited
  const handleHourChange = (type: 'employee' | 'equipment', key: string, value: string) => {
    const setter = type === 'employee' ? setEmployeeHours : setEquipmentHours;
    setter(prev => ({ ...prev, [key]: value.replace(/[^0-9.]/g, '') }));
  };

  const handleSubmit = async () => {
    if (!timesheet) return;
    setIsSubmitting(true);
    
    const updatedData = { ...timesheet.data };
    updatedData.employees = timesheet.data.employees.map(emp => ({ ...emp, hours: parseFloat(employeeHours[`${emp.first_name} ${emp.last_name}`] || '0') }));
    updatedData.equipment = timesheet.data.equipment.map(eq => ({ ...eq, hours: parseFloat(equipmentHours[eq.name] || '0') }));

    const payload = { data: updatedData, status: 'Submitted' as const };

    try {
      await apiClient.put(`/api/timesheets/${timesheet.id}`, payload);
      Alert.alert("Success", "Timesheet has been submitted.");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to submit timesheet.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!timesheet) return <View><Text>Timesheet not found.</Text></View>;

  const { data, date, foreman_name } = timesheet;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>{data.job_name}</Text>
        <DetailRow label="Date" value={new Date(date).toLocaleDateString()} />
        <DetailRow label="Project Engineer" value={data.project_engineer} />
        <DetailRow label="Phase Codes" value={data.job.phase_codes} />
        <DetailRow label="Foreman" value={foreman_name} />
      </View>
      
      <View style={styles.card}>
        <DetailRow label="Weather" value={data.weather} />
        <DetailRow label="Temperature" value={data.temperature} />
        <DetailRow label="Time of Day" value={data.time_of_day} />
        <DetailRow label="Shift" value={data.shift} /> 
      </View>

      <View style={styles.card}>
        <Text style={styles.headerTitle}>{isEditable ? 'Enter Daily Hours' : 'Recorded Hours'}</Text>
        
        <Text style={styles.sectionTitle}>Employees</Text>
        {data.employees.map((emp, index) => {
          const key = `${emp.first_name} ${emp.last_name}`;
          return (
            <View key={`emp-${index}`} style={styles.inputRow}>
              <Text style={styles.inputLabel}>{key}</Text>
              <TextInput
                style={[styles.input, !isEditable && styles.readOnlyInput]}
                placeholder="0"
                keyboardType="numeric"
                value={employeeHours[key]} // FIX: Directly use the state value
                onChangeText={text => handleHourChange('employee', key, text)}
                editable={isEditable}
              />
            </View>
          );
        })}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Equipment</Text>
        {data.equipment.map((eq, index) => {
          return (
            <View key={`eq-${index}`} style={styles.inputRow}>
              <Text style={styles.inputLabel}>{eq.name}</Text>
              <TextInput
                style={[styles.input, !isEditable && styles.readOnlyInput]}
                placeholder="0"
                keyboardType="numeric"
                value={equipmentHours[eq.name]} // FIX: Directly use the state value
                onChangeText={text => handleHourChange('equipment', eq.name, text)}
                editable={isEditable}
              />
            </View>
          );
        })}
      </View>

      {/* --- NEW: Materials and Vendors Section --- */}
      <View style={styles.card}>
        <Text style={styles.headerTitle}>Resources</Text>
        <DetailRow label="Materials" value={data.materials?.map(m => m.name)} />
        <DetailRow label="Vendors" value={data.vendors?.map(v => v.name)} />
      </View>
      
      {isEditable && (
        <View style={styles.buttonContainer}>
          <Button title={isSubmitting ? "Submitting..." : "Send to Supervisor"} onPress={handleSubmit} disabled={isSubmitting} />
        </View>
      )}
    </ScrollView>
  );
};

// ... (Styles remain the same)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginHorizontal: 10, marginVertical: 8, elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    label: { fontSize: 15, color: '#555', fontWeight: '600' },
    value: { fontSize: 15, color: '#333', flex: 1, textAlign: 'right' },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    inputLabel: { fontSize: 16, flex: 1 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, paddingVertical: 8, paddingHorizontal: 12, width: 80, textAlign: 'center' },
    readOnlyInput: { backgroundColor: '#f0f0f0', color: '#555' },
    buttonContainer: { margin: 20, marginBottom: 40 }
});


export default TimesheetEditScreen;
