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
    Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const clubinLogo = require('../assets/clubin-logo.png');

const { width, height } = Dimensions.get('window');

const VIDEO_URL = 'https://customer-cbeadsgr09pnsezs.cloudflarestream.com/257c7359efd4b4aaebcc03aa8fc78a36/manifest/video.m3u8';
const THUMBNAIL_URL = 'https://customer-cbeadsgr09pnsezs.cloudflarestream.com/257c7359efd4b4aaebcc03aa8fc78a36/thumbnails/thumbnail.jpg';

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
        titleLine2: 'On the List.\nInstantly.',
        description: 'Join guestlists in seconds, skip the hassle,\nand walk in like a VIP.',
    },
];

interface OnboardingScreenProps {
    onComplete: () => void;
}

// Animated text content component with staggered animations
function AnimatedTextContent({ item, isActive }: { item: typeof ONBOARDING_DATA[0]; isActive: boolean }) {
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const titleLine1Opacity = useRef(new Animated.Value(0)).current;
    const titleLine1TranslateY = useRef(new Animated.Value(12)).current;
    const titleLine2Opacity = useRef(new Animated.Value(0)).current;
    const titleLine2TranslateY = useRef(new Animated.Value(12)).current;
    const titleLine2Scale = useRef(new Animated.Value(0.98)).current;
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
        descriptionOpacity.setValue(0);
    };

    const runStaggeredAnimation = () => {
        resetAnimations();

        const staggerDelay = 120;

        // 1. Subtitle fades in
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

        // 3. Title line 2 with scale
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
        }, staggerDelay * 2);

        // 4. Description fades in last
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
        <View style={styles.textContent}>
            {/* Subtitle */}
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
                {item.subtitle}
            </Animated.Text>

            {/* Title Line 1 - Bold sans-serif */}
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

            {/* Title Line 2 - Instrument Serif Italic */}
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
        </View>
    );
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const videoRef = useRef<Video>(null);

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
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentContainer}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={clubinLogo}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Spacer to push text content down */}
                    <View style={styles.spacer} />

                    {/* Main text content */}
                    <AnimatedTextContent
                        item={item}
                        isActive={index === currentIndex}
                    />

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

                    {/* Button */}
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
            {/* Video Background - shared across all pages */}
            <Video
                ref={videoRef}
                source={{ uri: VIDEO_URL }}
                posterSource={{ uri: THUMBNAIL_URL }}
                usePoster={true}
                posterStyle={styles.videoPoster}
                style={styles.backgroundVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
            />
            {/* Dark overlay gradient for readability */}
            <LinearGradient
                colors={[
                    'rgba(0, 0, 0, 0.3)',
                    'rgba(0, 0, 0, 0.1)',
                    'rgba(0, 0, 0, 0.2)',
                    'rgba(0, 0, 0, 0.7)',
                    'rgba(0, 0, 0, 0.85)',
                ]}
                locations={[0, 0.2, 0.4, 0.7, 1]}
                style={styles.videoOverlay}
            />

            {/* Swipeable pages on top */}
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
                style={styles.flatList}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a12',
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width,
        height,
    },
    videoPoster: {
        width,
        height,
        resizeMode: 'cover',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    flatList: {
        flex: 1,
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
        paddingHorizontal: 28,
        paddingBottom: 20,
    },
    logoContainer: {
        marginTop: Platform.OS === 'android' ? 40 : 12,
        alignItems: 'center',
    },
    logoImage: {
        width: 280,
        height: 80,
    },
    spacer: {
        flex: 1,
    },
    textContent: {
        marginBottom: 32,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    titleLine1: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 50,
    },
    titleLine2Container: {
        marginBottom: 20,
    },
    titleLine2: {
        fontSize: 42,
        fontFamily: 'InstrumentSerif-Italic',
        fontStyle: 'italic',
        color: '#c4b5fd',
        lineHeight: 50,
    },
    description: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.55)',
        lineHeight: 21,
    },
    indicatorContainer: {
        flexDirection: 'row',
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
        backgroundColor: 'rgba(10, 10, 18, 0.85)',
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
