// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// // 👇 Define the type for your navigation stack
// type RootStackParamList = {
//   Login: undefined;
//   Home: undefined;
// };

// type LoginScreenNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   "Login"
// >;

// interface Props {
//   navigation: LoginScreenNavigationProp;
// }

// const BASE_URL = "https://d1b00c5883ea.ngrok-free.app/api";

// const LoginScreen: React.FC<Props> = ({ navigation }) => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!username || !password) {
//       Alert.alert("Error", "Please enter both username and password.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(`${BASE_URL}/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//       });

//       const data = await response.json().catch(() => null);

//       if (response.ok) {
//         Alert.alert("✅ Success", `Welcome ${data.first_name || data.username}!`);
//         navigation.navigate("Home");
//       } else if (response.status === 401) {
//         Alert.alert("❌ Invalid", "Invalid username or password.");
//       } else {
//         Alert.alert("⚠️ Error", data?.detail || "Something went wrong.");
//       }
//     } catch (error) {
//       console.error("🚨 Login error:", error);
//       Alert.alert("Network Error", "Unable to connect to server.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Admin Login</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Username"
//         value={username}
//         onChangeText={setUsername}
//         autoCapitalize="none"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />
//       <TouchableOpacity
//         style={[styles.button, loading && { backgroundColor: "#ccc" }]}
//         onPress={handleLogin}
//         disabled={loading}
//       >
//         <Text style={styles.buttonText}>
//           {loading ? "Logging in..." : "Login"}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
//   input: {
//     width: "100%",
//     padding: 10,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 5,
//     marginBottom: 15,
//   },
//   button: {
//     backgroundColor: "#007AFF",
//     padding: 12,
//     borderRadius: 5,
//     width: "100%",
//   },
//   buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
// });

// export default LoginScreen;
// /src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await apiClient.post<User>('/api/auth/login', { username, password });
      if (response.data?.id) {
        login(response.data); // Log in any user with a valid response
      } else {
        Alert.alert('Login Failed', 'Received an invalid user object.');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.detail || 'An unknown error occurred.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mluis Payroll</Text>
      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, marginBottom: 15, paddingHorizontal: 15, backgroundColor: '#fff' },
});

export default LoginScreen;
