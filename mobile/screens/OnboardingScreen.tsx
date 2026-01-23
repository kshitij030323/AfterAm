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
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/AppBackground';

const clubinLogo = require('../assets/clubin-logo.png');

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
    {
        id: '1',
        subtitle: 'EXCLUSIVE CLUBS. EVERY GENRE.',
        titleLine1: 'Get In.',
        titleLine2: 'No Lines.\nNo Stress.',
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

// Animated text content component with staggered animations
function AnimatedTextContent({ item, isActive }: { item: typeof ONBOARDING_DATA[0]; isActive: boolean }) {
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const titleLine1Opacity = useRef(new Animated.Value(0)).current;
    const titleLine1TranslateY = useRef(new Animated.Value(12)).current;
    const titleLine2Opacity = useRef(new Animated.Value(0)).current;
    const titleLine2TranslateY = useRef(new Animated.Value(12)).current;
    const titleLine2Scale = useRef(new Animated.Value(0.98)).current;
    const titleLine2Glow = useRef(new Animated.Value(0)).current;
    const descriptionOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            runStaggeredAnimation();
        } else {
            resetAnimations();
        }
    }, [isActive]);

    const resetAnimations = () => {
        subtitleOpacity.setValue(0);
        titleLine1Opacity.setValue(0);
        titleLine1TranslateY.setValue(12);
        titleLine2Opacity.setValue(0);
        titleLine2TranslateY.setValue(12);
        titleLine2Scale.setValue(0.98);
        titleLine2Glow.setValue(0);
        descriptionOpacity.setValue(0);
    };

    const runStaggeredAnimation = () => {
        resetAnimations();

        // Stagger delay between elements
        const staggerDelay = 120;

        // 1. Subtitle fades in first (subtle)
        Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // 2. Title line 1 slides up + fades in
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(titleLine1Opacity, {
                    toValue: 1,
                    duration: 450,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(titleLine1TranslateY, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        }, staggerDelay);

        // 3. Title line 2 with scale + glow pulse
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(titleLine2Opacity, {
                    toValue: 1,
                    duration: 450,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(titleLine2TranslateY, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(titleLine2Scale, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();

            // Subtle glow pulse
            Animated.sequence([
                Animated.timing(titleLine2Glow, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(titleLine2Glow, {
                    toValue: 0.6,
                    duration: 600,
                    easing: Easing.inOut(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        }, staggerDelay * 2);

        // 4. Description fades in last with reduced opacity
        setTimeout(() => {
            Animated.timing(descriptionOpacity, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }, staggerDelay * 3.5);
    };

    return (
        <>
            {/* Subtitle */}
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
                {item.subtitle}
            </Animated.Text>

            {/* Title Line 1 */}
            <Animated.Text
                style={[
                    styles.titleLine1,
                    {
                        opacity: titleLine1Opacity,
                        transform: [{ translateY: titleLine1TranslateY }],
                    },
                ]}
            >
                {item.titleLine1}
            </Animated.Text>

            {/* Title Line 2 - with glow effect */}
            <Animated.View
                style={[
                    styles.titleLine2Container,
                    {
                        opacity: titleLine2Opacity,
                        transform: [
                            { translateY: titleLine2TranslateY },
                            { scale: titleLine2Scale },
                        ],
                    },
                ]}
            >
                <Text style={styles.titleLine2}>
                    {item.titleLine2}
                </Text>
            </Animated.View>

            {/* Description */}
            <Animated.Text style={[styles.description, { opacity: descriptionOpacity }]}>
                {item.description}
            </Animated.Text>
        </>
    );
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

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
                    {/* Logo - stays fixed */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={clubinLogo}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Reduced spacer - moves content higher */}
                    <View style={styles.spacer} />

                    {/* Main Content Card - expanded */}
                    <View style={styles.contentCard}>
                        <GlassCard3D>
                            <AnimatedTextContent
                                item={item}
                                isActive={index === currentIndex}
                            />
                        </GlassCard3D>
                    </View>

                    {/* Page Indicators - stays fixed */}
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

                    {/* Button - stays fixed */}
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
        marginTop: 12,
        alignItems: 'center',
    },
    logoImage: {
        width: 280,
        height: 80,
    },
    spacer: {
        flex: 0.4, // Reduced from 1 to move content higher
    },
    contentCard: {
        marginBottom: 28,
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
        borderRadius: 28,
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
    },
    glassCardBorder: {
        borderRadius: 28,
        padding: 2,
    },
    glassCardInner: {
        backgroundColor: 'rgba(10, 10, 18, 0.95)',
        borderRadius: 26,
        paddingVertical: 32, // Increased padding for larger card
        paddingHorizontal: 28,
        minHeight: 220, // Minimum height for more presence
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    titleLine1: {
        fontSize: 36, // Larger headline
        fontWeight: '800',
        color: '#fff',
        lineHeight: 44, // Increased line height
    },
    titleLine2Container: {
        marginBottom: 20,
    },
    titleLine2: {
        fontSize: 36, // Larger headline
        fontWeight: '800',
        color: '#a855f7',
        lineHeight: 44, // Increased line height
        textShadowColor: 'rgba(168, 85, 247, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    description: {
        fontSize: 14, // Slightly smaller
        color: 'rgba(255, 255, 255, 0.55)',
        lineHeight: 21,
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
