// /src/navigation/AppNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import ForemanDashboard from '../screens/foreman/ForemanDashboard';
import TimesheetListScreen from '../screens/foreman/TimesheetListScreen';
import TimesheetEditScreen from '../screens/foreman/TimesheetEditScreen';
import ScanTicket from '../screens/foreman/ScanTicket';


// --- Updated Param List ---
export type ForemanStackParamList = {
  ForemanDashboard: undefined;
  TimesheetList: undefined;
  TimesheetEdit: { timesheetId: number };
  Timesheet: undefined;
  ScanTicket: undefined; 
};

export type RootStackParamList = {
    Login: undefined;
    Foreman: undefined; 
};

const ForemanStack = createStackNavigator<ForemanStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const ForemanNavigator = () => (
    <ForemanStack.Navigator>
        <ForemanStack.Screen 
            name="ForemanDashboard" 
            component={ForemanDashboard} 
            options={{ headerShown: false }}
        />
        <ForemanStack.Screen 
            name="TimesheetList" 
            component={TimesheetListScreen}
            options={{ title: 'Pending Timesheets' }}
        />
        <ForemanStack.Screen 
            name="TimesheetEdit" 
            component={TimesheetEditScreen} 
            options={{ title: 'Enter Hours' }}
        />
        
        <ForemanStack.Screen
  name="ScanTicket"
  component={ScanTicket}
  options={{ title: 'Scan Ticket' }}
/>

    </ForemanStack.Navigator>
);

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <RootStack.Navigator>
      {!user ? (
        <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          {user.role === 'foreman' && (
            <RootStack.Screen name="Foreman" component={ForemanNavigator} options={{ headerShown: false }} />
          )}
        </>
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
