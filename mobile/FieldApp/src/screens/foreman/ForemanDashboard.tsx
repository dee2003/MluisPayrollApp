// // /src/screens/foreman/ForemanDashboard.tsx

// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
// import { useAuth } from '../../context/AuthContext';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { ForemanStackParamList } from '../../navigation/AppNavigator';

// type DashboardNavigationProp = StackNavigationProp<ForemanStackParamList, 'ForemanDashboard'>;

// const ForemanDashboard = ({ navigation }: { navigation: DashboardNavigationProp }) => {
//   const { user, logout } = useAuth();

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
//         <TouchableOpacity onPress={logout}>
//             <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>
//       <View style={styles.content}>
//         <TouchableOpacity 
//           style={styles.button}
//           onPress={() => navigation.navigate('TimesheetList')}
//         >
//           <Text style={styles.buttonText}>View My Timesheets</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f0f2f5' },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
//   welcomeText: { fontSize: 22, fontWeight: 'bold' },
//   logoutText: { fontSize: 16, color: '#ff6347' },
//   content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   button: { backgroundColor: '#007bff', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, elevation: 3 },
//   buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
// });

// export default ForemanDashboard;
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { ForemanStackParamList } from '../../navigation/AppNavigator';

// Define the navigation prop specific to this screen
type DashboardNavigationProp = StackNavigationProp<ForemanStackParamList, 'ForemanDashboard'>;

/**
 * ForemanDashboard component serves as the landing page for Foreman users.
 * It provides a welcome message and a main navigation button to the Timesheet List.
 */
const ForemanDashboard = ({ navigation }: { navigation: DashboardNavigationProp }) => {
  // Assuming useAuth provides user details (like username) and a logout function
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
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
  container: { 
    flex: 1, 
    backgroundColor: '#f0f2f5' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: { 
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 5,
  },
  logoutText: { 
    fontSize: 16, 
    color: '#ff6347',
    fontWeight: '600',
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  button: { 
    backgroundColor: '#007bff', 
    paddingVertical: 18, 
    paddingHorizontal: 40, 
    borderRadius: 12, 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});

export default ForemanDashboard;
