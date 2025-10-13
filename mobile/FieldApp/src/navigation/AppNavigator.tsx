import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import ForemanDashboard from '../screens/foreman/ForemanDashboard';
import TimesheetListScreen from '../screens/foreman/TimesheetListScreen';
import TimesheetEditScreen from '../screens/foreman/TimesheetEditScreen';
import SupervisorDashboard from '../screens/supervisor/SupervisorDashboard';
import TimesheetViewScreen from '../screens/supervisor/TimesheetViewScreen';

// -------------------- Foreman Stack --------------------
export type ForemanStackParamList = {
  ForemanDashboard: undefined;
  TimesheetList: undefined;
  TimesheetEdit: { timesheetId: number };
};

const ForemanStack = createStackNavigator<ForemanStackParamList>();

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
  </ForemanStack.Navigator>
);

// -------------------- Supervisor Stack --------------------
export type SupervisorStackParamList = {
  SupervisorDashboard: undefined;
  TimesheetView: { timesheetId: number };
};

const SupervisorStack = createStackNavigator<SupervisorStackParamList>();

const SupervisorNavigator = () => (
  <SupervisorStack.Navigator>
    <SupervisorStack.Screen
      name="SupervisorDashboard"
      component={SupervisorDashboard}
      options={{ headerShown: false }}
    />
    <SupervisorStack.Screen
      name="TimesheetView"
      component={TimesheetViewScreen}
      options={{ title: 'Timesheet Details' }}
    />
  </SupervisorStack.Navigator>
);

// -------------------- Root Stack --------------------
export type RootStackParamList = {
  Login: undefined;
  Foreman: undefined;
  Supervisor: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <RootStack.Navigator>
      {!user ? (
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          {user.role === 'foreman' && (
            <RootStack.Screen
              name="Foreman"
              component={ForemanNavigator}
              options={{ headerShown: false }}
            />
          )}
          {user.role === 'supervisor' && (
            <RootStack.Screen
              name="Supervisor"
              component={SupervisorNavigator}
              options={{ headerShown: false }}
            />
          )}
        </>
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
