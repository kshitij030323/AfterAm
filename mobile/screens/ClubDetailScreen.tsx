import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Calendar, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClubDetailEventsSkeleton } from '../components/SkeletonLoader';
import { AppBackground } from '../components/AppBackground';

const { width, height } = Dimensions.get('window');

interface Event {
    id: string;
    title: string;
    club: string;
    location: string;
    imageUrl: string;
    date: string;
    startTime: string;
    genre: string;
    priceLabel: string;
}

export function ClubDetailScreen({ route, navigation }: any) {
    const { club } = route.params;
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('afterhour_token');
            const response = await fetch('https://api.clubin.info/api/events', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!response.ok) throw new Error('Failed to fetch events');

            const allEvents = await response.json();
            // Filter events for this club
            const clubEvents = allEvents.filter((e: Event) => e.club === club.name);
            setEvents(clubEvents);
        } catch (err) {
            console.error('Failed to fetch events:', err);
            setEvents([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [club.name]);

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [fetchEvents])
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Tonight';
        return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const parts = time.split(':');
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const renderEventCard = ({ item }: { item: Event }) => (
        <TouchableOpacity
            style={styles.eventCard}
            onPress={() => navigation.navigate('EventDetail', { event: item })}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.imageUrl }} style={styles.eventImage} cachePolicy="memory-disk" />
            <View style={styles.eventContent}>
                <View style={styles.genreBadge}>
                    <Text style={styles.genreText}>{item.genre}</Text>
                </View>
                <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.eventMeta}>
                    <View style={styles.metaItem}>
                        <Calendar color="#a855f7" size={12} />
                        <Text style={styles.metaText}>{formatDate(item.date)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Clock color="#a855f7" size={12} />
                        <Text style={styles.metaText}>{formatTime(item.startTime)}</Text>
                    </View>
                </View>
                <Text style={styles.priceLabel}>{item.priceLabel}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <AppBackground />
            {/* Hero Header with Gradient Fade */}
            <View style={styles.hero}>
                <Image source={{ uri: club.imageUrl }} style={styles.heroImage} cachePolicy="memory-disk" />
                <LinearGradient
                    colors={['transparent', 'rgba(10,10,10,0.6)', '#0a0a0a']}
                    style={styles.heroGradient}
                />
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft color="#fff" size={28} />
                </TouchableOpacity>
                <View style={styles.heroContent}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    <View style={styles.locationRow}>
                        <MapPin color="#a855f7" size={16} />
                        <Text style={styles.location}>{club.location}</Text>
                    </View>
                </View>
            </View>

            {/* Events Section */}
            <View style={styles.eventsSection}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                <FlatList
                    data={events}
                    renderItem={renderEventCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchEvents();
                            }}
                            tintColor="#a855f7"
                        />
                    }
                    ListEmptyComponent={
                        loading ? (
                            <ClubDetailEventsSkeleton />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>📅</Text>
                                <Text style={styles.emptyTitle}>No upcoming events</Text>
                                <Text style={styles.emptyText}>Check back later for events at {club.name}</Text>
                            </View>
                        )
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a12',
    },
    hero: {
        height: height * 0.4,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '70%',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContent: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    clubName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    location: {
        fontSize: 14,
        color: '#d4d4d4',
    },
    eventsSection: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
    },
    list: {
        paddingBottom: 100,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    eventImage: {
        width: 100,
        alignSelf: 'stretch',
    },
    eventContent: {
        flex: 1,
        padding: 12,
    },
    genreBadge: {
        backgroundColor: 'rgba(60, 40, 80, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    genreText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#a855f7',
    },
    eventTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 6,
    },
    eventMeta: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 6,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#a3a3a3',
    },
    priceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#22c55e',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 13,
        color: '#737373',
        textAlign: 'center',
    },
});
