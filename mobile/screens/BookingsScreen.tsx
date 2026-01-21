import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Platform,
    StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ticket, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/auth';
import { AppBackground } from '../components/AppBackground';

// Local Booking type
interface Booking {
    id: string;
    eventId: string;
    userPhone?: string;
    userName?: string;
    couples: number;
    ladies: number;
    stags: number;
    createdAt: string;
    event: {
        id: string;
        title: string;
        club: string;
        imageUrl: string;
        date: string;
        time: string;
    };
}

export function BookingsScreen({ navigation }: any) {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('afterhour_token');
            if (!token) {
                setBookings([]);
                setLoading(false);
                return;
            }

            // Fetch from API
            const response = await fetch('https://api.clubin.info/api/bookings/my', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }

            const data = await response.json();
            setBookings(data);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            setBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [fetchBookings])
    );

    const renderBookingCard = ({ item }: { item: Booking }) => {
        const event = item.event;
        const totalGuests = item.couples * 2 + item.ladies + item.stags;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Home', {
                    screen: 'Confirmation',
                    params: { booking: item },
                })}
                activeOpacity={0.8}
            >
                <View style={styles.cardStatus}>
                    <CheckCircle color="#22c55e" size={16} />
                </View>

                <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrText}>QR</Text>
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{event.title}</Text>
                    <Text style={styles.cardClub}>{event.club}</Text>
                    <View style={styles.cardGuests}>
                        {item.couples > 0 && <Text style={styles.cardGuestText}>{item.couples} Couples</Text>}
                        {item.ladies > 0 && <Text style={styles.cardGuestText}>{item.ladies} Ladies</Text>}
                        {item.stags > 0 && <Text style={styles.cardGuestText}>{item.stags} Stags</Text>}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <AppBackground />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Tickets</Text>
                </View>

                {bookings.length === 0 && !loading ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <Ticket color="#525252" size={40} />
                        </View>
                        <Text style={styles.emptyText}>No upcoming plans</Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.emptyButtonText}>Find an Event</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        renderItem={renderBookingCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => {
                                    setRefreshing(true);
                                    fetchBookings();
                                }}
                                tintColor="#a855f7"
                            />
                        }
                    />
                )}
            </SafeAreaView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a12',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    list: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 120,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#171717',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
    },
    cardStatus: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        padding: 8,
        borderBottomLeftRadius: 12,
    },
    qrPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#fff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0a0a0a',
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    cardClub: {
        fontSize: 14,
        color: '#a855f7',
        fontWeight: '500',
        marginBottom: 8,
    },
    cardGuests: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    cardGuestText: {
        fontSize: 10,
        color: '#737373',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#171717',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        color: '#525252',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#a855f7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});
