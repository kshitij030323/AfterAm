import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClubsScreenSkeleton } from '../components/SkeletonLoader';

// Club type derived from events
interface Club {
    name: string;
    location: string;
    eventCount: number;
    imageUrl: string;
}

export function ClubsScreen({ navigation }: any) {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchClubs = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('afterhour_token');
            const response = await fetch('https://afterhour-backend-latest.onrender.com/api/clubs', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!response.ok) throw new Error('Failed to fetch clubs');

            const clubsData = await response.json();

            // Map API response to Club interface
            const clubsList: Club[] = clubsData.map((club: any) => ({
                name: club.name,
                location: club.location,
                eventCount: club._count?.events || 0,
                imageUrl: club.imageUrl,
            }));

            setClubs(clubsList);
        } catch (err) {
            console.error('Failed to fetch clubs:', err);
            setClubs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchClubs();
        }, [fetchClubs])
    );

    const renderClubCard = ({ item }: { item: Club }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ClubDetail', { club: item })}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            <View style={styles.cardOverlay} />
            <View style={styles.cardContent}>
                <Text style={styles.clubName}>{item.name}</Text>
                <View style={styles.locationRow}>
                    <MapPin color="#a855f7" size={14} />
                    <Text style={styles.location}>{item.location}</Text>
                </View>
                <View style={styles.eventsBadge}>
                    <Text style={styles.eventsText}>{item.eventCount} upcoming event{item.eventCount !== 1 ? 's' : ''}</Text>
                </View>
            </View>
            <View style={styles.chevron}>
                <ChevronRight color="#a855f7" size={24} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Clubs</Text>
                <Text style={styles.subtitle}>Find your favorite venues</Text>
            </View>

            <FlatList
                data={clubs}
                renderItem={renderClubCard}
                keyExtractor={(item) => item.name}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchClubs();
                        }}
                        tintColor="#a855f7"
                    />
                }
                ListEmptyComponent={
                    loading ? (
                        <ClubsScreenSkeleton />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🏠</Text>
                            <Text style={styles.emptyTitle}>No clubs found</Text>
                            <Text style={styles.emptyText}>Check back later for venues</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#737373',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#171717',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        height: 160,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    cardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-end',
    },
    clubName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    location: {
        fontSize: 13,
        color: '#d4d4d4',
    },
    eventsBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    eventsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#a855f7',
    },
    chevron: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -12,
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
});
