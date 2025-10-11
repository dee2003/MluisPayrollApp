// /src/screens/foreman/TimesheetEditScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../api/apiClient';
import { Timesheet } from '../../types';
import { ForemanStackParamList } from '../../navigation/AppNavigator';

const DetailSection = ({ title, content }: { title: string; content?: string | string[] }) => {
  if (!content || (Array.isArray(content) && content.length === 0)) return null;
  return (
    <View style={styles.detailSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.itemText}>{Array.isArray(content) ? content.join(', ') : content}</Text>
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
      setLoading(true);
      try {
        const response = await apiClient.get<Timesheet>(`/api/timesheets/${timesheetId}`);
        setTimesheet(response.data);
        navigation.setOptions({ title: response.data.data.job_name });
      } catch (error) { Alert.alert("Error", "Could not load timesheet details."); } 
      finally { setLoading(false); }
    };
    fetchTimesheet();
  }, [timesheetId, navigation]);

  // --- FIX: Re-added the missing function ---
  const handleHourChange = (type: 'employee' | 'equipment', name: string, value: string) => {
    const setter = type === 'employee' ? setEmployeeHours : setEquipmentHours;
    setter(prev => ({ ...prev, [name]: value.replace(/[^0-9.]/g, '') }));
  };

  const handleSubmit = async () => {
    if (!timesheet) return;

    setIsSubmitting(true);
    const updatedData = { ...timesheet.data };
    updatedData.employees = timesheet.data.employees.map(emp => ({ ...emp, hours: parseFloat(employeeHours[`${emp.first_name} ${emp.last_name}`] || '0') }));
    updatedData.equipment = timesheet.data.equipment.map(eq => ({ ...eq, hours: parseFloat(equipmentHours[eq.name] || '0') }));

    const payload = { ...timesheet, data: updatedData, status: 'Submitted' as const };

    try {
      await apiClient.put(`/api/timesheets/${timesheet.id}`, payload);
      Alert.alert("Success", "Timesheet submitted to supervisor.");
      navigation.navigate('ForemanDashboard');
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to submit timesheet.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!timesheet) return <Text style={{ textAlign: 'center', marginTop: 20 }}>Timesheet not found.</Text>;

  const { data, date } = timesheet;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>Timesheet Details</Text>
        <DetailSection title="Job Code" content={data.job.job_code} />
        <DetailSection title="Date" content={new Date(date).toLocaleDateString()} />
        <DetailSection title="Location" content={data.location} />
        <DetailSection title="Status" content={timesheet.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.headerTitle}>{isEditable ? 'Enter Daily Hours' : 'Recorded Hours'}</Text>
        <Text style={styles.sectionTitle}>Employees</Text>
        {data.employees.map((emp, index) => {
          const name = `${emp.first_name} ${emp.last_name}`;
          return (
            <View key={`emp-${index}`} style={styles.row}>
              <Text style={styles.label}>{name}</Text>
              <TextInput
                style={[styles.input, !isEditable && styles.readOnlyInput]}
                placeholder="Hours"
                keyboardType="numeric"
                value={isEditable ? (employeeHours[name] || '') : emp.hours?.toString() || '0'}
                onChangeText={text => handleHourChange('employee', name, text)}
                editable={isEditable}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Equipment</Text>
        {data.equipment.map((eq, index) => (
          <View key={`eq-${index}`} style={styles.row}>
            <Text style={styles.label}>{eq.name}</Text>
            <TextInput
              style={[styles.input, !isEditable && styles.readOnlyInput]}
              placeholder="Hours"
              keyboardType="numeric"
              value={isEditable ? (equipmentHours[eq.name] || '') : eq.hours?.toString() || '0'}
              onChangeText={text => handleHourChange('equipment', eq.name, text)}
              editable={isEditable}
            />
          </View>
        ))}
      </View>
      
      {isEditable && (
        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <Button title={isSubmitting ? "Submitting..." : "Send to Supervisor"} onPress={handleSubmit} disabled={isSubmitting} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f2f5' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  detailSection: { marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  itemText: { fontSize: 15, color: '#555' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  label: { fontSize: 16, flex: 1 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, width: 80, textAlign: 'center' },
  readOnlyInput: { backgroundColor: '#f0f0f0', color: '#555' }
});

export default TimesheetEditScreen;
