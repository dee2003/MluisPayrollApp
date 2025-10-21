import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/apiClient';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ProjectEngineerStackParamList } from '../../navigation/AppNavigator';

const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
  danger: '#FF3B30',
};

type Ticket = {
  id: number;
  image_path: string;
  phase_code?: string;
};

type RouteParams = RouteProp<ProjectEngineerStackParamList, 'PETicketList'>;

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 40) / 2; // 2 columns with 10px padding

const PETicketList = () => {
  const route = useRoute<RouteParams>();
  const { foremanId, date } = route.params;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/api/review/pe/tickets?foreman_id=${foremanId}&date=${date}`
      );
      setTickets(res.data);
    } catch (error: any) {
      console.error('Failed to load tickets:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const openModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
  <TouchableOpacity onPress={() => openModal(item)} style={styles.ticketCard}>
    {item.image_path ? (
      <Image
        source={{ uri: `${apiClient.defaults.baseURL}${item.image_path}` }}
        style={styles.image}
        resizeMode="cover"
      />
    ) : (
      <View style={[styles.image, styles.placeholder]}>
        <Ionicons name="image-outline" size={40} color={COLORS.border} />
      </View>
    )}
    <Text style={styles.phaseCodeText}>
      Phase Code: {item.phase_code || 'N/A'}
    </Text>
  </TouchableOpacity>
)}

        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="image-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No Tickets Found</Text>
          </View>
        }
      />

      {/* Modal to show full image + phase code */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close-circle" size={28} color={COLORS.danger} />
            </TouchableOpacity>
            {selectedTicket?.image_path && (
  <Image
    source={{ uri: `${apiClient.defaults.baseURL}${selectedTicket.image_path}` }}
    style={styles.modalImage}
    resizeMode="contain"
  />
)}
            {/* <Text style={styles.phaseCode}>
              Phase Code: {selectedTicket?.phase_code || 'N/A'}
            </Text> */}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // image: {
  //   width: IMAGE_SIZE,
  //   height: IMAGE_SIZE,
  //   borderRadius: 8,
  //   backgroundColor: COLORS.border,
  // },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 10 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '90%', alignItems: 'center' },
  modalImage: { width: '100%', height: 300, borderRadius: 8 },
  closeButton: { position: 'absolute', top: -10, right: -10, zIndex: 2 },
  phaseCode: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.card,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  danger: { color: COLORS.danger },
  ticketCard: {
  width: IMAGE_SIZE,
  alignItems: 'center',
  backgroundColor: COLORS.card,
  borderRadius: 10,
  padding: 6,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},
image: {
  width: '100%',
  height: IMAGE_SIZE - 30,
  borderRadius: 8,
  backgroundColor: COLORS.border,
},

phaseCodeText: {
  marginTop: 6,
  fontSize: 14,
  fontWeight: '600',
  color: COLORS.textPrimary,
  textAlign: 'center',
},

});

export default PETicketList;
