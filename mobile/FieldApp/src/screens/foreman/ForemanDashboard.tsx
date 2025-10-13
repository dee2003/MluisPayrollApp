// /src/screens/foreman/ForemanDashboard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { ForemanStackParamList } from '../../navigation/AppNavigator';

type DashboardNavigationProp = StackNavigationProp<ForemanStackParamList, 'ForemanDashboard'>;

const ForemanDashboard = ({ navigation }: { navigation: DashboardNavigationProp }) => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Existing button */}
        <TouchableOpacity
  style={[styles.button, { backgroundColor: '#28a745', marginTop: 20 }]}
  onPress={() => navigation.navigate('ScanTicket')}
>
  <Text style={styles.buttonText}>Scan Ticket</Text>
</TouchableOpacity>


        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('TimesheetList')}
        >
          <Text style={styles.buttonText}>View My Timesheets</Text>
        </TouchableOpacity>

        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  welcomeText: { fontSize: 22, fontWeight: 'bold' },
  logoutText: { fontSize: 16, color: '#ff6347' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#007bff', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, elevation: 3 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default ForemanDashboard;
