import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import axios from 'axios';
import { Timesheet } from '../../types';

const { width } = Dimensions.get('window');
const THUMBNAIL_HEIGHT = 150;

const API_BASE_URL = 'https://491183e87d26.ngrok-free.app';

const THEME = {
  primary: '#007AFF',
  background: '#F0F0F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#6A6A6A',
  border: '#E0E0E5',
};

// --- Tickets Review Component (Corrected Logic) ---
const ReviewTickets = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const [imagesByDate, setImagesByDate] = useState<any[]>([]);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTickets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ocr/images-by-date/${user.id}`);
      const groups = response.data.imagesByDate || [];

      // --- NEW LOGIC: Determine submission status dynamically ---
      const processedGroups = groups.map((group: any) => {
        // An unsubmitted ticket is one that lacks the 'submitted: true' flag from the backend.
        const unsubmittedTickets = group.images.filter((ticket: any) => !ticket.submitted);
        
        return {
          ...group,
          // The group is only considered "fully submitted" if there are zero unsubmitted tickets.
          isFullySubmitted: unsubmittedTickets.length === 0,
          // Create a list of IDs for the tickets that actually need to be submitted.
          unsubmittedTicketIds: unsubmittedTickets.map((ticket: any) => ticket.id),
        };
      });

      setImagesByDate(processedGroups);
    } catch (err) {
      Alert.alert('Error', 'Failed to load tickets.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchTickets();
  }, [user]));

  const handleSubmitTickets = async (date: string, unsubmittedTicketIds: number[]) => {
    if (!user) return;
    // Prevent sending if there are no new tickets.
    if (unsubmittedTicketIds.length === 0) {
      Alert.alert("No New Tickets", "All tickets for this date have already been submitted.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/submissions/`, {
        date,
        foreman_id: user.id,
        ticket_ids: unsubmittedTicketIds, // IMPORTANT: Only send the new, unsubmitted ticket IDs
      });
      Alert.alert("Success", `${unsubmittedTicketIds.length} new tickets for ${date} have been submitted.`);
      fetchTickets(); // Refresh the list from the server to update the status.
    } catch (e: any) {
      Alert.alert("Submission Error", e.response?.data?.detail || "An unexpected error occurred.");
    }
  };
  
  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {imagesByDate.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Icon name="camera" size={48} color={THEME.textSecondary} />
            <Text style={styles.emptyText}>No tickets to review.</Text>
            <Text style={styles.emptySubText}>Scanned tickets will appear here.</Text>
        </View>
      ) : (
        imagesByDate.map(group => (
          <View key={group.date} style={styles.card}>
            <View style={styles.dateHeaderRow}>
              <Text style={styles.dateTitle}>{group.date}</Text>
              <Text style={styles.ticketCount}>{group.images.length} Tickets</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScrollContainer}>
              {group.images.map((img: any) => (
                <TouchableOpacity key={img.id} style={styles.thumbnailWrapper} onPress={() => setFullImageUri(`${API_BASE_URL}${img.image_url}`)}>
                  <Image source={{ uri: `${API_BASE_URL}${img.image_url}` }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.submitButton, group.isFullySubmitted && styles.submitButtonDisabled]}
              onPress={() => handleSubmitTickets(group.date, group.unsubmittedTicketIds)}
              disabled={group.isFullySubmitted}
            >
              <Icon name={group.isFullySubmitted ? "check-circle" : "send"} size={18} color="#fff" />
              <Text style={styles.submitButtonText}>
                {group.isFullySubmitted ? "All Submitted" : "Submit New Tickets"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      {fullImageUri && (
        <View style={styles.fullImageContainer}>
          <Image source={{ uri: fullImageUri }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
            <Icon name="x" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};


// --- Timesheets Review Component (No changes needed here) ---
const ReviewTimesheets = ({ navigation }: { navigation: any }) => {
    const { user } = useAuth();
    const [drafts, setDrafts] = useState<Timesheet[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDrafts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/timesheets/drafts/by-foreman/${user.id}`);
            setDrafts(response.data);
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch draft timesheets.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        fetchDrafts();
    }, [user]));

    const handleSendTimesheet = async (timesheetId: number) => {
        Alert.alert("Confirm Submission", "Are you sure you want to send this timesheet?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await axios.post(`${API_BASE_URL}/api/timesheets/${timesheetId}/send`);
                            Alert.alert("Success", "Timesheet has been sent.");
                            fetchDrafts();
                        } catch (error) {
                            Alert.alert("Error", "Could not send the timesheet.");
                            setLoading(false);
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    if (loading) {
      return <ActivityIndicator size="large" style={styles.centered} />;
    }

    return (
        <FlatList
            data={drafts}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.scrollContent}
            renderItem={({ item }) => (
                <View style={styles.tsItemOuterContainer}>
                    <TouchableOpacity style={styles.tsItemContainer} onPress={() => navigation.navigate('TimesheetEdit', { timesheetId: item.id })}>
                        <View style={styles.tsItemTextContainer}>
                            <Text style={styles.tsItemTitle}>{item.timesheet_name || 'Untitled'}</Text>
                            <Text style={styles.tsItemSubtitle}>{new Date(item.date).toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tsSendButton} onPress={() => handleSendTimesheet(item.id)}>
                        <Icon name="send" size={20} color={THEME.primary} />
                        <Text style={styles.tsSendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            )}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Icon name="edit" size={48} color={THEME.textSecondary} />
                    <Text style={styles.emptyText}>No timesheet drafts.</Text>
                    <Text style={styles.emptySubText}>Saved timesheets will appear here for submission.</Text>
                </View>
            }
        />
    );
};


// --- Main Review Screen with Tabs ---
const ReviewScreen = ({ navigation }: { navigation: any }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'timesheets'>('tickets');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
            onPress={() => setActiveTab('tickets')}
          >
            <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>Review Tickets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'timesheets' && styles.activeTab]}
            onPress={() => setActiveTab('timesheets')}
          >
            <Text style={[styles.tabText, activeTab === 'timesheets' && styles.activeTabText]}>Review Timesheets</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'tickets' ? (
        <ReviewTickets navigation={navigation} />
      ) : (
        <ReviewTimesheets navigation={navigation} />
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        padding: 16,
        backgroundColor: THEME.card,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: THEME.background,
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: THEME.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: THEME.textSecondary,
    },
    activeTabText: {
        color: THEME.primary,
    },
    scrollContent: { padding: 16, flexGrow: 1 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    emptyText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: THEME.textSecondary },
    emptySubText: { marginTop: 8, fontSize: 14, color: THEME.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
    card: {
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
    dateHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dateTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
    ticketCount: { fontSize: 14, fontWeight: '500', color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    thumbnailScrollContainer: { paddingVertical: 8 },
    thumbnailWrapper: { height: THUMBNAIL_HEIGHT, width: width * 0.25, marginHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    thumbnailImage: { height: '100%', width: '100%' },
    submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 10, marginTop: 12 },
    submitButtonDisabled: { backgroundColor: '#9CA3AF' },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    fullImageContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 24, 39, 0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '95%', height: '85%' },
    closeButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 20, padding: 8 },
    // Timesheet list styles
    tsItemOuterContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, },
    tsItemContainer: { flex: 1, padding: 16 },
    tsItemTextContainer: { flex: 1 },
    tsItemTitle: { fontSize: 16, fontWeight: '600', color: THEME.text },
    tsItemSubtitle: { fontSize: 14, color: THEME.textSecondary, marginTop: 4 },
    tsSendButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 20, borderLeftWidth: 1, borderLeftColor: THEME.border, },
    tsSendButtonText: { marginLeft: 8, color: THEME.primary, fontWeight: '600', fontSize: 16, },
});

export default ReviewScreen;

