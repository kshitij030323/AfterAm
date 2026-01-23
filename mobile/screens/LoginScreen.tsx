import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert,
    Animated,
    Easing,
    Keyboard,
    Image,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/auth';
import Constants from 'expo-constants';
import { AppBackground } from '../components/AppBackground';

// Check if running in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

// Only import Firebase auth if NOT in Expo Go
let auth: any = null;
if (!isExpoGo) {
    try {
        auth = require('@react-native-firebase/auth').default;
    } catch (e) {
        console.log('Firebase auth not available');
    }
}

const { width, height } = Dimensions.get('window');

const clubinLogo = require('../assets/clubin-logo.png');

// Glass card with 3D border effect
function GlassCard3D({ children, style }: { children: React.ReactNode; style?: any }) {
    return (
        <View style={[styles.glassCardOuter, style]}>
            <View style={styles.glassCardShadow} />
            <LinearGradient
                colors={['rgba(88, 28, 135, 0.6)', 'rgba(59, 7, 100, 0.4)', 'rgba(30, 10, 60, 0.3)']}
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

// Glass input with 3D border
function GlassInput3D({
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    maxLength,
    prefix,
    style,
    textAlign = 'left',
}: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: any;
    maxLength?: number;
    prefix?: string;
    style?: any;
    textAlign?: 'left' | 'center' | 'right';
}) {
    return (
        <View style={[styles.inputOuter, style]}>
            <LinearGradient
                colors={['rgba(88, 28, 135, 0.5)', 'rgba(59, 7, 100, 0.3)', 'rgba(30, 10, 60, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inputBorder}
            >
                <View style={styles.inputInner}>
                    {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
                    <TextInput
                        style={[styles.textInput, { textAlign }]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType={keyboardType}
                        maxLength={maxLength}
                    />
                </View>
            </LinearGradient>
        </View>
    );
}

export function LoginScreen() {
    const { setUser } = useAuth();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
    const [loading, setLoading] = useState(false);
    const [showFullscreenLoading, setShowFullscreenLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirm, setConfirm] = useState<any>(null);
    const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(20)).current;

    const LOADING_PHRASES = [
        'Loading exclusive clubs',
        'Curating tonight\'s scene',
        'Unlocking guestlists',
        'Finding your vibe',
    ];

    useEffect(() => {
        if (showFullscreenLoading) {
            animatePhrase();
        } else {
            setLoadingPhraseIndex(0);
            textOpacity.setValue(0);
            textTranslateY.setValue(20);
        }
    }, [showFullscreenLoading, loadingPhraseIndex]);

    const animatePhrase = () => {
        // Reset values
        textOpacity.setValue(0);
        textTranslateY.setValue(20);

        // Fade in and slide up
        Animated.parallel([
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(textTranslateY, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Hold for 500ms then fade out
            setTimeout(() => {
                if (showFullscreenLoading) {
                    Animated.parallel([
                        Animated.timing(textOpacity, {
                            toValue: 0,
                            duration: 300,
                            easing: Easing.in(Easing.cubic),
                            useNativeDriver: true,
                        }),
                        Animated.timing(textTranslateY, {
                            toValue: -15,
                            duration: 300,
                            easing: Easing.in(Easing.cubic),
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        // Move to next phrase
                        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
                    });
                }
            }, 500);
        });
    };

    const formatPhoneDisplay = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 5) return digits;
        if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    };

    const handlePhoneChange = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, 10);
        setPhone(digits);
        setError('');
    };

    const handleSendOTP = async () => {
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const fullPhone = `+91${phone}`;

            if (isExpoGo) {
                Alert.alert(
                    'Development Mode',
                    'Running in Expo Go - Firebase auth is bypassed. Proceeding to name entry.',
                    [{ text: 'OK', onPress: () => setStep('name') }]
                );
                setLoading(false);
                return;
            }

            const confirmation = await auth().signInWithPhoneNumber(fullPhone);
            setConfirm(confirmation);
            setStep('otp');
        } catch (err: any) {
            console.error('OTP Error:', err);
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await confirm.confirm(otp);
            const existingUsers = JSON.parse(await AsyncStorage.getItem('afterhour_users') || '{}');
            const fullPhone = `+91${phone}`;

            if (existingUsers[fullPhone]) {
                const userData = existingUsers[fullPhone];
                await AsyncStorage.setItem('afterhour_current_user', JSON.stringify(userData));
                setUser(userData);
            } else {
                setStep('name');
            }
        } catch (err: any) {
            console.error('Verify Error:', err);
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNameSubmit = async () => {
        Keyboard.dismiss();

        if (name.trim().length < 2) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        setShowFullscreenLoading(true);
        try {
            const fullPhone = `+91${phone}`;

            const response = await fetch('https://api.clubin.info/api/auth/phone-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone, name: name.trim() }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            const data = await response.json();

            await AsyncStorage.setItem('afterhour_token', data.token);
            await AsyncStorage.setItem('afterhour_current_user', JSON.stringify(data.user));

            const existingUsers = JSON.parse(await AsyncStorage.getItem('afterhour_users') || '{}');
            existingUsers[fullPhone] = { ...data.user, phone: fullPhone, name: name.trim() };
            await AsyncStorage.setItem('afterhour_users', JSON.stringify(existingUsers));

            setUser({ phone: fullPhone, name: name.trim(), id: data.user.id });
        } catch (err) {
            console.error('Registration error:', err);
            setError(err instanceof Error ? err.message : 'Registration failed');
            setShowFullscreenLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        setOtp(digits);
        setError('');
    };

    return (
        <View style={styles.container}>
            <AppBackground />

            <SafeAreaView style={styles.safeArea}>
                {/* Logo at top - centered */}
                <View style={styles.logoContainer}>
                    <Image
                        source={clubinLogo}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {step === 'phone' && (
                    <View style={styles.formContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome</Text>
                            <Text style={styles.subtitle}>Enter your phone number to continue</Text>
                        </View>

                        <GlassCard3D>
                            <GlassInput3D
                                value={formatPhoneDisplay(phone)}
                                onChangeText={handlePhoneChange}
                                placeholder="98765 43210"
                                keyboardType="phone-pad"
                                maxLength={11}
                                prefix="+91"
                            />

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[styles.buttonOuter, (loading || phone.length !== 10) && styles.buttonDisabled]}
                                onPress={handleSendOTP}
                                disabled={loading || phone.length !== 10}
                            >
                                <LinearGradient
                                    colors={['rgba(88, 28, 135, 0.7)', 'rgba(59, 7, 100, 0.5)', 'rgba(30, 10, 60, 0.4)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonBorder}
                                >
                                    <View style={styles.buttonInner}>
                                        {loading ? (
                                            <ActivityIndicator color="#a855f7" />
                                        ) : (
                                            <Text style={styles.buttonText}>Get OTP</Text>
                                        )}
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.hint}>We'll send a verification code to this number</Text>
                        </GlassCard3D>
                    </View>
                )}

                {step === 'otp' && (
                    <View style={styles.formContainer}>
                        <TouchableOpacity
                            onPress={() => { setStep('phone'); setOtp(''); setError(''); }}
                            style={styles.backButton}
                        >
                            <ChevronLeft color="rgba(255,255,255,0.6)" size={20} />
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Text style={styles.title}>Verify OTP</Text>
                            <Text style={styles.subtitle}>Enter the 6-digit code sent to +91 {formatPhoneDisplay(phone)}</Text>
                        </View>

                        <GlassCard3D>
                            <GlassInput3D
                                value={otp}
                                onChangeText={handleOTPChange}
                                placeholder="• • • • • •"
                                keyboardType="number-pad"
                                maxLength={6}
                                textAlign="center"
                            />

                            {error ? <Text style={styles.errorCenter}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[styles.buttonOuter, (loading || otp.length !== 6) && styles.buttonDisabled]}
                                onPress={handleVerifyOTP}
                                disabled={loading || otp.length !== 6}
                            >
                                <LinearGradient
                                    colors={['rgba(88, 28, 135, 0.7)', 'rgba(59, 7, 100, 0.5)', 'rgba(30, 10, 60, 0.4)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonBorder}
                                >
                                    <View style={styles.buttonInner}>
                                        {loading ? (
                                            <ActivityIndicator color="#a855f7" />
                                        ) : (
                                            <Text style={styles.buttonText}>Verify & Continue</Text>
                                        )}
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
                                <Text style={styles.resendText}>Resend OTP</Text>
                            </TouchableOpacity>
                        </GlassCard3D>
                    </View>
                )}

                {step === 'name' && (
                    <View style={styles.formContainer}>
                        <View style={styles.headerCenterName}>
                            <Text style={styles.titleName}>Just One Step Left</Text>
                            <Text style={styles.subtitleName}>This name will be used for guestlist entry</Text>
                        </View>

                        <GlassCard3D>
                            <GlassInput3D
                                value={name}
                                onChangeText={(text) => { setName(text); setError(''); }}
                                placeholder="Full name"
                                maxLength={30}
                                textAlign="center"
                            />

                            {error ? <Text style={styles.errorCenter}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[styles.buttonOuter, (name.trim().length < 2 || loading) && styles.buttonDisabled]}
                                onPress={handleNameSubmit}
                                disabled={name.trim().length < 2 || loading}
                            >
                                <LinearGradient
                                    colors={['rgba(88, 28, 135, 0.7)', 'rgba(59, 7, 100, 0.5)', 'rgba(30, 10, 60, 0.4)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonBorder}
                                >
                                    <View style={styles.buttonInner}>
                                        {loading ? (
                                            <ActivityIndicator color="#a855f7" />
                                        ) : (
                                            <Text style={styles.buttonText}>Confirm Name</Text>
                                        )}
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </GlassCard3D>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Fullscreen Loading Overlay - Cinematic Style */}
            {showFullscreenLoading && (
                <View style={styles.loadingOverlay}>
                    <AppBackground />
                    <Animated.Text
                        style={[
                            styles.loadingText,
                            {
                                opacity: textOpacity,
                                transform: [{ translateY: textTranslateY }],
                            },
                        ]}
                    >
                        {LOADING_PHRASES[loadingPhraseIndex]}
                    </Animated.Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a12',
    },
    safeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 5,
    },
    logoContainer: {
        marginTop: Platform.OS === 'android' ? 40 : 12,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    logoImage: {
        width: 280,
        height: 80,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    formContainer: {
        zIndex: 10,
    },
    header: {
        marginBottom: 24,
    },
    headerCenter: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
    },
    headerCenterName: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    titleName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitleName: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 22,
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
        padding: 20,
    },
    inputOuter: {
        marginBottom: 16,
    },
    inputBorder: {
        borderRadius: 16,
        padding: 2,
    },
    inputInner: {
        backgroundColor: 'rgba(10, 10, 18, 0.98)',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputPrefix: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        letterSpacing: 1,
    },
    buttonOuter: {
        borderRadius: 50,
        overflow: 'hidden',
        marginTop: 8,
    },
    buttonBorder: {
        borderRadius: 50,
        padding: 2,
    },
    buttonInner: {
        backgroundColor: 'rgba(10, 10, 18, 0.98)',
        borderRadius: 48,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: '#f87171',
        fontSize: 13,
        marginBottom: 8,
    },
    errorCenter: {
        color: '#f87171',
        fontSize: 13,
        marginBottom: 8,
        textAlign: 'center',
    },
    hint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 15,
        marginLeft: 4,
    },
    resendText: {
        color: '#a855f7',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarBorder: {
        borderRadius: 40,
        padding: 2,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(15, 15, 25, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    loadingText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 0.5,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

