import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    ScrollView,
    TextInput,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, Search, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getEvents, Event } from '../lib/api';
import { HomeScreenSkeleton } from '../components/SkeletonLoader';
import { AppBackground } from '../components/AppBackground';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'techno', label: 'Techno' },
    { id: 'bollywood', label: 'Bollywood' },
    { id: 'house', label: 'House' },
    { id: 'hiphop', label: 'Hip-Hop' },
];

export function HomeScreen({ navigation }: any) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEvents = useCallback(async () => {
        try {
            const data = await getEvents({ upcoming: true });
            setEvents(data);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Refetch events every time screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [fetchEvents])
    );

    // Filter events by category and search query, with featured first
    const filteredEvents = events
        .filter((e) => {
            // Category filter
            const categoryMatch = selectedCategory === 'all' || e.genre.toLowerCase() === selectedCategory;

            // Search filter
            const query = searchQuery.toLowerCase().trim();
            const searchMatch = query === '' ||
                e.title.toLowerCase().includes(query) ||
                e.club.toLowerCase().includes(query) ||
                e.genre.toLowerCase().includes(query);

            return categoryMatch && searchMatch;
        })
        .sort((a, b) => {
            // Featured events first
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return 0;
        });

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

    // Calculate effective guestlist status for an event
    const getEffectiveStatus = (event: Event) => {
        if (event.guestlistStatus === 'closed') return 'closed';

        const now = new Date();
        const eventDate = new Date(event.date);

        let closeTime: Date | null = null;

        if (event.guestlistCloseTime) {
            const [hours, mins] = event.guestlistCloseTime.split(':').map(Number);
            closeTime = new Date(eventDate);
            closeTime.setHours(hours, mins, 0, 0);
        } else if (event.guestlistCloseOnStart !== false) {
            const [hours, mins] = event.startTime.split(':').map(Number);
            closeTime = new Date(eventDate);
            closeTime.setHours(hours, mins, 0, 0);
        }

        if (closeTime) {
            if (now >= closeTime) return 'closed';
            const twoHoursBefore = new Date(closeTime.getTime() - 2 * 60 * 60 * 1000);
            if (now >= twoHoursBefore) return 'closing';
        }

        return event.guestlistStatus;
    };

    const renderEventCard = ({ item }: { item: Event }) => {
        const effectiveStatus = getEffectiveStatus(item);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('EventDetail', { event: item })}
                activeOpacity={0.8}
            >
                <Image source={{ uri: item.imageUrl, cache: 'reload' }} style={styles.cardImage} />
                <View style={styles.cardOverlay} />

                <View style={styles.cardDateBadge}>
                    <Text style={styles.cardDateText}>{formatDate(item.date)}</Text>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.genreBadge}>
                        <Text style={styles.genreText}>{item.genre}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={styles.cardLocation}>
                        <MapPin color="#a855f7" size={12} />
                        <Text style={styles.cardLocationText}>{item.club}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.cardTime}>
                        <Clock color="#737373" size={14} />
                        <Text style={styles.cardTimeText}>{formatTime(item.startTime)} - {formatTime(item.endTime)}</Text>
                    </View>
                    {effectiveStatus !== 'closed' && (
                        <View style={[styles.guestlistBadge, effectiveStatus === 'closing' && styles.guestlistBadgeClosing]}>
                            <View style={[styles.guestlistDot, effectiveStatus === 'closing' && styles.guestlistDotClosing]} />
                            <Text style={[styles.guestlistText, effectiveStatus === 'closing' && styles.guestlistTextClosing]}>
                                {effectiveStatus === 'open' ? 'Guestlist Open' : 'Closing Soon'}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <AppBackground />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.locationLabel}>LOCATION</Text>
                        <View style={styles.locationRow}>
                            <MapPin color="#a855f7" size={20} />
                            <Text style={styles.locationText}>Bengaluru</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <Search color="#737373" size={20} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search clubs, DJs, or genres..."
                        placeholderTextColor="#737373"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categories}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = selectedCategory === cat.id;

                        if (isActive) {
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setSelectedCategory(cat.id)}
                                    style={styles.categoryButtonContainer}
                                >
                                    <BlurView intensity={80} tint="light" style={styles.categoryButtonBlur}>
                                        <View style={styles.categoryButtonGlass}>
                                            <Text style={styles.categoryTextActive}>{cat.label}</Text>
                                        </View>
                                    </BlurView>
                                </TouchableOpacity>
                            );
                        }

                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.categoryButton}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <Text style={styles.categoryText}>{cat.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <Text style={styles.sectionTitle}>Trending Tonight</Text>

                <FlatList
                    data={filteredEvents}
                    renderItem={renderEventCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={filteredEvents.length === 0 ? styles.emptyList : styles.list}
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
                            <HomeScreenSkeleton />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>🔍</Text>
                                <Text style={styles.emptyTitle}>No results found</Text>
                                <Text style={styles.emptyText}>
                                    {searchQuery
                                        ? `No events match "${searchQuery}"`
                                        : 'No events in this category'}
                                </Text>
                            </View>
                        )
                    }
                />
            </SafeAreaView>
        </View>
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
        paddingBottom: 16,
    },
    locationLabel: {
        fontSize: 10,
        color: '#737373',
        letterSpacing: 1,
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#171717',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#262626',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#fff',
    },
    categories: {
        marginTop: 8,
        marginBottom: 20,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryButton: {
        paddingHorizontal: 16,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        backgroundColor: '#333333',
        marginRight: 10,
    },
    categoryButtonContainer: {
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        marginRight: 10,
    },
    categoryButtonBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryButtonGlass: {
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(168, 85, 247, 0.25)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.5)',
    },
    categoryButtonActive: {
        backgroundColor: '#a855f7',
    },
    categoryText: {
        color: '#999',
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
    },
    categoryTextActive: {
        color: '#a855f7',
        fontWeight: '700',
        fontSize: 13,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    emptyList: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#a855f7',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#737373',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#171717',
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardImage: {
        width: '100%',
        height: 200,
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        height: 200,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    cardDateBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    cardDateText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    cardContent: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        padding: 20,
    },
    genreBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    genreText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    cardLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cardLocationText: {
        color: '#d4d4d4',
        fontSize: 14,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    cardTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardTimeText: {
        color: '#737373',
        fontSize: 12,
        fontWeight: '500',
    },
    guestlistBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    guestlistDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },
    guestlistText: {
        color: '#22c55e',
        fontSize: 12,
        fontWeight: '700',
    },
    guestlistBadgeClosing: {
        // Same structure, different color applied via child styles
    },
    guestlistDotClosing: {
        backgroundColor: '#eab308',
    },
    guestlistTextClosing: {
        color: '#eab308',
    },
});
