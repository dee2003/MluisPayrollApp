

// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import { NavigatorScreenParams } from '@react-navigation/native';
// import { useAuth } from '../context/AuthContext';
// import LoginScreen from '../screens/LoginScreen';
// import ForemanDashboard from '../screens/foreman/ForemanDashboard';
// import TimesheetListScreen from '../screens/foreman/TimesheetListScreen';
// import TimesheetEditScreen from '../screens/foreman/TimesheetEditScreen';
// import SupervisorDashboard from '../screens/supervisor/SupervisorDashboard';
// import TimesheetViewScreen from '../screens/supervisor/TimesheetViewScreen';
// // Import the new list screens
// import SupervisorTimesheetListScreen from '../screens/supervisor/SupervisorTimesheetListScreen';
// import SupervisorTicketListScreen from '../screens/supervisor/SupervisorTicketListScreen';
// // import Splash from '../screens/Splash';

// // Import the new list screens

// import Splash from '../screens/Splash';

// // -------------------- Foreman Stack --------------------
// export type ForemanStackParamList = {
//   ForemanDashboard: undefined;
//   TimesheetList: undefined;
//   TimesheetEdit: { timesheetId: number };
// };
// const ForemanStack = createStackNavigator<ForemanStackParamList>();
// const ForemanNavigator = () => (
//   <ForemanStack.Navigator>
//     <ForemanStack.Screen name="ForemanDashboard" component={ForemanDashboard} options={{ headerShown: false }} />
//     <ForemanStack.Screen name="TimesheetList" component={TimesheetListScreen} options={{ title: 'Pending Timesheets' }} />
//     <ForemanStack.Screen name="TimesheetEdit" component={TimesheetEditScreen} options={{ title: 'Enter Hours' }} />
//   </ForemanStack.Navigator>
// );
// // -------------------- Supervisor Stack --------------------
// export type SupervisorStackParamList = {
//   SupervisorDashboard: undefined;
//   TimesheetReview: { timesheetId: number };
//   // Define the new routes and their params
//   SupervisorTimesheetList: { foremanId: number; date: string; foremanName: string };
//   SupervisorTicketList: { foremanId: number; date: string; foremanName: string };
// };
// const SupervisorStack = createStackNavigator<SupervisorStackParamList>();
// const SupervisorNavigator = () => (
//   <SupervisorStack.Navigator>
//     <SupervisorStack.Screen name="SupervisorDashboard" component={SupervisorDashboard} options={{ headerShown: false }} />
//     <SupervisorStack.Screen name="TimesheetReview" component={TimesheetViewScreen} options={{ title: 'Timesheet Review' }} />
//     {/* Add the new screens to the navigator */}
//     <SupervisorStack.Screen 
//       name="SupervisorTimesheetList" 
//       component={SupervisorTimesheetListScreen} 
//       options={({ route }) => ({ title: `${route.params.foremanName}'s Timesheets` })}
//     />
//     <SupervisorStack.Screen 
//       name="SupervisorTicketList" 
//       component={SupervisorTicketListScreen} 
//       options={({ route }) => ({ title: `${route.params.foremanName}'s Tickets` })}
//     />
//   </SupervisorStack.Navigator>
// );
// // -------------------- Root Stack --------------------
// // Use NavigatorScreenParams for nested stacks
// export type RootStackParamList = {
//   Login: undefined;
//   Foreman: NavigatorScreenParams<ForemanStackParamList>;
//   Supervisor: NavigatorScreenParams<SupervisorStackParamList>;
  
// };
// const RootStack = createStackNavigator<RootStackParamList>();
// const AppNavigator = () => {
//   const { user } = useAuth();
//   return (
//     <RootStack.Navigator>
      
//       {!user ? (
       
//         <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
//       ) : (
//         <>
//           {user.role === 'foreman' && (
//             <RootStack.Screen name="Foreman" component={ForemanNavigator} options={{ headerShown: false }} />
//           )}
//           {user.role === 'supervisor' && (
//             <RootStack.Screen name="Supervisor" component={SupervisorNavigator} options={{ headerShown: false }} />
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
import SupervisorTimesheetListScreen from '../screens/supervisor/SupervisorTimesheetListScreen';
import SupervisorTicketListScreen from '../screens/supervisor/SupervisorTicketListScreen';
// import SupervisorTicketDetailScreen from '../screens/supervisor/SupervisorTicketDetailScreen';
// :white_check_mark: NEW IMPORTS for Project Engineer
// import ProjectEngineerDashboard from '../screens/projectEngineer/PEDashboard';
import TimesheetForm from '../screens/projectEngineer/TimesheetForm';
import TicketForm from '../screens/projectEngineer/TicketForm';
// import PEDashboard from '../screens/PE/PEDashboard';
// import PETimesheetList from '../screens/PE/PETimesheetList';
// import PETicketList from '../screens/PE/PETicketList';
// import ProjectEngineerTimesheetViewScreen from '../screens/projectEngineer/ProjectEngineerTimesheetViewScreen';
// -------------------- Types --------------------
type Ticket = {
  id: number;
  ticket_number: string;
  job_name: string;
  image_path: string;
};
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
  SupervisorTimesheetList: { foremanId: number; date: string; foremanName: string };
  SupervisorTicketList: { foremanId: number; date: string; foremanName: string };
  SupervisorTicketDetail: { ticket: Ticket };
};
const SupervisorStack = createStackNavigator<SupervisorStackParamList>();
const SupervisorNavigator = () => (
  <SupervisorStack.Navigator>
    <SupervisorStack.Screen name="SupervisorDashboard" component={SupervisorDashboard} options={{ headerShown: false }} />
    <SupervisorStack.Screen name="TimesheetReview" component={TimesheetViewScreen} options={{ title: 'Timesheet Review' }} />
    <SupervisorStack.Screen name="SupervisorTimesheetList" component={SupervisorTimesheetListScreen} options={({ route }) => ({ title: `${route.params.foremanName}'s Timesheets` })} />
    <SupervisorStack.Screen name="SupervisorTicketList" component={SupervisorTicketListScreen} options={({ route }) => ({ title: `${route.params.foremanName}'s Tickets` })} />
    {/* <SupervisorStack.Screen name="SupervisorTicketDetail" component={SupervisorTicketDetailScreen} options={{ title: 'Ticket Detail' }} /> */}
  </SupervisorStack.Navigator>
);
// -------------------- :white_check_mark: Project Engineer Stack --------------------
export type ProjectEngineerStackParamList = {
  PEDashboard: undefined;
  PETimesheetList: { supervisorId: number; date: string; supervisorName: string };
  PETicketList: { supervisorId: number; date: string; supervisorName: string };
};

// const ProjectEngineerStack = createStackNavigator<ProjectEngineerStackParamList>();
// const ProjectEngineerNavigator = () => (
//   <ProjectEngineerStack.Navigator>
//     <ProjectEngineerStack.Screen
//       name="PEDashboard"
//       component={ProjectEngineerDashboard}
//       options={{ headerShown: false }}
//     />
    
//     {/* <ProjectEngineerStack.Screen
//       name="PETimesheetList"
//       component={PETimesheetList}
//       options={{ title: 'Timesheet Detail' }}
//     />
//     <ProjectEngineerStack.Screen
//       name="PETicketList"
//       component={PETicketList}
//       options={({ route }) => ({ title: `${route.params.supervisorName}'s Tickets` })}
//     />
//     <ProjectEngineerStack.Screen
//       name="TimesheetForm"
//       component={TimesheetForm}
//       options={{ title: 'Timesheet Detail' }}
//     /> */}
//   </ProjectEngineerStack.Navigator>
// );
// -------------------- Root Stack --------------------
export type RootStackParamList = {
  Login: undefined;
  Foreman: NavigatorScreenParams<ForemanStackParamList>;
  Supervisor: NavigatorScreenParams<SupervisorStackParamList>;
  ProjectEngineer: NavigatorScreenParams<ProjectEngineerStackParamList>;
  PETimesheetList: { supervisorId: number; date: string; supervisorName: string };
  PETicketList: { supervisorId: number; date: string; supervisorName: string };
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
          {/* {user.role === 'project_engineer' && (
            <RootStack.Screen name="ProjectEngineer" component={ProjectEngineerNavigator} options={{ headerShown: false }} />
          )} */}
        </>
      )}
    </RootStack.Navigator>
  );
};
export default AppNavigator;