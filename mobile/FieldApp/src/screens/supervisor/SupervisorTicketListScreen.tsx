import React, { useEffect, useState, useCallback } from 'react';
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
    RefreshControl, // Added RefreshControl for a better UX
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native'; // Import useNavigation
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/apiClient';

const { width } = Dimensions.get('window');

// Adapted Theme and Colors from Supervisor/PE Dashboard
const THEME = {
    colors: {
        primary: '#4A5C4D', // Primary action color (dark green)
        backgroundLight: '#F8F7F2', // Light background
        contentLight: '#3D3D3D', // Primary text content
        subtleLight: '#797979', // Secondary text content
        cardLight: '#FFFFFF', // Card/container background
        brandStone: '#8E8E8E', // Subtle brand color
        danger: '#FF3B30',
        success: '#16A34A', // For saved state/indicator
        border: '#E5E5E5', // Light border
    },
    fontFamily: { display: 'System' },
    borderRadius: { lg: 12, sm: 8, full: 9999 },
};

const HORIZONTAL_PADDING = 16;
const COLUMN_SPACING = 10;
const IMAGE_SIZE = (width - HORIZONTAL_PADDING * 2 - COLUMN_SPACING) / 2;

type Ticket = {
    id: number;
    image_path: string;
    phase_code?: string;
};

type RouteParams = {
    foremanId: number;
    foremanName: string;
    date: string;
};

const SupervisorTicketList = () => {
    const route = useRoute<any>();
    const navigation = useNavigation(); // Hook for setting options
    const { foremanId, foremanName, date } = route.params as RouteParams;

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [fullImageUri, setFullImageUri] = useState<string | null>(null);
    const [phaseCodes, setPhaseCodes] = useState<Record<number, string>>({});
    const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});

    // Set dynamic header title
    useEffect(() => {
        navigation.setOptions({
            title: `${foremanName}'s Tickets`,
        });
    }, [foremanName, navigation]);

    const loadTickets = useCallback(async () => {
        const fetchStateSetter = refreshing ? setRefreshing : setLoading;
        fetchStateSetter(true);
        try {
            const response = await apiClient.get('/api/tickets/for-supervisor', {
                params: { foreman_id: foremanId, date },
            });
            
            const data: Ticket[] = response.data || [];
            setTickets(data);
            
            const codes: Record<number, string> = {};
            data.forEach(t => {
                codes[t.id] = t.phase_code || '';
            });
            setPhaseCodes(codes);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to load tickets');
        } finally {
            fetchStateSetter(false);
        }
    }, [foremanId, date, refreshing]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleRefresh = () => {
        loadTickets();
    };

    const savePhaseCode = async (ticketId: number) => {
        const phase_code = phaseCodes[ticketId].trim();

        // Find the original ticket to check if the code changed
        const originalTicket = tickets.find(t => t.id === ticketId);
        if (originalTicket?.phase_code === phase_code) return; // No change, no save

        try {
            setSavedStatus(prev => ({ ...prev, [ticketId]: false })); // Reset status while saving
            await apiClient.patch(`/api/tickets/${ticketId}`, { phase_code });
            
            // Update local state to reflect the saved code and set status to true
            setTickets(prevTickets => prevTickets.map(t => 
                t.id === ticketId ? { ...t, phase_code: phase_code } : t
            ));
            setSavedStatus(prev => ({ ...prev, [ticketId]: true }));
        } catch (err: any) {
            Alert.alert('Save Error', err.response?.data?.detail || 'Failed to save phase code');
            setSavedStatus(prev => ({ ...prev, [ticketId]: false }));
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
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Phase Code"
                    placeholderTextColor={THEME.colors.subtleLight}
                    value={phaseCodes[item.id]}
                    onChangeText={text => {
                        setPhaseCodes(prev => ({ ...prev, [item.id]: text }));
                        setSavedStatus(prev => ({ ...prev, [item.id]: false })); // Mark as unsaved on change
                    }}
                    onEndEditing={() => savePhaseCode(item.id)}
                    returnKeyType="done"
                />
                <View style={[styles.statusIndicator, { backgroundColor: savedStatus[item.id] ? THEME.colors.success : THEME.colors.brandStone }]}>
                    <Ionicons 
                        name={savedStatus[item.id] ? "checkmark" : "sync"} 
                        size={16} 
                        color={THEME.colors.cardLight} 
                    />
                </View>
            </View>
        </View>
    );

    const ListHeaderComponent = (
        <View style={styles.listHeader}>
            {/* <Text style={styles.headerSubtitle}>
                Tickets submitted on: <Text style={styles.headerInfo}>{new Date(date + 'T00:00:00').toLocaleDateString()}</Text>
            </Text> */}
            <Text style={styles.instructionText}>
                Tap image for full view. Enter **Phase Code** below, then tap **Done** or away to save.
            </Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={tickets}
                keyExtractor={item => item.id.toString()}
                renderItem={renderTicket}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={ListHeaderComponent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={THEME.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={60} color={THEME.colors.brandStone} />
                        <Text style={styles.emptyText}>No tickets require review.</Text>
                        <Text style={styles.emptySubText}>The foreman has not submitted any tickets for this date.</Text>
                    </View>
                }
            />

            {/* Full Image Modal/Overlay */}
            {fullImageUri && (
                <View style={styles.fullImageContainer}>
                    <Image source={{ uri: `${apiClient.defaults.baseURL}${fullImageUri}` }} style={styles.fullImage} resizeMode="contain" />
                    <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
                        <Ionicons name="close-circle" size={40} color={THEME.colors.cardLight} />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: THEME.colors.backgroundLight 
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.colors.backgroundLight,
    },
    listContent: { 
        paddingBottom: 20,
    },
    
    // Header
    listHeader: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 10,
        paddingBottom: 10,
        marginBottom: 5,
    },
    headerSubtitle: {
        fontFamily: THEME.fontFamily.display,
        fontSize: 15,
        fontWeight: '500',
        color: THEME.colors.subtleLight,
        marginBottom: 8,
    },
    headerInfo: {
        fontWeight: '700',
        color: THEME.colors.primary,
    },
    instructionText: {
        fontFamily: THEME.fontFamily.display,
        fontSize: 12,
        color: THEME.colors.brandStone,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
    },

    // Ticket Grid
    row: { 
        justifyContent: 'space-between', 
        paddingHorizontal: HORIZONTAL_PADDING, 
        marginTop: COLUMN_SPACING 
    },
    ticketContainer: {
        width: IMAGE_SIZE,
        backgroundColor: THEME.colors.cardLight,
        borderRadius: THEME.borderRadius.sm,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    image: {
        width: '100%',
        height: IMAGE_SIZE,
        resizeMode: 'cover',
        backgroundColor: THEME.colors.border,
    },
    
    // Input and Status Indicator
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
        backgroundColor: THEME.colors.backgroundLight,
    },
    input: {
        flex: 1,
        fontFamily: THEME.fontFamily.display,
        height: 40,
        paddingHorizontal: 10,
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        color: THEME.colors.primary,
    },
    statusIndicator: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: THEME.colors.border,
    },
    
    // Empty State
    emptyContainer: { 
        alignItems: 'center', 
        marginTop: 80,
        paddingHorizontal: 40
    },
    emptyText: { 
        fontFamily: THEME.fontFamily.display,
        marginTop: 16, 
        textAlign: 'center', 
        fontSize: 18, 
        fontWeight: '600',
        color: THEME.colors.subtleLight 
    },
    emptySubText: {
        fontFamily: THEME.fontFamily.display,
        marginTop: 8, 
        textAlign: 'center', 
        fontSize: 14, 
        color: THEME.colors.brandStone
    },

    // Full Image Modal
    fullImageContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    fullImage: {
        width: '90%',
        height: '80%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: THEME.borderRadius.full,
        padding: 4,
    },
});

export default SupervisorTicketList;