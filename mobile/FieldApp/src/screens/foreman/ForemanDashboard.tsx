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
//   job_phase_id?: number; // optional defensive
// };

// type DateGroup = {
//   date: string;
//   images: TicketImage[];
//   submitted?: boolean; // added so TS knows about it
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

//   // now DateGroup[] which includes optional submitted flag
//   const [imagesByDate, setImagesByDate] = useState<{ date: string; images: TicketImage[]; submitted?: boolean }[]>([]);

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
//       } as any);
//       formData.append('foreman_id', String(user?.id));
//       console.log('Uploading scanned ticket...');
//       const response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
//         method: 'POST',
//         body: formData,
//       });

//       console.log('Response received:', response.status);
//       const textResponse = await response.text();
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
//     setIsLoading(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/ocr/images-by-date/${user?.id}`);
//       if (response.ok) {
//         const data = await response.json();

//         // Normalize server response into DateGroup[] and ensure `submitted` exists
//         const groups: DateGroup[] = (data.imagesByDate || []).map((g: any) => ({
//           date: g.date,
//           images: (g.images || []).map((img: any) => ({
//             id: img.id,
//             image_url: img.image_url,
//             job_phase_id: img.job_phase_id,
//           })),
//           // derive submitted from server property if present, fallback to false
//           submitted: g.status === "PENDING_REVIEW" || g.status === "APPROVED",
//         }));

//         setImagesByDate(groups);
//         setScreen('review');
//       } else {
//         const errorData = await response.json();
//         Alert.alert('Fetch Failed', errorData.detail || 'Could not retrieve images.');
//       }
//     } catch (err) {
//       console.error('Fetch images error:', err);
//       Alert.alert('Error', 'An error occurred while fetching images.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   console.log('Current user:', user);

//   const handleSubmit = async (date: string, ticketIds: number[]) => {
//   if (!user?.id) {
//     Alert.alert("Error", "User not logged in");
//     return;
//   }

//   try {
//     console.log("Submitting tickets:", { date, foreman_id: user.id, ticket_ids: ticketIds });

//     await axios.post(`${API_BASE_URL}/api/submissions/`, {
//       date,
//       foreman_id: user.id,
//       ticket_ids: ticketIds,
//     });

//     // ✅ Show message with total ticket count
//     Alert.alert(
//       "Submitted!",
//       `Today's total tickets: ${ticketIds.length}\nSubmission successful.`
//     );

//     // Disable the submit button for this date
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
//   return (
//     <SafeAreaView style={styles.container}>
//       {renderHeader()}

//       {/* Top bar with back arrow and title */}
//       <View style={styles.topBar}>
//         <TouchableOpacity onPress={() => setScreen('dashboard')} style={styles.backButton}>
//           <Text style={styles.backArrow}>←</Text>
//         </TouchableOpacity>
//         <Text style={styles.title}>Scanned Images by Date</Text>
//       </View>

//       <ScrollView contentContainerStyle={styles.reviewScrollViewContent}>
//         {imagesByDate.length === 0 ? (
//           <Text style={{ textAlign: 'center', marginTop: 20 }}>No images found</Text>
//         ) : (
//           imagesByDate.map(group => (
//             <View key={group.date} style={styles.dateGroupContainer}>
//               <View style={styles.dateHeaderRow}>
//                 <Text style={styles.dateTitle}>📅 {group.date}</Text>
//                 <Text style={styles.ticketCount}>🎟️ Tickets: {group.images.length}</Text>
//               </View>

//               {/* Horizontal Scroll View for Thumbnails */}
//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.thumbnailScrollContainer}
//               >
//                 {group.images.map((img) => (
//                   <TouchableOpacity
//                     key={img.id}
//                     style={styles.thumbnailWrapper}
//                     onPress={() => {
//                       console.log('Opening image uri:', `${API_BASE_URL}${img.image_url}`);
//                       setFullImageUri(`${API_BASE_URL}${img.image_url}`);
//                     }}
//                   >
//                     <Image
//                       source={{ uri: `${API_BASE_URL}${img.image_url}` }}
//                       style={styles.thumbnailImage}
//                       resizeMode="contain"
//                     />
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>

//               {/* Submit button */}
//               <View style={{ marginVertical: 8, paddingHorizontal: 10 }}>
//                 <Button
//                   title={group.submitted ? "Submitted" : "Submit"}
//                   disabled={group.submitted}
//                   onPress={() => handleSubmit(group.date, group.images.map(img => img.id))}
//                 />
//               </View>
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
//   topBar: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   justifyContent: 'center',
//   marginBottom: 10,
//   paddingHorizontal: 10,
// },

// backButton: {
//   position: 'absolute',
//   left: 10,
//   padding: 5,
//   zIndex: 1,
// },

// backArrow: {
//   fontSize: 26,
//   color: '#007bff',
//   fontWeight: 'bold',
// },

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
//   dateHeaderRow: {
//   flexDirection: 'row',
//   justifyContent: 'space-between',
//   alignItems: 'center',
//   paddingHorizontal: 10,
//   marginBottom: 5,
// },
// ticketCount: {
//   fontSize: 16,
//   fontWeight: '500',
//   color: '#555',
// },

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
  ImageBackground,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import DocumentScanner from 'react-native-document-scanner-plugin';
import RNFS from 'react-native-fs';
import axios from "axios";
import Icon from 'react-native-vector-icons/Feather';

// --- Theme Configuration ---
const theme = {
  colors: {
    primary: '#4A5C4D',
    backgroundLight: '#F8F7F2',
    contentLight: '#3D3D3D',
    subtleLight: '#797979',
    cardLight: '#FFFFFF',
    borderSubtleLight: '#E5E5E5',
    brandSand: '#F0EAD6',
    brandClay: '#A87E6F',
    brandStone: '#8E8E8E',
    brandSky: '#A7C5D8',
  },
  fontFamily: {
    display: 'Manrope',
  },
  borderRadius: {
    default: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};


type TicketImage = {
  id: number;
  image_url: string;
  job_phase_id?: number;
};


type DateGroup = {
  date: string;
  images: TicketImage[];
  submitted?: boolean;
};


const { width } = Dimensions.get('window');
const THUMBNAIL_HEIGHT = 150;


const renameFile = async (oldUri: string, newFileName: string): Promise<string> => {
    try {
        const oldPath = oldUri.startsWith('file://') ? oldUri.substring(7) : oldUri;
        const newPath = `${RNFS.DocumentDirectoryPath}/${newFileName}`;
        await RNFS.moveFile(oldPath, newPath);
        return `file://${newPath}`;
    } catch (error) {
        console.error('Rename error:', error);
        return oldUri;
    }
};


const API_BASE_URL = 'https://coated-nonattributive-babara.ngrok-free.dev';


const ForemanDashboard = ({ navigation }: { navigation: any }) => {
    const { user, logout } = useAuth();
    const [imagesByDate, setImagesByDate] = useState<DateGroup[]>([]);
    const [fullImageUri, setFullImageUri] = useState<string | null>(null);
    const [screen, setScreen] = useState<'dashboard' | 'processing' | 'review'>('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);


    // --- Core Logic Functions (Unchanged) ---
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


    const uploadScannedImage = async (uri: string, jobPhaseId?: number) => {
        setScreen('processing');
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', { uri, type: 'image/jpeg', name: 'ticket.jpg' } as any);
            formData.append('foreman_id', String(user?.id));
            if (jobPhaseId != null) {
                formData.append('job_phase_id', String(jobPhaseId));
            } else {
                formData.append('job_phase_id', '');
            }
            const response = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (response.ok) {
                Alert.alert('Scan Successful');
            } else {
                Alert.alert('Scan Failed', result.detail || 'Could not process image.');
            }
        } catch (err) {
            console.log('Unexpected scan error:', err);
            Alert.alert('Error', 'Unexpected error while scanning.');
        } finally {
            setScreen('dashboard');
            setIsLoading(false);
        }
    };


    const handleReviewTickets = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/ocr/images-by-date/${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                const groups: DateGroup[] = (data.imagesByDate || []).map((g: any) => ({
                    date: g.date,
                    images: (g.images || []).map((img: any) => ({
                        id: img.id,
                        image_url: img.image_url,
                        job_phase_id: img.job_phase_id,
                    })),
                    submitted: g.status === "PENDING_REVIEW" || g.status === "APPROVED",
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


    const handleSubmit = async (date: string, ticketIds: number[]) => {
        if (!user?.id) {
            Alert.alert("Error", "User not logged in");
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/submissions/`, {
                date,
                foreman_id: user.id,
                ticket_ids: ticketIds,
            });
            Alert.alert("Submitted!", `A total of ${ticketIds.length} tickets for ${date} have been submitted.`);
            setImagesByDate(prev =>
                prev.map(group =>
                    group.date === date ? { ...group, submitted: true } : group
                )
            );
        } catch (e: any) {
            Alert.alert("Submission error", e.response?.data?.detail || e.message);
        }
    };


    // --- UI Components ---


    const AppHeader = () => (
        <View style={styles.header}>
            <Image
                source={require('../../assets/profile-placeholder.png')} // CORRECT: Using local asset
                style={styles.headerProfileImage}
            />
            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerButton} onPress={logout}>
                    <Icon name="log-out" size={24} color={theme.colors.contentLight} />
                </TouchableOpacity>
            </View>
        </View>
    );


    const ActionCard = ({ title, subtitle, imageUrl, onPress }: { title: string, subtitle: string, imageUrl: number, onPress: () => void }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <ImageBackground
                    source={imageUrl}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: theme.borderRadius.lg }}
                />
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardSubtitle}>{subtitle}</Text>
                </View>
                <TouchableOpacity style={styles.cardButton} onPress={onPress}>
                    <Icon name="chevron-right" size={20} color={theme.colors.contentLight} />
                </TouchableOpacity>
            </View>
        </View>
    );


    const BottomNavBar = () => (
        <View style={styles.footer}>
            <View style={styles.navBar}>
                <TouchableOpacity style={styles.navItem}>
                    <View style={styles.navIconContainer}>
                        <Icon name="home" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.navLabelActive}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={handleScanDocument}>
                    <View style={styles.navIconContainer}>
                        <Icon name="camera" size={24} color={theme.colors.brandStone} />
                    </View>
                    <Text style={styles.navLabel}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={handleReviewTickets}>
                    <View style={styles.navIconContainer}>
                         <Icon name="file-text" size={24} color={theme.colors.brandStone} />
                    </View>
                    <Text style={styles.navLabel}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TimesheetList')}>
                    <View style={styles.navIconContainer}>
                        <Icon name="calendar" size={24} color={theme.colors.brandStone} />
                    </View>
                    <Text style={styles.navLabel}>Timesheets</Text>
                </TouchableOpacity>
            </View>
        </View>
    );


    // --- Screen Rendering Logic ---


    if (screen === 'dashboard') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <AppHeader />
                        <View style={styles.mainContent}>
                            <View style={styles.welcomeHeader}>
                                <Text style={styles.welcomeTitle}>Welcome, {user?.username || 'Foreman'}</Text>
                                <Text style={styles.welcomeSubtitle}>What would you like to do today?</Text>
                            </View>
                            <View style={styles.actionsContainer}>
                                <ActionCard
                                    title="Scan Documents"
                                    subtitle="Scan and upload job phase documents."
                                    imageUrl={require('../../assets/scan-documents.png')} // CORRECT
                                    onPress={handleScanDocument}
                                />
                                <ActionCard
                                    title="Review Tickets"
                                    subtitle="Manage submitted tickets for accuracy."
                                    imageUrl={require('../../assets/review-tickets.png')} // CORRECT
                                    onPress={handleReviewTickets}
                                />
                                <ActionCard
                                    title="Timesheets"
                                    subtitle="Access and manage your timesheets."
                                    imageUrl={require('../../assets/timesheets.png')} // CORRECT
                                    onPress={() => navigation.navigate('TimesheetList')}
                                />
                            </View>
                        </View>
                    </ScrollView>
                    <BottomNavBar />
                    {isLoading && <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={theme.colors.primary} />}
                </View>
            </SafeAreaView>
        );
    }
    
    // ... (rest of the code is unchanged)

    if (screen === 'processing') {
        return (
          <SafeAreaView style={oldStyles.container}>
            <View style={oldStyles.content}>
                <Text style={oldStyles.title}>Processing...</Text>
                {scannedImageUri && <Image style={oldStyles.previewImage} source={{ uri: scannedImageUri }} />}
                <ActivityIndicator size="large" color="#005A9C" />
            </View>
          </SafeAreaView>
        );
       }
   
       if (screen === 'review') {
           return (
               <SafeAreaView style={oldStyles.container}>
                   <View style={oldStyles.topBar}>
                       <TouchableOpacity onPress={() => setScreen('dashboard')} style={oldStyles.backButton}>
                           <Icon name="arrow-left" size={24} color="#005A9C" />
                       </TouchableOpacity>
                       <Text style={oldStyles.title}>Review Scanned Tickets</Text>
                   </View>
                   <ScrollView contentContainerStyle={oldStyles.reviewScrollViewContent}>
                       {isLoading ? <ActivityIndicator size="large" color="#005A9C" /> :
                       imagesByDate.length === 0 ? (
                           <View style={oldStyles.emptyStateContainer}>
                               <Icon name="inbox" size={40} color="#9CA3AF" />
                               <Text style={oldStyles.emptyStateText}>No tickets found.</Text>
                               <Text style={oldStyles.emptyStateSubText}>Scan a new ticket to get started.</Text>
                           </View>
                       ) : (
                           imagesByDate.map(group => (
                               <View key={group.date} style={oldStyles.dateGroupContainer}>
                                   <View style={oldStyles.dateHeaderRow}>
                                       <Text style={oldStyles.dateTitle}>{group.date}</Text>
                                       <Text style={oldStyles.ticketCount}>{group.images.length} Tickets</Text>
                                   </View>
                                   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={oldStyles.thumbnailScrollContainer}>
                                       {group.images.map((img) => (
                                           <TouchableOpacity
                                               key={img.id}
                                               style={oldStyles.thumbnailWrapper}
                                               onPress={() => setFullImageUri(`${API_BASE_URL}${img.image_url}`)}
                                           >
                                               <Image
                                                   source={{ uri: `${API_BASE_URL}${img.image_url}` }}
                                                   style={oldStyles.thumbnailImage}
                                               />
                                           </TouchableOpacity>
                                       ))}
                                   </ScrollView>
                                   <TouchableOpacity
                                       style={[oldStyles.submitButton, group.submitted && oldStyles.submitButtonDisabled]}
                                       onPress={() => handleSubmit(group.date, group.images.map(img => img.id))}
                                       disabled={group.submitted}
                                   >
                                       <Icon name={group.submitted ? "check-circle" : "send"} size={18} color="#fff" />
                                       <Text style={oldStyles.submitButtonText}>{group.submitted ? "Submitted" : "Submit All Tickets"}</Text>
                                   </TouchableOpacity>
                               </View>
                           ))
                       )}
                   </ScrollView>
                   {fullImageUri && (
                       <View style={oldStyles.fullImageContainer}>
                           <Image source={{ uri: fullImageUri }} style={oldStyles.fullImage} resizeMode="contain" />
                           <TouchableOpacity style={oldStyles.closeButton} onPress={() => setFullImageUri(null)}>
                               <Icon name="x" size={28} color="#fff" />
                           </TouchableOpacity>
                       </View>
                   )}
               </SafeAreaView>
           );
       }
       
       return (
           <SafeAreaView style={styles.safeArea}>
               <View style={styles.container}>
                   <ActivityIndicator size="large" color={theme.colors.primary} />
               </View>
           </SafeAreaView>
       );
   };
   
   // --- Final StyleSheet ---
   const styles = StyleSheet.create({
       safeArea: {
           flex: 1,
           backgroundColor: theme.colors.backgroundLight,
       },
       container: {
           flex: 1,
       },
       scrollContent: {
           flexGrow: 1,
           paddingBottom: 80,
       },
       header: {
           flexDirection: 'row',
           alignItems: 'center',
           justifyContent: 'space-between',
           padding: 24,
           backgroundColor: 'transparent',
       },
       headerProfileImage: {
           width: 40,
           height: 40,
           borderRadius: theme.borderRadius.full,
       },
       headerRight: {
           width: 40,
           alignItems: 'flex-end',
       },
       headerButton: {
           padding: 8,
           borderRadius: theme.borderRadius.full,
       },
       mainContent: {
           paddingHorizontal: 24,
       },
       welcomeHeader: {
           marginBottom: 32,
       },
       welcomeTitle: {
           fontFamily: theme.fontFamily.display,
           fontSize: 30,
           fontWeight: 'bold',
           color: theme.colors.contentLight,
           marginBottom: 4,
       },
       welcomeSubtitle: {
           fontFamily: theme.fontFamily.display,
           color: theme.colors.subtleLight,
       },
       actionsContainer: {
           gap: 20,
       },
       card: {
           backgroundColor: theme.colors.cardLight,
           borderRadius: theme.borderRadius.xl,
           overflow: 'hidden',
           shadowColor: "#000",
           shadowOffset: {
               width: 0,
               height: 2,
           },
           shadowOpacity: 0.05,
           shadowRadius: 8,
           elevation: 3,
       },
       cardContent: {
           flexDirection: 'row',
           alignItems: 'center',
           padding: 20,
           gap: 20,
       },
       cardImage: {
           width: 80,
           height: 80,
           backgroundColor: theme.colors.borderSubtleLight,
       },
       cardTextContainer: {
           flex: 1,
       },
       cardTitle: {
           fontFamily: theme.fontFamily.display,
           fontSize: 16,
           fontWeight: 'bold',
           color: theme.colors.contentLight,
       },
       cardSubtitle: {
           fontFamily: theme.fontFamily.display,
           fontSize: 14,
           color: theme.colors.subtleLight,
           marginTop: 4,
       },
       cardButton: {
           padding: 12,
           borderRadius: theme.borderRadius.full,
           backgroundColor: 'rgba(0, 0, 0, 0.05)',
       },
       footer: {
           position: 'absolute',
           bottom: 0,
           left: 0,
           right: 0,
           backgroundColor: 'rgba(248, 247, 242, 0.92)',
           borderTopWidth: 1,
           borderTopColor: 'rgba(229, 229, 229, 0.4)',
       },
       navBar: {
           flexDirection: 'row',
           justifyContent: 'space-around',
           paddingHorizontal: 8,
           paddingVertical: 4,
       },
       navItem: {
           flex: 1,
           alignItems: 'center',
           justifyContent: 'center',
           gap: 4,
           padding: 8,
           borderRadius: theme.borderRadius.lg,
       },
       navIconContainer: {
           width: 32,
           height: 32,
           alignItems: 'center',
           justifyContent: 'center',
       },
       navLabel: {
           fontFamily: theme.fontFamily.display,
           fontSize: 12,
           fontWeight: '500',
           color: theme.colors.brandStone,
       },
       navLabelActive: {
           fontFamily: theme.fontFamily.display,
           fontSize: 12,
           fontWeight: '500',
           color: theme.colors.primary,
       },
   });
   
   const oldStyles = StyleSheet.create({
       container: {
           flex: 1,
           backgroundColor: '#F4F7FC',
       },
       content: {
           flex: 1,
           padding: 20,
           justifyContent: 'center',
           alignItems: 'center'
       },
       topBar: {
           flexDirection: 'row',
           alignItems: 'center',
           justifyContent: 'center',
           paddingVertical: 15,
           paddingHorizontal: 20,
           backgroundColor: '#FFFFFF',
           borderBottomWidth: 1,
           borderBottomColor: '#E5E7EB',
       },
       backButton: {
           position: 'absolute',
           left: 20,
           padding: 5,
       },
       title: {
           fontSize: 20,
           fontWeight: '600',
           color: '#1F2937',
       },
       previewImage: {
           width: '100%',
           height: 300,
           borderRadius: 16,
           marginBottom: 20,
           borderWidth: 1,
           borderColor: '#D1D5DB',
       },
       reviewScrollViewContent: {
           padding: 16,
       },
       dateGroupContainer: {
           marginBottom: 24,
           backgroundColor: '#FFFFFF',
           borderRadius: 16,
           padding: 16,
           shadowColor: '#9CA3AF',
           shadowOffset: { width: 0, height: 2 },
           shadowOpacity: 0.1,
           shadowRadius: 8,
           elevation: 4,
       },
       dateHeaderRow: {
           flexDirection: 'row',
           justifyContent: 'space-between',
           alignItems: 'center',
           marginBottom: 12,
       },
       dateTitle: {
           fontSize: 18,
           fontWeight: '600',
           color: '#1F2937',
       },
       ticketCount: {
           fontSize: 14,
           fontWeight: '500',
           color: '#6B7280',
           backgroundColor: '#F3F4F6',
           paddingHorizontal: 8,
           paddingVertical: 4,
           borderRadius: 8,
       },
       thumbnailScrollContainer: {
           paddingVertical: 8,
       },
       thumbnailWrapper: {
           height: THUMBNAIL_HEIGHT,
           width: width * 0.25,
           marginHorizontal: 6,
           borderRadius: 8,
           borderWidth: 1,
           borderColor: '#E5E7EB',
           overflow: 'hidden',
           justifyContent: 'center',
           alignItems: 'center',
           backgroundColor: '#F9FAFB',
       },
       thumbnailImage: {
           height: '100%',
           width: '100%',
       },
       submitButton: {
           flexDirection: 'row',
           alignItems: 'center',
           justifyContent: 'center',
           backgroundColor: '#16A34A',
           paddingVertical: 12,
           borderRadius: 10,
           marginTop: 12,
       },
       submitButtonDisabled: {
           backgroundColor: '#9CA3AF',
       },
       submitButtonText: {
           color: '#FFFFFF',
           fontSize: 16,
           fontWeight: '600',
           marginLeft: 8,
       },
       fullImageContainer: {
           ...StyleSheet.absoluteFillObject,
           backgroundColor: 'rgba(17, 24, 39, 0.9)',
           justifyContent: 'center',
           alignItems: 'center',
       },
       fullImage: {
           width: '95%',
           height: '85%',
       },
       closeButton: {
           position: 'absolute',
           top: 50,
           right: 20,
           backgroundColor: 'rgba(0, 0, 0, 0.3)',
           borderRadius: 20,
           padding: 8,
       },
       emptyStateContainer: {
           flex: 1,
           justifyContent: 'center',
           alignItems: 'center',
           padding: 20,
           marginTop: width * 0.2,
       },
       emptyStateText: {
           fontSize: 18,
           fontWeight: '600',
           color: '#4B5563',
           marginTop: 16,
       },
       emptyStateSubText: {
           fontSize: 14,
           color: '#9CA3AF',
           marginTop: 4,
           textAlign: 'center',
       },
   });
   
   export default ForemanDashboard;
