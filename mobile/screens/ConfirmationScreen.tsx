import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { CheckCircle, Clock, Calendar, Share2, XCircle } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/AppBackground';

const clubinLogo = require('../assets/clubin-confirmation-logo.png');

// Local Booking type (matches our AsyncStorage format)
interface LocalBooking {
    id: string;
    eventId: string;
    couples: number;
    ladies: number;
    stags: number;
    createdAt: string;
    qrCode?: string;
    event: {
        id: string;
        title: string;
        club: string;
        imageUrl: string;
        date: string;
        time: string;
    };
}

export function ConfirmationScreen({ route, navigation }: any) {
    const { booking } = route.params as { booking: LocalBooking };
    const event = booking.event;
    const viewShotRef = useRef<ViewShot>(null);
    const [cancelling, setCancelling] = useState(false);

    const totalGuests = booking.couples * 2 + booking.ladies + booking.stags;

    // Generate a simple code from booking ID
    const bookingCode = (booking.qrCode || booking.id).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();

    // QR data contains booking ID for scanning
    const qrData = JSON.stringify({
        bookingId: booking.id,
        code: bookingCode,
        eventId: booking.eventId,
        guests: totalGuests,
    });

    const shareTicket = async () => {
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Error', 'Sharing is not available on this device');
                return;
            }

            if (viewShotRef.current?.capture) {
                const uri = await viewShotRef.current.capture();
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share your ticket',
                    UTI: 'public.png',
                });
            }
        } catch (error) {
            console.error('Error sharing ticket:', error);
            Alert.alert('Error', 'Failed to share ticket. Please try again.');
        }
    };

    const cancelBooking = async () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking? This action cannot be undone.',
            [
                { text: 'Keep Booking', style: 'cancel' },
                {
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            const token = await AsyncStorage.getItem('afterhour_token');
                            const response = await fetch(`https://api.clubin.info/api/bookings/${booking.id}`, {
                                method: 'DELETE',
                                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                            });

                            if (!response.ok) {
                                throw new Error('Failed to cancel booking');
                            }

                            // Remove from local storage
                            const storedBookings = await AsyncStorage.getItem('afterhour_bookings');
                            if (storedBookings) {
                                const bookings = JSON.parse(storedBookings);
                                const updatedBookings = bookings.filter((b: LocalBooking) => b.id !== booking.id);
                                await AsyncStorage.setItem('afterhour_bookings', JSON.stringify(updatedBookings));
                            }

                            // Update guest counts
                            const counts = JSON.parse(await AsyncStorage.getItem('afterhour_guest_counts') || '{}');
                            if (counts[booking.eventId]) {
                                delete counts[booking.eventId];
                                await AsyncStorage.setItem('afterhour_guest_counts', JSON.stringify(counts));
                            }

                            Alert.alert('Booking Cancelled', 'Your booking has been successfully cancelled.', [
                                { text: 'OK', onPress: () => navigation.navigate('Home', { screen: 'HomeList' }) }
                            ]);
                        } catch (error) {
                            console.error('Error cancelling booking:', error);
                            Alert.alert('Error', 'Failed to cancel booking. Please try again.');
                        } finally {
                            setCancelling(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <AppBackground />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Success Icon */}
                    <View style={styles.successIcon}>
                        <CheckCircle color="#fff" size={48} strokeWidth={3} />
                    </View>

                    <Text style={styles.title}>You're on the list!</Text>
                    <Text style={styles.subtitle}>
                        Screenshot this ticket or find it in 'My Bookings'.
                    </Text>

                    {/* Ticket Card - wrapped in ViewShot for screenshot */}
                    <ViewShot
                        ref={viewShotRef}
                        options={{ format: 'png', quality: 1.0 }}
                        style={styles.viewShot}
                    >
                        <View style={styles.shareableArea}>
                            <Image source={clubinLogo} style={styles.shareLogo} resizeMode="contain" />
                            <View style={styles.ticket}>
                                <View style={styles.ticketNotch} />
                                <View style={styles.ticketNotchBottom} />

                                <View style={styles.ticketHeader}>
                                    <Text style={styles.ticketTitle}>{event.title}</Text>
                                    <Text style={styles.ticketClub}>{event.club}</Text>
                                    <View style={styles.ticketMeta}>
                                        <View style={styles.ticketMetaItem}>
                                            <Clock color="#737373" size={12} />
                                            <Text style={styles.ticketMetaText}>{event.time || '21:00'}</Text>
                                        </View>
                                        <View style={styles.ticketMetaItem}>
                                            <Calendar color="#737373" size={12} />
                                            <Text style={styles.ticketMetaText}>
                                                {event.date ? new Date(event.date).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                }) : 'Today'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.ticketDivider} />

                                {/* QR Code */}
                                <View style={styles.qrContainer}>
                                    <View style={styles.qrWrapper}>
                                        <QRCode
                                            value={qrData}
                                            size={140}
                                            backgroundColor="white"
                                            color="#000"
                                        />
                                    </View>
                                    <Text style={styles.qrCode}>{bookingCode}</Text>
                                </View>

                                <View style={styles.ticketDivider} />

                                <View style={styles.ticketFooter}>
                                    <View>
                                        <Text style={styles.ticketFooterLabel}>TOTAL GUESTS</Text>
                                        <Text style={styles.ticketFooterValue}>{totalGuests}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.ticketFooterLabel}>BOOKING ID</Text>
                                        <Text style={styles.ticketFooterValue}>
                                            #AF-{bookingCode.slice(0, 4)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ViewShot>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('Home', { screen: 'HomeList' })}
                        >
                            <Text style={styles.primaryButtonText}>Back to Home</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={shareTicket}>
                            <Share2 color="#fff" size={18} />
                            <Text style={styles.secondaryButtonText}>Share Ticket</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={cancelBooking}
                            disabled={cancelling}
                        >
                            {cancelling ? (
                                <ActivityIndicator color="#ef4444" size="small" />
                            ) : (
                                <>
                                    <XCircle color="#ef4444" size={18} />
                                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
    content: {
        padding: 20,
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 120,
    },
    successIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#737373',
        textAlign: 'center',
        marginBottom: 32,
        maxWidth: 240,
    },
    viewShot: {
        width: '100%',
        alignItems: 'center',
    },
    shareableArea: {
        backgroundColor: '#0a0a0a',
        padding: 0,
        alignItems: 'center',
        width: '100%',
    },
    shareTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    shareTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginRight: 8,
    },
    shareLogo: {
        width: 140,
        height: 140,
        alignSelf: 'center',
        marginVertical: 0,
    },
    ticket: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        position: 'relative',
        marginTop: -8,
        marginBottom: 32,
    },
    ticketNotch: {
        position: 'absolute',
        top: -12,
        left: '50%',
        marginLeft: -16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0a0a0a',
    },
    ticketNotchBottom: {
        position: 'absolute',
        bottom: -12,
        left: '50%',
        marginLeft: -16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0a0a0a',
    },
    ticketHeader: {
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: 8,
    },
    ticketTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000',
        marginBottom: 4,
        textAlign: 'center',
    },
    ticketClub: {
        fontSize: 14,
        fontWeight: '600',
        color: '#a855f7',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ticketMeta: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 12,
    },
    ticketMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ticketMetaText: {
        fontSize: 12,
        color: '#737373',
    },
    ticketDivider: {
        height: 2,
        backgroundColor: '#e5e5e5',
        marginVertical: 16,
        borderStyle: 'dashed',
    },
    qrContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    qrWrapper: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 8,
    },
    qrCode: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#737373',
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        marginHorizontal: -24,
        marginBottom: -24,
        padding: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    ticketFooterLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#737373',
        letterSpacing: 0.5,
    },
    ticketFooterValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#171717',
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#a855f7',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
});
