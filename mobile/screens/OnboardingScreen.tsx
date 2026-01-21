import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    SafeAreaView,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/AppBackground';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
    {
        id: '1',
        subtitle: 'EXCLUSIVE CLUBS. EVERY GENRE.',
        titleLine1: 'Get In.',
        titleLine2: 'No Lines. No Stress.',
        description: 'Discover the hottest clubs around you —\nfrom techno to hip-hop, all in one place.',
    },
    {
        id: '2',
        subtitle: 'FREE GUESTLISTS & PRIORITY ENTRY',
        titleLine1: 'Your Name.',
        titleLine2: 'On the List. Instantly.',
        description: 'Join guestlists in seconds, skip the hassle,\nand walk in like a VIP.',
    },
];

interface OnboardingScreenProps {
    onComplete: () => void;
}

// Glass card with 3D border effect
function GlassCard3D({ children, style }: { children: React.ReactNode; style?: any }) {
    return (
        <View style={[styles.glassCardOuter, style]}>
            <View style={styles.glassCardShadow} />
            <LinearGradient
                colors={['rgba(168, 85, 247, 0.4)', 'rgba(139, 92, 246, 0.2)', 'rgba(88, 28, 135, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glassCardBorder}
            >
                <View style={styles.glassCardInner}>
                    {children}
                </View>
            </LinearGradient>
        </View>
    );
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        animateContent();
    }, [currentIndex]);

    const animateContent = () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(20);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleNext = async () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            await completeOnboarding();
        }
    };

    const handleSkip = async () => {
        await completeOnboarding();
    };

    const completeOnboarding = async () => {
        await AsyncStorage.setItem('clubin_onboarding_complete', 'true');
        onComplete();
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    const renderPage = ({ item, index }: { item: typeof ONBOARDING_DATA[0]; index: number }) => (
        <View style={styles.page}>
            <AppBackground />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentContainer}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>🎉</Text>
                        <Text style={styles.logoText}>Clubin</Text>
                    </View>

                    {/* Spacer */}
                    <View style={styles.spacer} />

                    {/* Main Content Card */}
                    <Animated.View
                        style={[
                            styles.contentCard,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <GlassCard3D>
                            <Text style={styles.subtitle}>{item.subtitle}</Text>
                            <Text style={styles.titleLine1}>{item.titleLine1}</Text>
                            <Text style={styles.titleLine2}>{item.titleLine2}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </GlassCard3D>
                    </Animated.View>

                    {/* Page Indicators */}
                    <View style={styles.indicatorContainer}>
                        {ONBOARDING_DATA.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.indicator,
                                    i === currentIndex && styles.indicatorActive,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Button with 3D border */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.nextButtonOuter}
                            onPress={handleNext}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(88, 28, 135, 0.7)', 'rgba(59, 7, 100, 0.5)', 'rgba(30, 10, 60, 0.4)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.nextButtonBorder}
                            >
                                <View style={styles.nextButtonInner}>
                                    <Text style={styles.nextButtonText}>
                                        {currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
                                    </Text>
                                    <Text style={styles.nextButtonArrow}>→</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {currentIndex < ONBOARDING_DATA.length - 1 && (
                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={handleSkip}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.skipButtonText}>Skip</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_DATA}
                renderItem={renderPage}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a12',
    },
    page: {
        width,
        height,
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    logoIcon: {
        fontSize: 24,
    },
    logoText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    spacer: {
        flex: 1,
    },
    contentCard: {
        marginBottom: 24,
    },
    glassCardOuter: {
        position: 'relative',
    },
    glassCardShadow: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: -4,
        bottom: -4,
        borderRadius: 24,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    glassCardBorder: {
        borderRadius: 24,
        padding: 2,
    },
    glassCardInner: {
        backgroundColor: 'rgba(10, 10, 18, 0.95)',
        borderRadius: 22,
        padding: 24,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    titleLine1: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 38,
    },
    titleLine2: {
        fontSize: 32,
        fontWeight: '800',
        color: '#a855f7',
        lineHeight: 38,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 22,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    indicator: {
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    indicatorActive: {
        backgroundColor: '#a855f7',
        width: 48,
    },
    buttonContainer: {
        gap: 12,
    },
    nextButtonOuter: {
        borderRadius: 50,
        overflow: 'hidden',
    },
    nextButtonBorder: {
        borderRadius: 50,
        padding: 2,
    },
    nextButtonInner: {
        backgroundColor: 'rgba(10, 10, 18, 0.98)',
        borderRadius: 48,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    nextButtonArrow: {
        fontSize: 18,
        color: '#a855f7',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
    },
});
