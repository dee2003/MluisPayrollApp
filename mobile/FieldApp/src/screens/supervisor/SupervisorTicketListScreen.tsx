import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import type { SupervisorStackParamList } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { StackNavigationProp } from '@react-navigation/stack';

type Ticket = {
  id: number;
  ticket_number: string;
  job_name: string;
};

type TicketListRouteProp = RouteProp<SupervisorStackParamList, 'SupervisorTicketList'>;
type NavigationProp = StackNavigationProp<SupervisorStackParamList, 'SupervisorTicketList'>;

const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
};

const SupervisorTicketListScreen = () => {
  const route = useRoute<TicketListRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { foremanId, date } = route.params;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<Ticket[]>(
          `/api/tickets/for-supervisor?foreman_id=${foremanId}&date=${date}`
        );
        setTickets(response.data);
      } catch (error: any) {
        console.error('Failed to fetch tickets:', error);
        Alert.alert('Error', 'Could not load tickets for this entry.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [foremanId, date]);
  
  const handleSelectTicket = (ticketId: number) => {
    // Implement navigation to a ticket detail/review screen if you have one
    Alert.alert("Navigate", `Would navigate to Ticket ID: ${ticketId}`);
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectTicket(item.id)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>Ticket #: {item.ticket_number}</Text>
        <Text style={styles.cardSubtitle}>{item.job_name}</Text>
      </View>
      <Icon name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={tickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="ticket-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No tickets found for this date.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
});

export default SupervisorTicketListScreen;

