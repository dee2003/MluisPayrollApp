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
//   ActivityIndicator,
//   Dimensions,
//   Button, 
// } from 'react-native';
// import { useAuth } from '../../context/AuthContext';
// import DocumentScanner from 'react-native-document-scanner-plugin';
// import RNFS from 'react-native-fs';
// import axios from "axios";
// type TicketImage = {
//   id: number;
//   image_url: string;
//   job_phase_id: number;  // ensure your data has this field
// };

// const { width } = Dimensions.get('window');
// const THUMBNAIL_HEIGHT = 150; // Set a fixed height for the horizontal carousel

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
//   // const [imagesByDate, setImagesByDate] = useState<{ date: string; images: { id: number; image_url: string }[] }[]>([]);
//   const [imagesByDate, setImagesByDate] = useState<{ date: string; images: TicketImage[] }[]>([]);
//   const [fullImageUri, setFullImageUri] = useState<string | null>(null);

//   const [screen, setScreen] = useState<'dashboard' | 'scanning' | 'processing' | 'review'>('dashboard');
//   const [isLoading, setIsLoading] = useState(false);
//   const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
//   const [tickets, setTickets] = useState<{ id: number; extracted_text: string; image_url: string }[]>([]);

//   const handleScanDocument = async () => {
//     try {
//       setIsLoading(true);
//       const { scannedImages } = await DocumentScanner.scanDocument({ maxNumDocuments: 1 });
//       if (scannedImages && scannedImages.length > 0) {
//         const originalUri = scannedImages[0];
//         const newFileName = `ticket_${Date.now()}.jpg`; 
//         const renamedUri = await renameFile(originalUri, newFileName);
        
//         setScannedImageUri(renamedUri);
//         await uploadScannedImage(renamedUri);
//       } else {
//         Alert.alert('Scan Canceled', 'No document was scanned.');
//       }
//     } catch (err) {
//       console.error('Scan error:', err);
//       Alert.alert('Error', 'Error during scan.');
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const uploadScannedImage = async (uri: string) => {
//     setScreen('processing');
//     setIsLoading(true);

//     try {
//       const formData = new FormData();
//       formData.append('file', {
//         uri: uri,
//         type: 'image/jpeg',
//         name: 'ticket.jpg',
//       }as any);
//       formData.append('foreman_id', String(user?.id));
//       console.log('Uploading scanned ticket...');
//       const response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
//         method: 'POST',
//         body: formData,
//       });

//       console.log('Response received:', response.status);
//       const textResponse = await response.text();
//       // ... (rest of uploadScannedImage logic remains the same)
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

//   const handleReviewTickets = async () => {
//   setIsLoading(true);
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/ocr/images-by-date/${user?.id}`);
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
// console.log('Current user:', user);

// const handleSubmit = async (date: string, ticketIds: number[]) => {
//   if (!user?.id) {
//     Alert.alert("Error", "User not logged in");
//     return;
//   }

//   try {
//     console.log("Submitting tickets:", { date, foreman_id: user.id, ticket_ids: ticketIds });

//     await axios.post(`${API_BASE_URL}/api/submissions/`, {
//       date,
//       foreman_id: user.id,
//       ticket_ids: ticketIds, // no job_phase_id needed
//     });

//     Alert.alert("Submitted!", "Tickets sent for review.");

//     // Disable submit button for this date
//     setImagesByDate(prev =>
//       prev.map(group =>
//         group.date === date ? { ...group, submitted: true } : group
//       )
//     );

//   } catch (e: any) {
//     Alert.alert("Submission error", e.response?.data?.detail || e.message);
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

//   if (screen === 'review') {
//     return (
//       <SafeAreaView style={styles.container}>
//         {renderHeader()}
//         <Text style={styles.title}>Scanned Images by Date</Text>
//         <ScrollView contentContainerStyle={styles.reviewScrollViewContent}>
//           {imagesByDate.length === 0 ? (
//             <Text style={{ textAlign: 'center', marginTop: 20 }}>No images found</Text>
//           ) : (
//             imagesByDate.map(group => (
//               <View key={group.date} style={styles.dateGroupContainer}>
//                 <Text style={styles.dateTitle}>{group.date}</Text>
                
//                 {/* Horizontal Scroll View for Thumbnails */}
//                 <ScrollView 
//                   horizontal 
//                   showsHorizontalScrollIndicator={false}
//                   contentContainerStyle={styles.thumbnailScrollContainer}
//                 >
//                   {group.images.map((img) => (
//                     <TouchableOpacity
//                       key={img.id}
//                       style={styles.thumbnailWrapper}
//                       onPress={() => {
//                         console.log('Opening image uri:', `${API_BASE_URL}${img.image_url}`);
//                         setFullImageUri(`${API_BASE_URL}${img.image_url}`);
//                       }}
//                     >
//                       <Image
//                         source={{ uri: `${API_BASE_URL}${img.image_url}` }}
//                         style={styles.thumbnailImage}
//                         resizeMode="contain" // Crucial: Use 'contain' to preserve aspect ratio
//                       />
//                     </TouchableOpacity>
//                   ))}
//                 </ScrollView>
//                 <Button
//   title={group.submitted ? "Submitted" : "Submit"}
//   disabled={group.submitted}
//   onPress={() => handleSubmit(group.date, group.images.map(img => img.id))}
// />

//               </View>
//             ))
//           )}
//         </ScrollView>
//         {/* Full-screen image modal */}
//         {fullImageUri && (
//           <View style={styles.fullImageContainer}>
//             <Image source={{ uri: fullImageUri }} style={styles.fullImage} />
//             <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
//               <Text style={{ color: '#fff' }}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         )}
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
//   // --- Existing Styles (Kept for completeness) ---
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
//   buttonWide: {
//     backgroundColor: '#007bff',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 10,
//     width: '90%',
//     alignSelf: 'center', 
//   },
//   fullImageContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.9)', 
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
//     backgroundColor: 'rgba(255, 255, 255, 0.2)', 
//     borderRadius: 5,
//   },
  
//   // --- Updated Styles for Horizontal Scroll Review Screen ---

//   reviewScrollViewContent: {
//     paddingBottom: 20, 
//     paddingHorizontal: 5,
//   },
//   dateGroupContainer: {
//     marginBottom: 15,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     paddingTop: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 1.5,
//     elevation: 2,
//   },
//   dateTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     paddingBottom: 5,
//     paddingHorizontal: 10,
//   },
//   thumbnailScrollContainer: {
//     alignItems: 'center', // Vertically center thumbnails
//     paddingHorizontal: 5,
//   },
//   thumbnailWrapper: {
//     height: THUMBNAIL_HEIGHT,
//     minWidth: 100, // Ensure a minimum width for very tall documents
//     marginHorizontal: 5,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     overflow: 'hidden',
//   },
//   thumbnailImage: {
//     height: '100%',
//     width: '100%', // The width will be determined by the image's aspect ratio
//     resizeMode: 'contain', // Key to preserving aspect ratio
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
  Button,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import DocumentScanner from 'react-native-document-scanner-plugin';
import RNFS from 'react-native-fs';
import axios from "axios";

type TicketImage = {
  id: number;
  image_url: string;
  job_phase_id?: number; // optional defensive
};

type DateGroup = {
  date: string;
  images: TicketImage[];
  submitted?: boolean; // added so TS knows about it
};

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

  // now DateGroup[] which includes optional submitted flag
  const [imagesByDate, setImagesByDate] = useState<{ date: string; images: TicketImage[]; submitted?: boolean }[]>([]);

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
      } as any);
      formData.append('foreman_id', String(user?.id));
      console.log('Uploading scanned ticket...');
      const response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', response.status);
      const textResponse = await response.text();
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

        // Normalize server response into DateGroup[] and ensure `submitted` exists
        const groups: DateGroup[] = (data.imagesByDate || []).map((g: any) => ({
          date: g.date,
          images: (g.images || []).map((img: any) => ({
            id: img.id,
            image_url: img.image_url,
            job_phase_id: img.job_phase_id,
          })),
          // derive submitted from server property if present, fallback to false
          submitted: g.submitted ?? g.sent ?? false,
        }));

        setImagesByDate(groups);
        setScreen('review');
      } else {
        const errorData = await response.json();
        Alert.alert('Fetch Failed', errorData.detail || 'Could not retrieve images.');
      }
    } catch (err) {
      console.error('Fetch images error:', err);
      Alert.alert('Error', 'An error occurred while fetching images.');
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Current user:', user);

  const handleSubmit = async (date: string, ticketIds: number[]) => {
  if (!user?.id) {
    Alert.alert("Error", "User not logged in");
    return;
  }

  try {
    console.log("Submitting tickets:", { date, foreman_id: user.id, ticket_ids: ticketIds });

    await axios.post(`${API_BASE_URL}/api/submissions/`, {
      date,
      foreman_id: user.id,
      ticket_ids: ticketIds,
    });

    // ✅ Show message with total ticket count
    Alert.alert(
      "Submitted!",
      `Today's total tickets: ${ticketIds.length}\nSubmission successful.`
    );

    // Disable the submit button for this date
    setImagesByDate(prev =>
      prev.map(group =>
        group.date === date ? { ...group, submitted: true } : group
      )
    );

  } catch (e: any) {
    Alert.alert("Submission error", e.response?.data?.detail || e.message);
  }
};


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

      {/* Top bar with back arrow and title */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setScreen('dashboard')} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scanned Images by Date</Text>
      </View>

      <ScrollView contentContainerStyle={styles.reviewScrollViewContent}>
        {imagesByDate.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No images found</Text>
        ) : (
          imagesByDate.map(group => (
            <View key={group.date} style={styles.dateGroupContainer}>
              <View style={styles.dateHeaderRow}>
                <Text style={styles.dateTitle}>📅 {group.date}</Text>
                <Text style={styles.ticketCount}>🎟️ Tickets: {group.images.length}</Text>
              </View>

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
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Submit button */}
              <View style={{ marginVertical: 8, paddingHorizontal: 10 }}>
                <Button
                  title={group.submitted ? "Submitted" : "Submit"}
                  disabled={group.submitted}
                  onPress={() => handleSubmit(group.date, group.images.map(img => img.id))}
                />
              </View>
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
  topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,
  paddingHorizontal: 10,
},

backButton: {
  position: 'absolute',
  left: 10,
  padding: 5,
  zIndex: 1,
},

backArrow: {
  fontSize: 26,
  color: '#007bff',
  fontWeight: 'bold',
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
  dateHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 10,
  marginBottom: 5,
},
ticketCount: {
  fontSize: 16,
  fontWeight: '500',
  color: '#555',
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
