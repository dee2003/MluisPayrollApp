// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useAuth } from '../context/AuthContext';

// import LoginScreen from '../screens/LoginScreen';
// import ForemanDashboard from '../screens/foreman/ForemanDashboard';
// import TimesheetListScreen from '../screens/foreman/TimesheetListScreen';
// import TimesheetEditScreen from '../screens/foreman/TimesheetEditScreen';
// import SupervisorDashboard from '../screens/supervisor/SupervisorDashboard';
// import TimesheetViewScreen from '../screens/supervisor/TimesheetViewScreen';

// // -------------------- Foreman Stack --------------------
// export type ForemanStackParamList = {
//   ForemanDashboard: undefined;
//   TimesheetList: undefined;
//   TimesheetEdit: { timesheetId: number };
// };

// const ForemanStack = createStackNavigator<ForemanStackParamList>();

// const ForemanNavigator = () => (
//   <ForemanStack.Navigator>
//     <ForemanStack.Screen
//       name="ForemanDashboard"
//       component={ForemanDashboard}
//       options={{ headerShown: false }}
//     />
//     <ForemanStack.Screen
//       name="TimesheetList"
//       component={TimesheetListScreen}
//       options={{ title: 'Pending Timesheets' }}
//     />
//     <ForemanStack.Screen
//       name="TimesheetEdit"
//       component={TimesheetEditScreen}
//       options={{ title: 'Enter Hours' }}
//     />
//   </ForemanStack.Navigator>
// );

// // -------------------- Supervisor Stack --------------------
// export type SupervisorStackParamList = {
//   SupervisorDashboard: undefined;
//   TimesheetView: { timesheetId: number };
// };

// const SupervisorStack = createStackNavigator<SupervisorStackParamList>();

// const SupervisorNavigator = () => (
//   <SupervisorStack.Navigator>
//     <SupervisorStack.Screen
//       name="SupervisorDashboard"
//       component={SupervisorDashboard}
//       options={{ headerShown: false }}
//     />
//     <SupervisorStack.Screen
//       name="TimesheetView"
//       component={TimesheetViewScreen}
//       options={{ title: 'Timesheet Details' }}
//     />
//   </SupervisorStack.Navigator>
// );

// // -------------------- Root Stack --------------------
// export type RootStackParamList = {
//   Login: undefined;
//   Foreman: undefined;
//   Supervisor: undefined;
// };

// const RootStack = createStackNavigator<RootStackParamList>();

// const AppNavigator = () => {
//   const { user } = useAuth();

//   return (
//     <RootStack.Navigator>
//       {!user ? (
//         <RootStack.Screen
//           name="Login"
//           component={LoginScreen}
//           options={{ headerShown: false }}
//         />
//       ) : (
//         <>
//           {user.role === 'foreman' && (
//             <RootStack.Screen
//               name="Foreman"
//               component={ForemanNavigator}
//               options={{ headerShown: false }}
//             />
//           )}
//           {user.role === 'supervisor' && (
//             <RootStack.Screen
//               name="Supervisor"
//               component={SupervisorNavigator}
//               options={{ headerShown: false }}
//             />
//           )}
//         </>
//       )}
//     </RootStack.Navigator>
//   );
// };

// export default AppNavigator;
// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useAuth } from '../context/AuthContext';

// import LoginScreen from '../screens/LoginScreen';
// import ForemanDashboard from '../screens/foreman/ForemanDashboard';
// import TimesheetListScreen from '../screens/foreman/TimesheetListScreen';
// import TimesheetEditScreen from '../screens/foreman/TimesheetEditScreen';
// // import ScanTicket from '../screens/foreman/ScanTicket';

// import SupervisorDashboard from '../screens/supervisor/SupervisorDashboard';
// // Renamed TimesheetViewScreen to TimesheetReviewScreen for clarity in the Supervisor flow
// import TimesheetViewScreen from '../screens/supervisor/TimesheetViewScreen'; // Keeping original import for reference if needed

// // -------------------- Foreman Stack --------------------
// export type ForemanStackParamList = {
//   ForemanDashboard: undefined;
//   TimesheetList: undefined;
//   TimesheetEdit: { timesheetId: number };
//   Timesheet: undefined;
//   ScanTicket: undefined; 
// };

// const ForemanStack = createStackNavigator<ForemanStackParamList>();

// const ForemanNavigator = () => (
//     <ForemanStack.Navigator>
//         <ForemanStack.Screen 
//             name="ForemanDashboard" 
//             component={ForemanDashboard} 
//             options={{ headerShown: false }}
//         />
//         <ForemanStack.Screen 
//             name="TimesheetList" 
//             component={TimesheetListScreen}
//             options={{ title: 'Pending Timesheets' }}
//         />
//         <ForemanStack.Screen 
//             name="TimesheetEdit" 
//             component={TimesheetEditScreen} 
//             options={{ title: 'Enter Hours' }}
//         />
        
//         {/* <ForemanStack.Screen
//   name="ScanTicket"
//   component={ScanTicket}
//   options={{ title: 'Scan Ticket' }}
// /> */}

//     </ForemanStack.Navigator>
// );

// // -------------------- Supervisor Stack --------------------
// export type SupervisorStackParamList = {
//   SupervisorDashboard: undefined;
//   // Route is now named TimesheetReview and uses the new read-only component
//   TimesheetReview: { timesheetId: number };
// };

// const SupervisorStack = createStackNavigator<SupervisorStackParamList>();

// const SupervisorNavigator = () => (
//   <SupervisorStack.Navigator>
//     <SupervisorStack.Screen
//       name="SupervisorDashboard"
//       component={SupervisorDashboard}
//       options={{ headerShown: false }}
//     />
//     <SupervisorStack.Screen
//       // Using the new TimesheetReview route name and component
//       name="TimesheetReview"
//       component={TimesheetViewScreen}
//       options={{ title: 'Timesheet Review' }}
//     />
//   </SupervisorStack.Navigator>
// );

// // -------------------- Root Stack --------------------
// export type RootStackParamList = {
//   Login: undefined;
//   Foreman: undefined;
//   Supervisor: undefined;
// };

// const RootStack = createStackNavigator<RootStackParamList>();

// const AppNavigator = () => {
//   const { user } = useAuth();

//   return (
//     <RootStack.Navigator>
//       {!user ? (
//         <RootStack.Screen
//           name="Login"
//           component={LoginScreen}
//           options={{ headerShown: false }}
//         />
//       ) : (
//         <>
//           {user.role === 'foreman' && (
//             <RootStack.Screen
//               name="Foreman"
//               component={ForemanNavigator}
//               options={{ headerShown: false }}
//             />
//           )}
//           {user.role === 'supervisor' && (
//             <RootStack.Screen
//               name="Supervisor"
//               component={SupervisorNavigator}
//               options={{ headerShown: false }}
//             />
//           )}
//         </>
//       )}
//     </RootStack.Navigator>
//   );
// };

// export default AppNavigator;


import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ForemanDashboard from '../screens/foreman/ForemanDashboard';
import TimesheetListScreen from '../screens/foreman/TimesheetListScreen';
import TimesheetEditScreen from '../screens/foreman/TimesheetEditScreen';
import SupervisorDashboard from '../screens/supervisor/SupervisorDashboard';
import TimesheetViewScreen from '../screens/supervisor/TimesheetViewScreen';
// Import the new list screens
import SupervisorTimesheetListScreen from '../screens/supervisor/SupervisorTimesheetListScreen';
import SupervisorTicketListScreen from '../screens/supervisor/SupervisorTicketListScreen';
// import Splash from '../screens/Splash';
// -------------------- Foreman Stack --------------------
export type ForemanStackParamList = {
  ForemanDashboard: undefined;
  TimesheetList: undefined;
  TimesheetEdit: { timesheetId: number };
};
const ForemanStack = createStackNavigator<ForemanStackParamList>();
const ForemanNavigator = () => (
  <ForemanStack.Navigator>
    <ForemanStack.Screen name="ForemanDashboard" component={ForemanDashboard} options={{ headerShown: false }} />
    <ForemanStack.Screen name="TimesheetList" component={TimesheetListScreen} options={{ title: 'Pending Timesheets' }} />
    <ForemanStack.Screen name="TimesheetEdit" component={TimesheetEditScreen} options={{ title: 'Enter Hours' }} />
  </ForemanStack.Navigator>
);
// -------------------- Supervisor Stack --------------------
export type SupervisorStackParamList = {
  SupervisorDashboard: undefined;
  TimesheetReview: { timesheetId: number };
  // Define the new routes and their params
  SupervisorTimesheetList: { foremanId: number; date: string; foremanName: string };
  SupervisorTicketList: { foremanId: number; date: string; foremanName: string };
};
const SupervisorStack = createStackNavigator<SupervisorStackParamList>();
const SupervisorNavigator = () => (
  <SupervisorStack.Navigator>
    <SupervisorStack.Screen name="SupervisorDashboard" component={SupervisorDashboard} options={{ headerShown: false }} />
    <SupervisorStack.Screen name="TimesheetReview" component={TimesheetViewScreen} options={{ title: 'Timesheet Review' }} />
    {/* Add the new screens to the navigator */}
    <SupervisorStack.Screen
      name="SupervisorTimesheetList"
      component={SupervisorTimesheetListScreen}
      options={({ route }) => ({ title: `${route.params.foremanName}'s Timesheets` })}
    />
    <SupervisorStack.Screen
      name="SupervisorTicketList"
      component={SupervisorTicketListScreen}
      options={({ route }) => ({ title: `${route.params.foremanName}'s Tickets` })}
    />
  </SupervisorStack.Navigator>
);
// -------------------- Root Stack --------------------
// Use NavigatorScreenParams for nested stacks
export type RootStackParamList = {
  Login: undefined;
  Foreman: NavigatorScreenParams<ForemanStackParamList>;
  Supervisor: NavigatorScreenParams<SupervisorStackParamList>;
};
const RootStack = createStackNavigator<RootStackParamList>();
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
          {user.role === 'supervisor' && (
            <RootStack.Screen name="Supervisor" component={SupervisorNavigator} options={{ headerShown: false }} />
          )}
        </>
      )}
    </RootStack.Navigator>
  );
};
export default AppNavigator;