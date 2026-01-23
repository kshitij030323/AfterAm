import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Linking,
    Alert,
    Modal,
    FlatList,
    Platform,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode, Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Clock, Star, Info, Ticket, Users, ChevronDown, Navigation, X, Volume2, VolumeX, Images } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Event } from '../lib/api';
import { getCachedVideoUrl, preCacheVideo } from '../lib/videoCache';

const { width, height } = Dimensions.get('window');

export function EventDetailScreen({ route, navigation }: any) {
    const { event } = route.params as { event: Event };
    const [guestCount, setGuestCount] = useState(0);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [videoReady, setVideoReady] = useState(false);
    const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
    const videoRef = useRef<Video>(null);

    // Configure audio mode to allow sound even with iOS silent switch on
    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
            } catch (error) {
                console.error('Failed to configure audio mode:', error);
            }
        };
        configureAudio();
    }, []);

    // Load cached video URL on mount
    useEffect(() => {
        if (event.videoUrl) {
            // Reset video ready state when event changes
            setVideoReady(false);

            getCachedVideoUrl(event.videoUrl).then(url => {
                setCachedVideoUrl(url);
            });
            // Pre-cache for next time
            preCacheVideo(event.videoUrl);
        }
    }, [event.videoUrl]);

    // Handle video load completion
    const handleVideoLoad = () => {
        setVideoReady(true);
    };

    // Load guest count for this event - refresh when screen is focused
    useFocusEffect(
        useCallback(() => {
            const loadGuestCount = async () => {
                try {
                    const counts = JSON.parse(await AsyncStorage.getItem('afterhour_guest_counts') || '{}');
                    setGuestCount(counts[event.id] || 0);
                } catch (err) {
                    console.error('Failed to load guest count:', err);
                }
            };
            loadGuestCount();
        }, [event.id])
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Tonight';
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
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

    const openMap = async () => {
        const mapUrl = (event as any).clubRef?.mapUrl;

        if (mapUrl) {
            try {
                await Linking.openURL(mapUrl);
            } catch (err) {
                Alert.alert('Error', 'Could not open map');
            }
        } else {
            const query = encodeURIComponent(`${event.club} ${event.location}`);
            const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
            try {
                await Linking.openURL(fallbackUrl);
            } catch (err) {
                Alert.alert('Error', 'Could not open map');
            }
        }
    };

    const getFullAddress = () => {
        const clubRef = (event as any).clubRef;
        if (clubRef?.address) return clubRef.address;
        return event.location;
    };

    // Calculate effective guestlist status based on close time
    const getEffectiveGuestlistStatus = () => {
        // If already closed, stay closed
        if (event.guestlistStatus === 'closed') return 'closed';

        const now = new Date();
        const eventDate = new Date(event.date);

        // Determine close time
        let closeTime: Date | null = null;

        if (event.guestlistCloseTime) {
            const [hours, mins] = event.guestlistCloseTime.split(':').map(Number);
            closeTime = new Date(eventDate);
            closeTime.setHours(hours, mins, 0, 0);
        } else if (event.guestlistCloseOnStart !== false) {
            // Default: close at event start time
            const [hours, mins] = event.startTime.split(':').map(Number);
            closeTime = new Date(eventDate);
            closeTime.setHours(hours, mins, 0, 0);
        }

        if (closeTime) {
            // Check if guestlist should be closed
            if (now >= closeTime) return 'closed';

            // Check if within 2 hours of closing (show "closing soon")
            const twoHoursBefore = new Date(closeTime.getTime() - 2 * 60 * 60 * 1000);
            if (now >= twoHoursBefore) return 'closing';
        }

        return event.guestlistStatus;
    };

    // Get display text for guestlist close time
    const getCloseTimeDisplay = () => {
        if (event.guestlistCloseTime) {
            return formatTime(event.guestlistCloseTime);
        } else if (event.guestlistCloseOnStart !== false) {
            return formatTime(event.startTime);
        }
        return null;
    };

    const effectiveStatus = getEffectiveGuestlistStatus();
    const closeTimeDisplay = getCloseTimeDisplay();

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 200 }}>
                {/* Hero Video/Image */}
                <View style={styles.imageContainer}>
                    {/* Always show the image first */}
                    <Image
                        source={{ uri: event.imageUrl }}
                        style={[styles.image, videoReady && event.videoUrl ? { opacity: 0 } : {}]}
                        cachePolicy="memory-disk"
                    />

                    {/* Load video in background, only show when ready */}
                    {event.videoUrl && cachedVideoUrl && (
                        <Video
                            ref={videoRef}
                            source={{ uri: cachedVideoUrl }}
                            style={[styles.video, { opacity: videoReady ? 1 : 0 }]}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={videoReady}
                            isLooping
                            isMuted={isMuted}
                            onLoad={handleVideoLoad}
                        />
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(10,10,10,0.6)', '#0a0a0a']}
                        locations={[0.3, 0.7, 1]}
                        style={styles.imageGradient}
                    />

                    <SafeAreaView style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <ChevronLeft color="#fff" size={24} />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Mute button for video - only show when video is ready */}
                    {event.videoUrl && videoReady && (
                        <TouchableOpacity
                            style={styles.muteButton}
                            onPress={() => setIsMuted(!isMuted)}
                        >
                            {isMuted ? <VolumeX color="#fff" size={20} /> : <Volume2 color="#fff" size={20} />}
                        </TouchableOpacity>
                    )}

                    {/* Gallery button */}
                    {event.gallery && event.gallery.length > 0 && (
                        <TouchableOpacity
                            style={styles.galleryButton}
                            onPress={() => setShowGalleryModal(true)}
                        >
                            <Images color="#fff" size={18} />
                            <Text style={styles.galleryButtonText}>Gallery</Text>
                        </TouchableOpacity>
                    )}

                    {/* Title over image */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{event.title}</Text>
                        <TouchableOpacity onPress={() => setShowAddressModal(true)} style={styles.clubRow}>
                            <MapPin color="#a855f7" size={16} />
                            <Text style={styles.club}>{event.club}</Text>
                            <ChevronDown color="#a3a3a3" size={16} />
                            {guestCount > 0 && (
                                <View style={styles.goingBadge}>
                                    <Users color="#22c55e" size={12} />
                                    <Text style={styles.goingText}>{guestCount} going</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Address Modal */}
                <Modal
                    visible={showAddressModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowAddressModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Venue Address</Text>
                                <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                                    <X color="#a3a3a3" size={24} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.addressCard}>
                                <View style={styles.addressInfo}>
                                    <Text style={styles.clubName}>{event.club}</Text>
                                    <Text style={styles.fullAddress}>{getFullAddress()}</Text>
                                </View>
                                <TouchableOpacity style={styles.directionsBtn} onPress={() => { setShowAddressModal(false); openMap(); }}>
                                    <Navigation color="#fff" size={20} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <View style={styles.content}>
                    {/* Info Cards Row */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>DATE</Text>
                            <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>TIME</Text>
                            <Text style={styles.infoValue}>{formatTime(event.startTime)}</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>ENTRY</Text>
                            <Text style={styles.infoValue}>{event.priceLabel || 'Free Entry'}</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>SPOTS LEFT</Text>
                            <Text style={[
                                styles.infoValue,
                                (event as any).spotsRemaining !== null && (event as any).spotsRemaining <= 10 && { color: '#eab308' },
                                (event as any).spotsRemaining !== null && (event as any).spotsRemaining <= 0 && { color: '#ef4444' }
                            ]}>
                                {(event as any).spotsRemaining !== null
                                    ? ((event as any).spotsRemaining <= 0 ? 'Full' : (event as any).spotsRemaining)
                                    : '∞'}
                            </Text>
                        </View>
                    </View>

                    {/* The Vibe Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>The Vibe</Text>
                        <Text style={styles.description}>
                            {event.description || `Deep underground ${event.genre.toLowerCase()} beats featuring top DJs. The best sound system in the city awaits.`}
                        </Text>
                    </View>

                    {/* Club Rules Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Club Rules</Text>
                        <View style={styles.rulesCard}>
                            <Info color="#a855f7" size={20} />
                            <Text style={styles.rulesText}>
                                {event.rules || 'Couples & Girls entry free till 9:30 PM. Stags cover charge applicable.'}
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* CTA Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.ctaButton, effectiveStatus === 'closed' && styles.ctaButtonDisabled]}
                    onPress={() => effectiveStatus !== 'closed' && navigation.navigate('Guestlist', { event })}
                    disabled={effectiveStatus === 'closed'}
                >
                    <Ticket color={effectiveStatus !== 'closed' ? '#000' : '#525252'} size={20} />
                    <Text style={[styles.ctaText, effectiveStatus === 'closed' && styles.ctaTextDisabled]}>
                        {effectiveStatus === 'closed' ? 'Guestlist Closed' : effectiveStatus === 'closing' ? 'Join Now - Closing Soon!' : 'Join Guestlist'}
                    </Text>
                </TouchableOpacity>
                {closeTimeDisplay && effectiveStatus !== 'closed' && new Date(event.date).toDateString() === new Date().toDateString() && (
                    <Text style={styles.closeTimeText}>
                        ⏰ Guestlist closes at {closeTimeDisplay}
                    </Text>
                )}
            </View>

            {/* Gallery Modal */}
            <Modal visible={showGalleryModal} animationType="slide">
                <SafeAreaView style={styles.galleryModalContainer}>
                    <View style={styles.galleryHeader}>
                        <Text style={styles.galleryTitle}>Gallery</Text>
                        <TouchableOpacity
                            style={styles.galleryCloseBtn}
                            onPress={() => setShowGalleryModal(false)}
                        >
                            <X color="#fff" size={20} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={event.gallery || []}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={2}
                        contentContainerStyle={styles.galleryGrid}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => setSelectedImage(item)}>
                                <Image
                                    source={{ uri: item }}
                                    style={styles.galleryImage}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                />
                            </TouchableOpacity>
                        )}
                    />

                    {/* Full Screen Image Viewer - inside gallery modal */}
                    {selectedImage && (
                        <View style={styles.fullScreenOverlay}>
                            <TouchableOpacity
                                style={styles.fullScreenClose}
                                onPress={() => setSelectedImage(null)}
                            >
                                <X color="#fff" size={28} />
                            </TouchableOpacity>
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.fullScreenImage}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                            />
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a12',
    },
    imageContainer: {
        height: height * 0.55,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '70%',
    },
    headerButtons: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
        marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 8,
    },
    titleContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    clubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    club: {
        fontSize: 16,
        fontWeight: '600',
        color: '#a855f7',
    },
    goingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    goingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#22c55e',
    },
    content: {
        padding: 20,
        paddingTop: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        borderRadius: 16,
        marginBottom: 28,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    infoCard: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    infoDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    infoLabel: {
        fontSize: 10,
        color: '#737373',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#a3a3a3',
        lineHeight: 24,
    },
    rulesCard: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        alignItems: 'flex-start',
    },
    rulesText: {
        flex: 1,
        fontSize: 14,
        color: '#c4b5fd',
        lineHeight: 22,
    },
    footer: {
        position: 'absolute',
        bottom: 90,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(10,10,10,0.95)',
    },
    closeTimeText: {
        color: '#f59e0b',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#fff',
        paddingVertical: 18,
        borderRadius: 16,
    },
    ctaButtonDisabled: {
        backgroundColor: '#262626',
    },
    ctaText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
    },
    ctaTextDisabled: {
        color: '#525252',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#171717',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    addressInfo: {
        flex: 1,
    },
    clubName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    fullAddress: {
        fontSize: 15,
        color: '#a3a3a3',
        lineHeight: 22,
    },
    directionsBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#a855f7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    muteButton: {
        position: 'absolute',
        left: 16,
        bottom: 120,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryButton: {
        position: 'absolute',
        right: 16,
        bottom: 120,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    galleryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    galleryModalContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    galleryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#262626',
    },
    galleryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    galleryCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#262626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryGrid: {
        padding: 4,
    },
    galleryImage: {
        width: (width - 16) / 2,
        height: (width - 16) / 2,
        margin: 4,
        borderRadius: 12,
    },
    fullScreenOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    fullScreenClose: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
    },
    fullScreenImage: {
        width: width,
        height: height * 0.8,
    },
});
