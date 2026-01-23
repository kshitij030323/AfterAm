import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Image,
    Easing,
    Dimensions,
    ImageBackground,
} from 'react-native';

const { width } = Dimensions.get('window');

const splashBackground = require('../assets/splash-background.png');
const splashLogoIcon = require('../assets/splash-logo-icon.png');

interface AnimatedSplashScreenProps {
    onAnimationComplete: () => void;
}

export function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
    // Animation values
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.9)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        startAnimationSequence();
    }, []);

    const startAnimationSequence = () => {
        // Phase 1: Logo fades in slowly and noticeably (0-1000ms)
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 1000,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 1200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Phase 2: Hold logo visible longer (1200-2200ms), then fade out (2200-2600ms)
        setTimeout(() => {
            Animated.timing(logoOpacity, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }, 2200);

        // Phase 3: Smooth screen transition (2500-3000ms)
        setTimeout(() => {
            Animated.timing(screenOpacity, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                onAnimationComplete();
            });
        }, 2600);
    };

    return (
        <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
            <ImageBackground
                source={splashBackground}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.contentContainer}>
                    {/* Logo only - fades in then out */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: logoOpacity,
                                transform: [{ scale: logoScale }],
                            },
                        ]}
                    >
                        <Image
                            source={splashLogoIcon}
                            style={styles.logoIcon}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>
            </ImageBackground>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        // Subtle, clean purple glow
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
    },
    logoIcon: {
        // ~28% of screen width
        width: width * 0.28,
        height: width * 0.28,
    },
});
