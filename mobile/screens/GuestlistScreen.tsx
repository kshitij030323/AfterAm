import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Info, Minus, Plus, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/auth';
import { AppBackground } from '../components/AppBackground';

interface Event {
    id: string;
    title: string;
    club: string;
    imageUrl: string;
    date: string;
    time: string;
    stagPrice?: number;
    couplePrice?: number;
    ladiesPrice?: number;
}

interface Guest {
    name: string;
    gender: 'male' | 'female' | 'couple';
    type: 'couple' | 'lady' | 'stag';
}

// Gender Symbol Components
const MaleSymbol = () => (
    <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 28, color: '#3B82F6', fontWeight: '700' }}>♂</Text>
    </View>
);

const FemaleSymbol = () => (
    <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 28, color: '#EC4899', fontWeight: '700' }}>♀</Text>
    </View>
);

const CoupleSymbol = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, color: '#EC4899', fontWeight: '700' }}>♀</Text>
        <Text style={{ fontSize: 24, color: '#3B82F6', fontWeight: '700', marginLeft: -4 }}>♂</Text>
    </View>
);

const GUEST_TYPES = [
    { key: 'couples', label: 'Couples', IconComponent: CoupleSymbol },
    { key: 'ladies', label: 'Ladies', IconComponent: FemaleSymbol },
    { key: 'stags', label: 'Stags (Male)', IconComponent: MaleSymbol },
] as const;

// Convenience fee per person (all inclusive)
const CONVENIENCE_FEE = 30;

export function GuestlistScreen({ route, navigation }: any) {
    const { event } = route.params as { event: Event };
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [counts, setCounts] = useState({ couples: 0, ladies: 0, stags: 0 });
    const [showNamesModal, setShowNamesModal] = useState(false);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
    const [showPlatformFeeModal, setShowPlatformFeeModal] = useState(false);

    const total = counts.couples * 2 + counts.ladies + counts.stags;

    // Calculate pricing using event prices (default to 0 if not set)
    const couplePrice = event.couplePrice ?? 0;
    const ladiesPrice = event.ladiesPrice ?? 0;
    const stagPrice = event.stagPrice ?? 0;

    const orderAmount =
        (counts.couples * couplePrice) +
        (counts.ladies * ladiesPrice) +
        (counts.stags * stagPrice);
    const convenienceFee = total * CONVENIENCE_FEE;
    const totalAmount = orderAmount + convenienceFee;

    const updateCount = (key: keyof typeof counts, delta: number) => {
        setCounts((prev) => ({
            ...prev,
            [key]: Math.max(0, prev[key] + delta),
        }));
    };

    const initializeGuests = () => {
        const newGuests: Guest[] = [];

        // Add couples (each couple = 2 people)
        for (let i = 0; i < counts.couples; i++) {
            newGuests.push({ name: '', gender: 'couple', type: 'couple' });
        }

        // Add ladies
        for (let i = 0; i < counts.ladies; i++) {
            newGuests.push({ name: '', gender: 'female', type: 'lady' });
        }

        // Add stags
        for (let i = 0; i < counts.stags; i++) {
            newGuests.push({ name: '', gender: 'male', type: 'stag' });
        }

        setGuests(newGuests);
        setShowNamesModal(true);
    };

    const updateGuestName = (index: number, name: string) => {
        setGuests(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], name };
            return updated;
        });
    };

    const handleConfirm = async () => {
        // Check if all names are filled
        const emptyNames = guests.filter(g => !g.name.trim());
        if (emptyNames.length > 0) {
            Alert.alert('Missing Names', 'Please enter names for all guests');
            return;
        }

        if (!user?.phone) {
            Alert.alert('Error', 'Please login to make a booking');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('afterhour_token');
            if (!token) {
                Alert.alert('No Token', 'Please logout from Profile and login again to get a new session.');
                return;
            }

            const response = await fetch('https://api.clubin.info/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    eventId: event.id,
                    couples: counts.couples,
                    ladies: counts.ladies,
                    stags: counts.stags,
                    guests: guests.map(g => ({ name: g.name, gender: g.gender, type: g.type })),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create booking');
            }

            const booking = await response.json();
            setShowNamesModal(false);
            navigation.replace('Confirmation', { booking });
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const getGuestLabel = (guest: Guest, index: number) => {
        if (guest.type === 'couple') {
            return `Couple ${Math.floor(index / 1) + 1} Names`;
        } else if (guest.type === 'lady') {
            const ladyIndex = guests.filter((g, i) => i < index && g.type === 'lady').length + 1;
            return `Lady ${ladyIndex}`;
        } else {
            const stagIndex = guests.filter((g, i) => i < index && g.type === 'stag').length + 1;
            return `Stag ${stagIndex}`;
        }
    };

    const getGuestIcon = (guest: Guest) => {
        if (guest.type === 'couple') return <CoupleSymbol />;
        if (guest.type === 'lady') return <FemaleSymbol />;
        return <MaleSymbol />;
    };

    const getGuestTypeSub = (key: string) => {
        if (key === 'couples') return couplePrice > 0 ? `₹${couplePrice} per couple` : 'Free entry';
        if (key === 'ladies') return ladiesPrice > 0 ? `₹${ladiesPrice} per person` : 'Free entry';
        return stagPrice > 0 ? `₹${stagPrice} per person` : 'Free entry';
    };

    return (
        <View style={styles.container}>
            <AppBackground />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft color="#a3a3a3" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Select Guests</Text>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.eventCard}>
                        <Image source={{ uri: event.imageUrl }} style={styles.eventImage} cachePolicy="memory-disk" />
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <Text style={styles.eventSub}>{event.club}</Text>
                        </View>
                    </View>

                    <View style={styles.counters}>
                        {GUEST_TYPES.map((type) => (
                            <View key={type.key} style={styles.counterRow}>
                                <View style={styles.counterInfo}>
                                    <type.IconComponent />
                                    <View>
                                        <Text style={styles.counterLabel}>{type.label}</Text>
                                        <Text style={styles.counterSub}>{getGuestTypeSub(type.key)}</Text>
                                    </View>
                                </View>
                                <View style={styles.counterControls}>
                                    <TouchableOpacity
                                        style={styles.counterButton}
                                        onPress={() => updateCount(type.key, -1)}
                                    >
                                        <Minus color="#a3a3a3" size={20} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterValue}>{counts[type.key]}</Text>
                                    <TouchableOpacity
                                        style={[styles.counterButton, styles.counterButtonAdd]}
                                        onPress={() => updateCount(type.key, 1)}
                                    >
                                        <Plus color="#a855f7" size={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Payment Summary */}
                    {total > 0 && (
                        <View style={styles.paymentSummary}>
                            <Text style={styles.paymentTitle}>Payment Summary</Text>

                            <View style={styles.paymentCard}>
                                {/* Order Amount Row */}
                                <TouchableOpacity
                                    style={styles.paymentRow}
                                    onPress={() => setShowPriceBreakdown(!showPriceBreakdown)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.paymentRowLeft}>
                                        <Text style={styles.paymentLabel}>Order amount</Text>
                                        {orderAmount > 0 && (
                                            showPriceBreakdown ?
                                                <ChevronUp color="#737373" size={18} /> :
                                                <ChevronDown color="#737373" size={18} />
                                        )}
                                    </View>
                                    <Text style={styles.paymentValue}>₹{orderAmount.toFixed(2)}</Text>
                                </TouchableOpacity>

                                {/* Order Breakdown (expandable) */}
                                {showPriceBreakdown && orderAmount > 0 && (
                                    <View style={styles.paymentBreakdown}>
                                        {counts.couples > 0 && (
                                            <View style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>
                                                    Couples × {counts.couples}
                                                </Text>
                                                <Text style={styles.breakdownValue}>
                                                    ₹{(counts.couples * couplePrice).toFixed(2)}
                                                </Text>
                                            </View>
                                        )}
                                        {counts.ladies > 0 && (
                                            <View style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>
                                                    Ladies × {counts.ladies}
                                                </Text>
                                                <Text style={styles.breakdownValue}>
                                                    ₹{(counts.ladies * ladiesPrice).toFixed(2)}
                                                </Text>
                                            </View>
                                        )}
                                        {counts.stags > 0 && (
                                            <View style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>
                                                    Stags × {counts.stags}
                                                </Text>
                                                <Text style={styles.breakdownValue}>
                                                    ₹{(counts.stags * stagPrice).toFixed(2)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Convenience Fee Row */}
                                <TouchableOpacity
                                    style={styles.paymentRow}
                                    onPress={() => setShowPlatformFeeModal(true)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.paymentRowLeft}>
                                        <Text style={styles.paymentLabelDotted}>Convenience fee</Text>
                                        <Text style={styles.paymentSubLabel}>
                                            (₹{CONVENIENCE_FEE} × {total} guests)
                                        </Text>
                                    </View>
                                    <Text style={styles.paymentValue}>₹{convenienceFee.toFixed(2)}</Text>
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.paymentDivider} />

                                {/* Total Row */}
                                <View style={styles.paymentRowTotal}>
                                    <Text style={styles.paymentTotalLabel}>To be paid</Text>
                                    <Text style={styles.paymentTotalValue}>₹{totalAmount.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {total > 0 && (
                        <View style={styles.infoCard}>
                            <Info color="#a855f7" size={18} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>Next Step</Text>
                                <Text style={styles.infoText}>• Enter names of all guests</Text>
                                <Text style={styles.infoText}>• Government ID is mandatory at time of entry</Text>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 180 }} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.ctaButton, total === 0 && styles.ctaButtonDisabled]}
                        onPress={initializeGuests}
                        disabled={total === 0}
                    >
                        <Text style={[styles.ctaText, total === 0 && styles.ctaTextDisabled]}>
                            Continue
                        </Text>
                        {total > 0 && (
                            <View style={styles.ctaBadge}>
                                <Text style={styles.ctaBadgeText}>{total} Guests</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Guest Names Modal */}
                <Modal
                    visible={showNamesModal}
                    animationType="slide"
                    transparent={false}
                >
                    <SafeAreaView style={styles.modalContainer}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={{ flex: 1 }}
                        >
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowNamesModal(false)}>
                                    <X color="#a3a3a3" size={24} />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Enter Guest Names</Text>
                                <View style={{ width: 24 }} />
                            </View>

                            <ScrollView style={styles.modalContent}>
                                <Text style={styles.modalSubtitle}>
                                    Please enter names for all {total} guests
                                </Text>

                                {guests.map((guest, index) => (
                                    <View key={index} style={styles.nameInputRow}>
                                        <View style={styles.nameIcon}>{getGuestIcon(guest)}</View>
                                        <View style={styles.nameInputContainer}>
                                            <Text style={styles.nameLabel}>{getGuestLabel(guest, index)}</Text>
                                            <TextInput
                                                style={styles.nameInput}
                                                placeholder={guest.type === 'couple' ? 'Both names (e.g., John & Jane)' : 'Enter name'}
                                                placeholderTextColor="#525252"
                                                value={guest.name}
                                                onChangeText={(text) => updateGuestName(index, text)}
                                            />
                                        </View>
                                    </View>
                                ))}

                                <View style={{ height: 180 }} />
                            </ScrollView>

                            {/* Payment Summary in Modal */}
                            <View style={styles.modalPaymentSection}>
                                <View style={styles.modalPaymentSummary}>
                                    <View style={styles.modalPaymentRow}>
                                        <Text style={styles.modalPaymentLabel}>Order amount</Text>
                                        <Text style={styles.modalPaymentValue}>₹{orderAmount.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.modalPaymentRow}>
                                        <Text style={styles.modalPaymentLabel}>Convenience fee</Text>
                                        <Text style={styles.modalPaymentValue}>₹{convenienceFee.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.modalPaymentDivider} />
                                    <View style={styles.modalPaymentRow}>
                                        <Text style={styles.modalPaymentTotalLabel}>Total</Text>
                                        <Text style={styles.modalPaymentTotalValue}>₹{totalAmount.toFixed(2)}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.payButton}
                                    onPress={handleConfirm}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.payButtonText}>Pay ₹{totalAmount.toFixed(0)}</Text>
                                            <Text style={styles.payButtonArrow}>›</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </Modal>

                {/* Platform Fee Info Modal */}
                <Modal
                    visible={showPlatformFeeModal}
                    animationType="fade"
                    transparent={true}
                >
                    <TouchableOpacity
                        style={styles.platformFeeOverlay}
                        activeOpacity={1}
                        onPress={() => setShowPlatformFeeModal(false)}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            style={styles.platformFeeCardContainer}
                        >
                            <BlurView
                                intensity={80}
                                tint="dark"
                                style={styles.platformFeeBlur}
                            >
                                <LinearGradient
                                    colors={['rgba(139, 92, 246, 0.2)', 'rgba(88, 28, 135, 0.3)', 'rgba(49, 10, 101, 0.4)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.platformFeeGradient}
                                >
                                    <View style={styles.platformFeeContent}>
                                        <Text style={styles.platformFeeTitle}>Platform Fee</Text>
                                        <Text style={styles.platformFeeDescription}>
                                            This small fee helps us pay the bills so that we can keep Clubin running.
                                        </Text>
                                        <View style={styles.platformFeeDivider} />
                                        <TouchableOpacity
                                            style={styles.platformFeeButton}
                                            onPress={() => setShowPlatformFeeModal(false)}
                                        >
                                            <Text style={styles.platformFeeButtonText}>OKAY</Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </BlurView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 12,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    eventImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
    },
    eventInfo: {
        marginLeft: 12,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    eventSub: {
        fontSize: 14,
        color: '#a855f7',
    },
    counters: {
        gap: 12,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    counterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    counterIcon: {
        fontSize: 28,
    },
    counterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    counterSub: {
        fontSize: 12,
        color: '#737373',
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    counterButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    counterButtonAdd: {
        backgroundColor: '#171717',
    },
    counterValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        width: 32,
        textAlign: 'center',
    },
    // Payment Summary styles
    paymentSummary: {
        marginTop: 24,
    },
    paymentTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
    },
    paymentCard: {
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    paymentRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    paymentLabel: {
        fontSize: 15,
        color: '#e5e5e5',
    },
    paymentLabelDotted: {
        fontSize: 15,
        color: '#e5e5e5',
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted',
        textDecorationColor: '#737373',
    },
    paymentSubLabel: {
        fontSize: 12,
        color: '#737373',
        marginLeft: 4,
    },
    paymentValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    paymentBreakdown: {
        paddingLeft: 16,
        paddingBottom: 8,
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(139, 92, 246, 0.3)',
        marginLeft: 8,
        marginBottom: 8,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    breakdownLabel: {
        fontSize: 13,
        color: '#a3a3a3',
    },
    breakdownValue: {
        fontSize: 13,
        color: '#a3a3a3',
    },
    paymentDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 8,
    },
    paymentRowTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    paymentTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    paymentTotalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#a855f7',
    },
    infoCard: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.2)',
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#c4b5fd',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#a78bfa',
        marginBottom: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'android' ? 100 : 110,
        backgroundColor: 'transparent',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#a855f7',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    ctaButtonDisabled: {
        backgroundColor: '#262626',
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    ctaTextDisabled: {
        color: '#525252',
    },
    ctaBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 12,
    },
    ctaBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#a3a3a3',
        marginBottom: 20,
    },
    nameInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    nameIcon: {
        fontSize: 28,
        marginTop: 8,
    },
    nameInputContainer: {
        flex: 1,
    },
    nameLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#a3a3a3',
        marginBottom: 8,
    },
    nameInput: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#fff',
    },
    modalFooter: {
        padding: 20,
        paddingBottom: 36,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    // Modal Payment Section styles
    modalPaymentSection: {
        backgroundColor: '#171717',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        padding: 20,
        paddingBottom: 36,
    },
    modalPaymentSummary: {
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    modalPaymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    modalPaymentLabel: {
        fontSize: 14,
        color: '#a3a3a3',
    },
    modalPaymentValue: {
        fontSize: 14,
        color: '#e5e5e5',
    },
    modalPaymentDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 8,
    },
    modalPaymentTotalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    modalPaymentTotalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#a855f7',
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#a855f7',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    payButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    payButtonArrow: {
        fontSize: 24,
        fontWeight: '400',
        color: '#fff',
        marginLeft: 8,
    },
    // Platform Fee Modal styles
    platformFeeOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    platformFeeCardContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
    },
    platformFeeBlur: {
        overflow: 'hidden',
    },
    platformFeeGradient: {
        padding: 24,
    },
    platformFeeContent: {
        // Content container
    },
    platformFeeTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#c4b5fd',
        marginBottom: 16,
    },
    platformFeeDescription: {
        fontSize: 17,
        color: '#e5e5e5',
        lineHeight: 26,
        marginBottom: 24,
    },
    platformFeeDivider: {
        height: 1,
        backgroundColor: 'rgba(167, 139, 250, 0.25)',
        marginBottom: 16,
    },
    platformFeeButton: {
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
    },
    platformFeeButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#a855f7',
        letterSpacing: 1,
    },
});
