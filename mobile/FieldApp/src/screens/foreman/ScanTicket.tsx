// // /src/screens/foreman/ScanTicket.tsx
// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   ScrollView,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
// import ImageResizer from 'react-native-image-resizer';
// import { useAuth } from '../../context/AuthContext';
// type ScanTicketProps = {
//   authToken: string;
// };

// const API_BASE_URL = 'https://a5f9297cbbf4.ngrok-free.app';

// const ScanTicket = () => {
//   const { user } = useAuth();
//   const authToken = user?.token;
//   const [screen, setScreen] = useState<'camera' | 'confirmPhoto' | 'processing' | 'review'>('camera');
//   const [capturedPhoto, setCapturedPhoto] = useState<PhotoFile | null>(null);
//   const [rotation, setRotation] = useState(0);
//   const [tickets, setTickets] = useState<{ id: number; extracted_text: string }[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

 
//   const device = useCameraDevice('back');

// if (!device) {
//   return <Text>Loading camera...</Text>; // shows until device is ready
// }

//   const camera = useRef<Camera>(null);

//   // --- Capture photo ---
//   const handleCapturePhoto = async () => {
//     if (!camera.current) return;
//     setIsLoading(true);
//     try {
//       const photo = await camera.current.takePhoto({ flash: 'off', enableShutterSound: false });
//       setCapturedPhoto(photo);
//       setRotation(0);
//       setScreen('confirmPhoto');
//     } catch (e) {
//       Alert.alert('Error', 'Could not capture photo.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRotate = async () => {
//     if (!capturedPhoto) return;
//     try {
//       const newRotation = (rotation + 90) % 360;
//       setRotation(newRotation);

//       const imagePath = Platform.OS === 'android' ? `file://${capturedPhoto.path}` : capturedPhoto.path;
//       const rotatedImage = await ImageResizer.createResizedImage(
//         imagePath,
//         1080,
//         1080,
//         'JPEG',
//         100,
//         newRotation
//       );

//       const uri = rotatedImage.uri.replace('file://', '');
//       setCapturedPhoto({ ...capturedPhoto, path: uri });
//       setRotation(0);
//     } catch (error) {
//       Alert.alert('Error', 'Could not rotate image.');
//     }
//   };

//   // --- Confirm & Scan ---
//   const handleConfirmAndScan = async () => {
//     if (!capturedPhoto) return;
//     setScreen('processing');
//     setIsLoading(true);

//     try {
//       const imagePath = Platform.OS === 'android' ? `file://${capturedPhoto.path}` : capturedPhoto.path;
//       const formData = new FormData();
//       formData.append('file', { uri: imagePath, type: 'image/jpeg', name: 'ticket.jpg' } as any);

//       const response = await fetch(`${API_BASE_URL}/scan`, {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${authToken}` },
//         body: formData,
//       });

//       if (response.ok) {
//         const result = await response.json();
//         Alert.alert('Scan Successful', `Extracted Text: ${result.extracted_text}`);
//         setCapturedPhoto(null);
//         setScreen('camera');
//       } else {
//         const errorData = await response.json();
//         Alert.alert('Scan Failed', errorData.detail || 'Could not process the image.');
//         setScreen('confirmPhoto');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Unexpected error while scanning.');
//       setScreen('confirmPhoto');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // --- Review Tickets ---
//   const handleReviewTickets = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/tickets`, {
//         method: 'GET',
//         headers: { Authorization: `Bearer ${authToken}` },
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setTickets(data);
//         setScreen('review');
//       } else {
//         const errorData = await response.json();
//         Alert.alert('Fetch Failed', errorData.detail || 'Could not retrieve tickets.');
//       }
//     } catch {
//       Alert.alert('Error', 'Failed to fetch tickets.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // --- UI ---
//   if (screen === 'camera') {
//     if (!device) return <Text>Camera not available</Text>;
//     return (
//       <View style={{ flex: 1 }}>
//         <Camera ref={camera} style={{ flex: 1 }} device={device} isActive={true} photo />
//         <TouchableOpacity onPress={handleCapturePhoto} style={styles.captureButton}>
//           {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Capture</Text>}
//         </TouchableOpacity>
//         <TouchableOpacity onPress={handleReviewTickets} style={styles.reviewButton}>
//           <Text style={{ color: '#fff' }}>Review Tickets</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (screen === 'confirmPhoto' && capturedPhoto) {
//     return (
//       <SafeAreaView style={{ flex: 1, padding: 20 }}>
//         <Text>Confirm Scan</Text>
//         <Image
//           source={{ uri: `file://${capturedPhoto.path}` }}
//           style={{ width: '100%', height: 300, resizeMode: 'contain', transform: [{ rotate: `${rotation}deg` }] }}
//         />
//         <TouchableOpacity onPress={handleRotate}>
//           <Text>Rotate</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={handleConfirmAndScan}>
//           <Text>Confirm & Scan</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={() => setScreen('camera')}>
//           <Text>Retake</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   if (screen === 'review') {
//     return (
//       <SafeAreaView style={{ flex: 1, padding: 20 }}>
//         <Text>Tickets</Text>
//         <ScrollView>
//           {tickets.map((t) => (
//             <View key={t.id} style={{ marginVertical: 5, padding: 10, backgroundColor: '#eee' }}>
//               <Text>{t.extracted_text}</Text>
//             </View>
//           ))}
//         </ScrollView>
//         <TouchableOpacity onPress={() => setScreen('camera')}>
//           <Text>Back to Camera</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return <ActivityIndicator />;
// };

// const styles = StyleSheet.create({
//   captureButton: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: 'blue', padding: 20, borderRadius: 50 },
//   reviewButton: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'green', padding: 15, borderRadius: 10 },
// });

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

const TestCamera = () => {
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    const requestPermission = async () => {
      let status = await Camera.getCameraPermissionStatus(); // returns "granted" | "denied"
      if (status !== 'granted') {
        status = await Camera.requestCameraPermission(); // also returns "granted" | "denied"
      }
      setHasPermission(status === 'granted');
      setPermissionChecked(true);
    };

    requestPermission();
  }, []);

  if (!permissionChecked) {
    return <ActivityIndicator size="large" color="blue" style={{ flex: 1 }} />;
  }

  if (!hasPermission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No camera permission granted</Text>
      </View>
    );
  }

  if (!device) {
    return <ActivityIndicator size="large" color="blue" style={{ flex: 1 }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} device={device} isActive={true} />
    </View>
  );
};

export default TestCamera;
