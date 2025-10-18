// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   SafeAreaView,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
// import apiClient from '../../api/apiClient';
// import type { SupervisorStackParamList } from '../../navigation/AppNavigator';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { StackNavigationProp } from '@react-navigation/stack';

// type Ticket = {
//   id: number;
//   ticket_number: string;
//   job_name: string;
// };

// type TicketListRouteProp = RouteProp<SupervisorStackParamList, 'SupervisorTicketList'>;
// type NavigationProp = StackNavigationProp<SupervisorStackParamList, 'SupervisorTicketList'>;

// const COLORS = {
//   primary: '#007AFF',
//   background: '#F2F2F7',
//   card: '#FFFFFF',
//   textPrimary: '#1C1C1E',
//   textSecondary: '#636366',
//   border: '#E5E5EA',
// };

// const SupervisorTicketListScreen = () => {
//   const route = useRoute<TicketListRouteProp>();
//   const navigation = useNavigation<NavigationProp>();
//   const { foremanId, date } = route.params;

//   const [tickets, setTickets] = useState<Ticket[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchTickets = async () => {
//       setLoading(true);
//       try {
//         const response = await apiClient.get<Ticket[]>(
//           `/api/tickets/for-supervisor?foreman_id=${foremanId}&date=${date}`
//         );
//         setTickets(response.data);
//       } catch (error: any) {
//         console.error('Failed to fetch tickets:', error);
//         Alert.alert('Error', 'Could not load tickets for this entry.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTickets();
//   }, [foremanId, date]);
  
//   const handleSelectTicket = (ticketId: number) => {
//     // Implement navigation to a ticket detail/review screen if you have one
//     Alert.alert("Navigate", `Would navigate to Ticket ID: ${ticketId}`);
//   };

//   const renderTicketItem = ({ item }: { item: Ticket }) => (
//     <TouchableOpacity style={styles.card} onPress={() => handleSelectTicket(item.id)}>
//       <View style={styles.cardContent}>
//         <Text style={styles.cardTitle}>Ticket #: {item.ticket_number}</Text>
//         <Text style={styles.cardSubtitle}>{item.job_name}</Text>
//       </View>
//       <Icon name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <FlatList
//         data={tickets}
//         renderItem={renderTicketItem}
//         keyExtractor={(item) => item.id.toString()}
//         contentContainerStyle={styles.listContainer}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Icon name="ticket-outline" size={60} color={COLORS.border} />
//             <Text style={styles.emptyText}>No tickets found for this date.</Text>
//           </View>
//         }
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   listContainer: { padding: 16 },
//   card: {
//     backgroundColor: COLORS.card,
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   cardContent: { flex: 1 },
//   cardTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
//   cardSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
//   emptyContainer: { alignItems: 'center', marginTop: 80 },
//   emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
// });

// export default SupervisorTicketListScreen;


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/apiClient'; // your axios setup or fetch wrapper

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 2; // 2 columns with 16px padding + 8px gap

type Ticket = {
  id: number;
  image_path: string;
  phase_code?: string;
};

const SupervisorTicketList = () => {
  const route = useRoute<any>();
  const { foremanId, foremanName, date } = route.params;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const [phaseCodes, setPhaseCodes] = useState<Record<number, string>>({}); // ticket id to phase code

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
  setLoading(true);
  try {
    const response = await apiClient.get('/api/tickets/for-supervisor', {
      params: { foreman_id: foremanId, date },
    });
    
    const data: Ticket[] = response.data || []; // Since endpoint returns list directly
    setTickets(data);
    
    const codes: Record<number, string> = {};
    data.forEach(t => {
      codes[t.id] = t.phase_code || '';
    });
    setPhaseCodes(codes);
  } catch (err: any) {
    Alert.alert('Error', err.response?.data?.detail || 'Failed to load tickets');
  } finally {
    setLoading(false);
  }
};

const savePhaseCode = async (ticketId: number) => {
  const phase_code = phaseCodes[ticketId];
  try {
    await apiClient.patch(`/api/tickets/${ticketId}`, { phase_code });
    Alert.alert('Saved', 'Phase code saved successfully');
  } catch (err: any) {
    Alert.alert('Save Error', err.response?.data?.detail || 'Failed to save phase code');
  }
};

  const renderTicket = ({ item }: { item: Ticket }) => (
    <View style={styles.ticketContainer}>
      <TouchableOpacity onPress={() => setFullImageUri(item.image_path)}>
        <Image
          source={{ uri: `${apiClient.defaults.baseURL}${item.image_path}` }}
          style={styles.image}
        />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Enter Phase Code"
        value={phaseCodes[item.id]}
        onChangeText={text => setPhaseCodes(prev => ({ ...prev, [item.id]: text }))}
        onBlur={() => savePhaseCode(item.id)}
        returnKeyType="done"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Tickets for {foremanName} on {new Date(date).toLocaleDateString()}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : tickets.length === 0 ? (
        <Text style={styles.emptyText}>No tickets found for this date.</Text>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTicket}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {fullImageUri && (
        <View style={styles.fullImageContainer}>
          <Image source={{ uri: `${apiClient.defaults.baseURL}${fullImageUri}` }} style={styles.fullImage} />
          <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  row: { justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 16 },
  ticketContainer: {
    width: IMAGE_SIZE,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: '100%',
    height: IMAGE_SIZE,
    resizeMode: 'cover',
  },
  input: {
    height: 38,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingHorizontal: 8,
    fontSize: 16,
  },
  emptyText: { marginTop: 50, textAlign: 'center', fontSize: 16, color: '#666' },
  fullImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
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
  },
});

export default SupervisorTicketList;
