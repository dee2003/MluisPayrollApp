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
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.content}>
//         {/* Existing button */}
//         <TouchableOpacity
//   style={[styles.button, { backgroundColor: '#28a745', marginTop: 20 }]}
//   onPress={() => navigation.navigate('ScanTicket')}
// >
//   <Text style={styles.buttonText}>Scan Ticket</Text>
// </TouchableOpacity>


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







// /src/screens/foreman/ForemanDashboard.tsx

// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   Alert,
//   Platform,
//   ActivityIndicator,
//   ScrollView,
//   Image,
// } from 'react-native';
// import { useAuth } from '../../context/AuthContext';
// import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
// import ImageResizer from 'react-native-image-resizer';

// const API_BASE_URL = 'https://coated-nonattributive-babara.ngrok-free.dev';

// const ForemanDashboard = ({ navigation }: { navigation: any }) => {
//   const { user, logout } = useAuth();

//   // ScanTicket related states
//   const [hasPermission, setHasPermission] = useState(false);
//   const [screen, setScreen] = useState<'dashboard' | 'camera' | 'confirmPhoto' | 'review' | 'processing'>('dashboard');
//   const [tickets, setTickets] = useState<{ id: number; extracted_text: string; image_url: string }[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [capturedPhoto, setCapturedPhoto] = useState<PhotoFile | null>(null);
//   const [rotation, setRotation] = useState(0);

//   const device = useCameraDevice('back');
//   const camera = useRef<Camera>(null);
// const requestCameraPermissionAndOpenCamera = async () => {
//   const status = await Camera.requestCameraPermission();
//   setHasPermission(status === 'granted');
//   if (status === 'granted') {
//     setScreen('camera');
//   } else {
//     Alert.alert('Permission denied', 'Camera permission is required to scan tickets.');
//   }
// };

//   // Request camera permission on mount
//   // useEffect(() => {
//   //   (async () => {
//   //     const status = await Camera.requestCameraPermission();
//   //     setHasPermission(status === 'granted');
//   //   })();
//   // }, []);

//   // Handlers from ScanTicket logic

//   const handleCapturePhoto = async () => {
//     if (camera.current) {
//       setIsLoading(true);
//       try {
//         const photo = await camera.current.takePhoto({
//           flash: 'off',
//           enableShutterSound: false,
//         });
//         setCapturedPhoto(photo);
//         setRotation(0);
//         setScreen('confirmPhoto');
//       } catch (e) {
//         console.error('Failed to take photo', e);
//         Alert.alert('Error', 'Could not capture photo.');
//       } finally {
//         setIsLoading(false);
//       }
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
//         newRotation,
//         undefined,
//         false,
//         { mode: 'contain', onlyScaleDown: false }
//       );

//       const uri = rotatedImage.uri.startsWith('file://') ? rotatedImage.uri.replace('file://', '') : rotatedImage.uri;
//       setCapturedPhoto({ ...capturedPhoto, path: uri });
//       setRotation(0);
//     } catch (error) {
//       console.error('Rotation Error:', error);
//       Alert.alert('Error', 'Could not rotate image.');
//     }
//   };

//   const handleConfirmAndScan = async () => {
//   if (!capturedPhoto) return;
//   setScreen('processing');
//   setIsLoading(true);

//   try {
//     const imagePath = Platform.OS === 'android' ? `file://${capturedPhoto.path}` : capturedPhoto.path;
//     const formData = new FormData();
//     formData.append('file', {
//       uri: imagePath,
//       type: 'image/jpeg',
//       name: 'ticket.jpg',
//     });

//     console.log('Uploading ticket...');
//     const response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
//       method: 'POST',
//       // DO NOT set headers here!
//       body: formData,
//     });

//     console.log('Response received:', response.status);
//     const textResponse = await response.text();
//     console.log('Raw response:', textResponse);

//     let result;
//     try {
//       result = JSON.parse(textResponse);
//     } catch (e) {
//       Alert.alert('Scan Failed', 'Invalid JSON from server.');
//       setScreen('confirmPhoto');
//       setIsLoading(false);
//       return;
//     }

//     if (response.ok) {
//       // Alert.alert('Scan Successful', `Extracted: ${result.extracted_text || JSON.stringify(result.extracted_table)}`);
//       Alert.alert('Scan Successful');
//       setScreen('dashboard');
//       setCapturedPhoto(null);
//     } else {
//       Alert.alert('Scan Failed', result.detail || 'Could not process image.');
//       setScreen('confirmPhoto');
//     }
//   } catch (err) {
//     console.log('Unexpected scan error:', err);
//     Alert.alert('Error', 'Unexpected error while scanning.');
//     setScreen('confirmPhoto');
//   } finally {
//     setIsLoading(false);
//   }
// };

//   const handleReviewTickets = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/ocr/tickets`, { method: 'GET' });
//       if (response.ok) {
//         const data = await response.json();
//         console.log('Tickets API response:', JSON.stringify(data));
//         setTickets(data.tickets || []);
//         setScreen('review');
//       } else {
//         const data = await response.json();
//         Alert.alert('Fetch Failed', data.detail || 'Could not retrieve tickets.');
//       }
//     } catch {
//       Alert.alert('Error', 'An error occurred while fetching tickets.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Main UI render flow

//   // Top Foreman header visible on all screens
//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
//       <TouchableOpacity onPress={logout}>
//         <Text style={styles.logoutText}>Logout</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // if (!hasPermission) {
//   //   return (
//   //     <SafeAreaView style={styles.container}>
//   //       {renderHeader()}
//   //       <View style={styles.centerContent}>
//   //         <Text>No camera permission granted</Text>
//   //       </View>
//   //     </SafeAreaView>
//   //   );
//   // }

//   if (screen === 'dashboard') {
//     return (
//       <SafeAreaView style={styles.container}>
//         {renderHeader()}
//         <View style={styles.content}>
//           <TouchableOpacity
//             style={[styles.button, { backgroundColor: '#28a745', marginTop: 20 }]}
//             onPress={requestCameraPermissionAndOpenCamera}
//             disabled={isLoading}
//           >
//             <Text style={styles.buttonText}>Scan Ticket</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.button} onPress={handleReviewTickets} disabled={isLoading}>
//             <Text style={styles.buttonText}>Review Tickets</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.button, { marginTop: 20 }]}
//             onPress={() => navigation.navigate('TimesheetList')}
//           >
//             <Text style={styles.buttonText}>View My Timesheets</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (screen === 'camera') {
//     if (!device)
//       return (
//         <SafeAreaView style={styles.container}>
//           {renderHeader()}
//           <ActivityIndicator size="large" color="blue" style={{ flex: 1 }} />
//         </SafeAreaView>
//       );
//     return (
//       <View style={styles.fullScreen}>
//         <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive photo />
//         <View style={styles.cameraControls}>
//           <TouchableOpacity style={styles.captureButton} onPress={handleCapturePhoto} disabled={isLoading}>
//             {isLoading ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInnerButton} />}
//           </TouchableOpacity>
//         </View>
//         <TouchableOpacity style={styles.backButton} onPress={() => setScreen('dashboard')}>
//           <Text style={styles.backButtonText}>Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (screen === 'confirmPhoto' && capturedPhoto) {
//     return (
//       <SafeAreaView style={styles.container}>
//         {renderHeader()}
//         <Text style={styles.title}>Confirm Scan</Text>
//         <View style={{ alignItems: 'center' }}>
//           <Image
//             style={[styles.previewImage, { transform: [{ rotate: `${rotation}deg` }] }]}
//             source={{ uri: `file://${capturedPhoto.path}` }}
//           />
//         </View>
//         <View style={styles.confirmationControls}>
//           <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={() => setScreen('camera')} disabled={isLoading}>
//             <Text style={styles.buttonText}>Retake</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={[styles.button, styles.rotateButton]} onPress={handleRotate} disabled={isLoading}>
//             <Text style={styles.buttonText}>Rotate</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={handleConfirmAndScan} disabled={isLoading}>
//             <Text style={styles.buttonText}>Confirm & Scan</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (screen === 'processing' && capturedPhoto) {
//     return (
//       <SafeAreaView style={styles.container}>
//         {renderHeader()}
//         <Text style={styles.title}>Processing...</Text>
//         <View style={styles.processingContainer}>
//           <Image style={[styles.previewImage, styles.processingImage]} source={{ uri: `file://${capturedPhoto.path}` }} />
//           <View style={styles.overlay}>
//             <ActivityIndicator size="large" color="#fff" />
//             <Text style={styles.processingText}>Scanning your ticket</Text>
//           </View>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (screen === 'review') {
//     return (
//       <SafeAreaView style={styles.container}>
//         {renderHeader()}
//         <Text style={styles.title}>Review Tickets</Text>
//         <ScrollView>
//           {tickets.length > 0 ? (
//             tickets.map(ticket => (
//               <View key={ticket.id} style={styles.ticket}>
//                 {ticket.image_url && (
//                   <Image source={{ uri: `${API_BASE_URL}${ticket.image_url}` }} style={styles.ticketImage} resizeMode="contain" />
//                 )}
//                 <Text style={styles.ticketText}>{ticket.extracted_text}</Text>
//               </View>
//             ))
//           ) : (
//             <Text>No tickets found.</Text>
//           )}
//         </ScrollView>
//         <TouchableOpacity style={styles.buttonWide} onPress={() => setScreen('dashboard')}>
//           <Text style={styles.buttonText}>Back to Dashboard</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       {renderHeader()}
//       <Text>Loading...</Text>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f0f2f5' },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
//   welcomeText: { fontSize: 22, fontWeight: 'bold' },
//   logoutText: { fontSize: 16, color: '#ff6347' },
//   content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   button: { backgroundColor: '#007bff', paddingVertical: 15, borderRadius: 8, minWidth: 100, alignItems: 'center',marginHorizontal: 5, },
//   buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
//   fullScreen: { flex: 1, backgroundColor: 'black' },
//   cameraControls: { position: 'absolute', bottom: 0, width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'center' },
//   captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
//   captureInnerButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
//   backButton: { position: 'absolute', top: 50, left: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10 },
//   backButtonText: { color: 'white', fontSize: 16 },
//   title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//   previewImage: { width: '100%', height: 300, resizeMode: 'contain', borderRadius: 10, marginBottom: 20 },
//   confirmationControls: { paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
//   retakeButton: { backgroundColor: '#6c757d' },
//   rotateButton: { backgroundColor: '#17a2b8' },
//   processingContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '100%',
//   },
//   processingImage: {
//     opacity: 0.6,
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.4)',
//     borderRadius: 10,
//   },
//   processingText: {
//     color: '#fff',
//     marginTop: 10,
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   ticket: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
//   ticketImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
//   ticketText: { fontSize: 16, color: '#333' },
//   centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   buttonWide: {
//     backgroundColor: '#007bff',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 10,
//     width: '90%',
//   },
// });

// export default ForemanDashboard;









// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   Alert,
//   ScrollView,
//   Image,
//   ActivityIndicator
// } from 'react-native';
// import { useAuth } from '../../context/AuthContext';
// import DocumentScanner from 'react-native-document-scanner-plugin';
// import RNFS from 'react-native-fs';

// const renameFile = async (oldUri: string, newFileName: string): Promise<string> => {
//   try {
//     const oldPath = oldUri.startsWith('file://') ? oldUri.substring(7) : oldUri;
//     const newPath = `${RNFS.DocumentDirectoryPath}/${newFileName}`;
//     await RNFS.moveFile(oldPath, newPath);
//     return `file://${newPath}`;
//   } catch (error) {
//     console.error('Rename error:', error);
//     return oldUri; // fallback to original file path if error
//   }
// };

// const API_BASE_URL = 'https://coated-nonattributive-babara.ngrok-free.dev';

// const ForemanDashboard = ({ navigation }: { navigation: any }) => {
//   const { user, logout } = useAuth();
//  const [imagesByDate, setImagesByDate] = useState<{ date: string; images: { id: number; image_url: string }[] }[]>([]);
// const [fullImageUri, setFullImageUri] = useState<string | null>(null);

//   const [screen, setScreen] = useState<'dashboard' | 'scanning' | 'processing' | 'review'>('dashboard');
//   const [isLoading, setIsLoading] = useState(false);
//   const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
//   const [tickets, setTickets] = useState<{ id: number; extracted_text: string; image_url: string }[]>([]);

//   const handleScanDocument = async () => {
//   try {
//     setIsLoading(true);
//     const { scannedImages } = await DocumentScanner.scanDocument({ maxNumDocuments: 1 });
//     if (scannedImages && scannedImages.length > 0) {
//       const originalUri = scannedImages[0];
//       const newFileName = `ticket_${Date.now()}.jpg`; // your preferred filename
//       const renamedUri = await renameFile(originalUri, newFileName);
      
//       setScannedImageUri(renamedUri);
//       await uploadScannedImage(renamedUri);
//     } else {
//       Alert.alert('Scan Canceled', 'No document was scanned.');
//     }
//   } catch (err) {
//     console.error('Scan error:', err);
//     Alert.alert('Error', 'Error during scan.');
//   } finally {
//     setIsLoading(false);
//   }
// };


//   const uploadScannedImage = async (uri: string) => {
//     setScreen('processing');
//     setIsLoading(true);

//     try {
//       const formData = new FormData();
//       formData.append('file', {
//         uri: uri,
//         type: 'image/jpeg',
//         name: 'ticket.jpg',
//       });

//       console.log('Uploading scanned ticket...');
//       const response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
//         method: 'POST',
//         body: formData,
//       });

//       console.log('Response received:', response.status);
//       const textResponse = await response.text();
//       console.log('Raw response:', textResponse);

//       let result;
//       try {
//         result = JSON.parse(textResponse);
//       } catch (e) {
//         Alert.alert('Scan Failed', 'Invalid JSON from server.');
//         setScreen('dashboard');
//         setIsLoading(false);
//         return;
//       }

//       if (response.ok) {
//         Alert.alert('Scan Successful');
//         setScreen('dashboard');
//         setScannedImageUri(null);
//       } else {
//         Alert.alert('Scan Failed', result.detail || 'Could not process image.');
//         setScreen('dashboard');
//       }
//     } catch (err) {
//       console.log('Unexpected scan error:', err);
//       Alert.alert('Error', 'Unexpected error while scanning.');
//       setScreen('dashboard');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // const handleReviewTickets = async () => {
//   //   setIsLoading(true);
//   //   try {
//   //     const response = await fetch(`${API_BASE_URL}/api/ocr/tickets`, { method: 'GET' });
//   //     if (response.ok) {
//   //       const data = await response.json();
//   //       console.log('Tickets API response:', JSON.stringify(data));
//   //       setTickets(data.tickets || []);
//   //       setScreen('review');
//   //     } else {
//   //       const data = await response.json();
//   //       Alert.alert('Fetch Failed', data.detail || 'Could not retrieve tickets.');
//   //     }
//   //   } catch {
//   //     Alert.alert('Error', 'An error occurred while fetching tickets.');
//   //   } finally {
//   //     setIsLoading(false);
//   //   }
//   // };
// const handleReviewTickets = async () => {
//   setIsLoading(true);
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/ocr/images-by-date`);
//     if (response.ok) {
//       const data = await response.json();
//       setImagesByDate(data.imagesByDate || []);
//       setScreen('review');
//     } else {
//       const errorData = await response.json();
//       Alert.alert('Fetch Failed', errorData.detail || 'Could not retrieve images.');
//     }
//   } catch {
//     Alert.alert('Error', 'An error occurred while fetching images.');
//   } finally {
//     setIsLoading(false);
//   }
// };

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
//       <TouchableOpacity onPress={logout}>
//         <Text style={styles.logoutText}>Logout</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (screen === 'dashboard') {
//     return (
//       <SafeAreaView style={styles.container}>
//         {renderHeader()}
//         <View style={styles.content}>
//           <TouchableOpacity
//             style={[styles.button, { backgroundColor: '#28a745', marginTop: 20 }]}
//             onPress={handleScanDocument}
//             disabled={isLoading}
//           >
//             <Text style={styles.buttonText}>Scan Ticket</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.button} onPress={handleReviewTickets} disabled={isLoading}>
//             <Text style={styles.buttonText}>Review Tickets</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.button, { marginTop: 20 }]}
//             onPress={() => navigation.navigate('TimesheetList')}
//           >
//             <Text style={styles.buttonText}>View My Timesheets</Text>
//           </TouchableOpacity>
//         </View>
//         {isLoading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
//       </SafeAreaView>
//     );
//   }

//   if (screen === 'processing') {
//     return (
//       <SafeAreaView style={styles.container}>
//         {renderHeader()}
//         <Text style={styles.title}>Processing...</Text>
//         {scannedImageUri && (
//           <Image style={styles.previewImage} source={{ uri: scannedImageUri }} />
//         )}
//         <ActivityIndicator size="large" color="#007bff" />
//       </SafeAreaView>
//     );
//   }

//   // if (screen === 'review') {
//   //   return (
//   //     <SafeAreaView style={styles.container}>
//   //       {renderHeader()}
//   //       <Text style={styles.title}>Review Tickets</Text>
//   //       <ScrollView>
//   //         {tickets.length > 0 ? (
//   //           tickets.map(ticket => (
//   //             <View key={ticket.id} style={styles.ticket}>
//   //               {ticket.image_url && (
//   //                 <Image
//   //                   source={{ uri: `${API_BASE_URL}${ticket.image_url}` }}
//   //                   style={styles.ticketImage}
//   //                   resizeMode="contain"
//   //                 />
//   //               )}
//   //               <Text style={styles.ticketText}>{ticket.extracted_text}</Text>
//   //             </View>
//   //           ))
//   //         ) : (
//   //           <Text>No tickets found.</Text>
//   //         )}
//   //       </ScrollView>
//   //       <TouchableOpacity style={styles.buttonWide} onPress={() => setScreen('dashboard')}>
//   //         <Text style={styles.buttonText}>Back to Dashboard</Text>
//   //       </TouchableOpacity>
//   //     </SafeAreaView>
//   //   );
//   // }
// if (screen === 'review') {
//   return (
//     <SafeAreaView style={styles.container}>
//       {renderHeader()}
//       <Text style={styles.title}>Scanned Images by Date</Text>
//       <ScrollView>
//         {imagesByDate.length === 0 ? (
//           <Text>No images found</Text>
//         ) : (
//           imagesByDate.map(group => (
//             <View key={group.date} style={{ marginBottom: 20 }}>
//               <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 10 }}>{group.date}</Text>
//               {group.images.map((img, idx) => (
//                 <TouchableOpacity
//                   key={img.id}
//                   onPress={() => {
//                     console.log('Opening image uri:', `${API_BASE_URL}${img.image_url}`);
//                     setFullImageUri(`${API_BASE_URL}${img.image_url}`);
//                   }}
//                   style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#ddd' }}
//                 >
//                   <Text style={{ fontSize: 16 }}>Image {idx + 1}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           ))
//         )}
//       </ScrollView>
//       {/* Full-screen image modal */}
//       {fullImageUri && (
//         <View style={styles.fullImageContainer}>
//           <Image source={{ uri: fullImageUri }} style={styles.fullImage} />
//           <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
//             <Text style={{ color: '#fff' }}>Close</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//       <TouchableOpacity style={styles.buttonWide} onPress={() => setScreen('dashboard')}>
//         <Text style={styles.buttonText}>Back to Dashboard</Text>
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// }


//   return (
//     <SafeAreaView style={styles.container}>
//       {renderHeader()}
//       <Text>Loading...</Text>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f0f2f5' },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
//   welcomeText: { fontSize: 22, fontWeight: 'bold' },
//   logoutText: { fontSize: 16, color: '#ff6347' },
//   content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   button: {
//     backgroundColor: '#007bff',
//     paddingVertical: 15,
//     borderRadius: 8,
//     minWidth: 100,
//     alignItems: 'center',
//     marginHorizontal: 5,
//   },
//   buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
//   title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//   previewImage: { width: '100%', height: 300, resizeMode: 'contain', borderRadius: 10, marginBottom: 20 },
//   ticket: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
//   ticketImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
//   ticketText: { fontSize: 16, color: '#333' },
//   buttonWide: {
//     backgroundColor: '#007bff',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 10,
//     width: '90%',
//   },
//   fullImageContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 999,
//   },
//   fullImage: {
//     width: '90%',
//     height: '80%',
//     resizeMode: 'contain',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 40,
//     right: 20,
//     padding: 10,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 5,
//   },
// });

// export default ForemanDashboard;







import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions, 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import DocumentScanner from 'react-native-document-scanner-plugin';
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');
const THUMBNAIL_HEIGHT = 150; // Set a fixed height for the horizontal carousel

const renameFile = async (oldUri: string, newFileName: string): Promise<string> => {
  try {
    const oldPath = oldUri.startsWith('file://') ? oldUri.substring(7) : oldUri;
    const newPath = `${RNFS.DocumentDirectoryPath}/${newFileName}`;
    await RNFS.moveFile(oldPath, newPath);
    return `file://${newPath}`;
  } catch (error) {
    console.error('Rename error:', error);
    return oldUri; // fallback to original file path if error
  }
};

const API_BASE_URL = 'https://coated-nonattributive-babara.ngrok-free.dev';

const ForemanDashboard = ({ navigation }: { navigation: any }) => {
  const { user, logout } = useAuth();
  const [imagesByDate, setImagesByDate] = useState<{ date: string; images: { id: number; image_url: string }[] }[]>([]);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);

  const [screen, setScreen] = useState<'dashboard' | 'scanning' | 'processing' | 'review'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [tickets, setTickets] = useState<{ id: number; extracted_text: string; image_url: string }[]>([]);

  const handleScanDocument = async () => {
    try {
      setIsLoading(true);
      const { scannedImages } = await DocumentScanner.scanDocument({ maxNumDocuments: 1 });
      if (scannedImages && scannedImages.length > 0) {
        const originalUri = scannedImages[0];
        const newFileName = `ticket_${Date.now()}.jpg`; 
        const renamedUri = await renameFile(originalUri, newFileName);
        
        setScannedImageUri(renamedUri);
        await uploadScannedImage(renamedUri);
      } else {
        Alert.alert('Scan Canceled', 'No document was scanned.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      Alert.alert('Error', 'Error during scan.');
    } finally {
      setIsLoading(false);
    }
  };


  const uploadScannedImage = async (uri: string) => {
    setScreen('processing');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'ticket.jpg',
      });
      formData.append('foreman_id', String(user?.id));
      console.log('Uploading scanned ticket...');
      const response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', response.status);
      const textResponse = await response.text();
      // ... (rest of uploadScannedImage logic remains the same)
      let result;
      try {
        result = JSON.parse(textResponse);
      } catch (e) {
        Alert.alert('Scan Failed', 'Invalid JSON from server.');
        setScreen('dashboard');
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        Alert.alert('Scan Successful');
        setScreen('dashboard');
        setScannedImageUri(null);
      } else {
        Alert.alert('Scan Failed', result.detail || 'Could not process image.');
        setScreen('dashboard');
      }
    } catch (err) {
      console.log('Unexpected scan error:', err);
      Alert.alert('Error', 'Unexpected error while scanning.');
      setScreen('dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewTickets = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/api/ocr/images-by-date/${user?.id}`);
    if (response.ok) {
      const data = await response.json();
      setImagesByDate(data.imagesByDate || []);
      setScreen('review');
    } else {
      const errorData = await response.json();
      Alert.alert('Fetch Failed', errorData.detail || 'Could not retrieve images.');
    }
  } catch {
    Alert.alert('Error', 'An error occurred while fetching images.');
  } finally {
    setIsLoading(false);
  }
};
console.log('Current user:', user);


  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
      <TouchableOpacity onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  if (screen === 'dashboard') {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.content}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#28a745', marginTop: 20 }]}
            onPress={handleScanDocument}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Scan Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleReviewTickets} disabled={isLoading}>
            <Text style={styles.buttonText}>Review Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 20 }]}
            onPress={() => navigation.navigate('TimesheetList')}
          >
            <Text style={styles.buttonText}>View My Timesheets</Text>
          </TouchableOpacity>
        </View>
        {isLoading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
      </SafeAreaView>
    );
  }

  if (screen === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <Text style={styles.title}>Processing...</Text>
        {scannedImageUri && (
          <Image style={styles.previewImage} source={{ uri: scannedImageUri }} />
        )}
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  if (screen === 'review') {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <Text style={styles.title}>Scanned Images by Date</Text>
        <ScrollView contentContainerStyle={styles.reviewScrollViewContent}>
          {imagesByDate.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>No images found</Text>
          ) : (
            imagesByDate.map(group => (
              <View key={group.date} style={styles.dateGroupContainer}>
                <Text style={styles.dateTitle}>{group.date}</Text>
                
                {/* Horizontal Scroll View for Thumbnails */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailScrollContainer}
                >
                  {group.images.map((img) => (
                    <TouchableOpacity
                      key={img.id}
                      style={styles.thumbnailWrapper}
                      onPress={() => {
                        console.log('Opening image uri:', `${API_BASE_URL}${img.image_url}`);
                        setFullImageUri(`${API_BASE_URL}${img.image_url}`);
                      }}
                    >
                      <Image
                        source={{ uri: `${API_BASE_URL}${img.image_url}` }}
                        style={styles.thumbnailImage}
                        resizeMode="contain" // Crucial: Use 'contain' to preserve aspect ratio
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))
          )}
        </ScrollView>
        {/* Full-screen image modal */}
        {fullImageUri && (
          <View style={styles.fullImageContainer}>
            <Image source={{ uri: fullImageUri }} style={styles.fullImage} />
            <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.buttonWide} onPress={() => setScreen('dashboard')}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <Text>Loading...</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- Existing Styles (Kept for completeness) ---
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  welcomeText: { fontSize: 22, fontWeight: 'bold' },
  logoutText: { fontSize: 16, color: '#ff6347' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  previewImage: { width: '100%', height: 300, resizeMode: 'contain', borderRadius: 10, marginBottom: 20 },
  buttonWide: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    width: '90%',
    alignSelf: 'center', 
  },
  fullImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  fullImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    borderRadius: 5,
  },
  
  // --- Updated Styles for Horizontal Scroll Review Screen ---

  reviewScrollViewContent: {
    paddingBottom: 20, 
    paddingHorizontal: 5,
  },
  dateGroupContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
    paddingHorizontal: 10,
  },
  thumbnailScrollContainer: {
    alignItems: 'center', // Vertically center thumbnails
    paddingHorizontal: 5,
  },
  thumbnailWrapper: {
    height: THUMBNAIL_HEIGHT,
    minWidth: 100, // Ensure a minimum width for very tall documents
    marginHorizontal: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  thumbnailImage: {
    height: '100%',
    width: '100%', // The width will be determined by the image's aspect ratio
    resizeMode: 'contain', // Key to preserving aspect ratio
  },
});

export default ForemanDashboard;