import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { User, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/auth';
import { auth, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from '../lib/firebase';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

const { width, height } = Dimensions.get('window');

export function LoginScreen() {
    const { setUser } = useAuth();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

    // Format phone for display
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
            const phoneProvider = new PhoneAuthProvider(auth);
            const verId = await phoneProvider.verifyPhoneNumber(
                fullPhone,
                recaptchaVerifier.current!
            );
            setVerificationId(verId);
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
            const credential = PhoneAuthProvider.credential(verificationId, otp);
            await signInWithCredential(auth, credential);

            // Check if user exists in AsyncStorage (returning user)
            const existingUsers = JSON.parse(await AsyncStorage.getItem('afterhour_users') || '{}');
            const fullPhone = `+91${phone}`;

            if (existingUsers[fullPhone]) {
                // Returning user - login directly
                const userData = existingUsers[fullPhone];
                await AsyncStorage.setItem('afterhour_current_user', JSON.stringify(userData));
                setUser(userData);
            } else {
                // New user - ask for name
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
        console.log('handleNameSubmit called, name:', name);
        if (name.trim().length < 2) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        try {
            const fullPhone = `+91${phone}`;
            console.log('Calling backend API for phone auth:', fullPhone);

            // Register/login user via backend API
            const response = await fetch('http://192.168.1.9:3001/api/auth/phone-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: fullPhone,
                    name: name.trim(),
                }),
            });

            console.log('Backend response status:', response.status);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            const data = await response.json();
            console.log('Backend response data:', data);

            // Save token and user data
            await AsyncStorage.setItem('afterhour_token', data.token);
            await AsyncStorage.setItem('afterhour_current_user', JSON.stringify(data.user));
            console.log('Token saved successfully');

            setUser({ phone: fullPhone, name: name.trim(), id: data.user.id });
        } catch (err) {
            console.error('Registration error:', err);
            setError(err instanceof Error ? err.message : 'Registration failed');
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
            {/* Video Background */}
            <Video
                source={require('../assets/login-bg.mp4')}
                style={styles.backgroundVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
            />
            <View style={styles.videoOverlay} />

            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={auth.app.options}
                attemptInvisibleVerification={true}
            />

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

                        <View style={styles.inputContainer}>
                            <Text style={styles.countryCode}>+91</Text>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="98765 43210"
                                placeholderTextColor="#737373"
                                value={formatPhoneDisplay(phone)}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                maxLength={11}
                            />
                        </View>

                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TouchableOpacity
                            style={[styles.button, (loading || phone.length !== 10) && styles.buttonDisabled]}
                            onPress={handleSendOTP}
                            disabled={loading || phone.length !== 10}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Get OTP</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.hint}>We'll send a verification code to this number</Text>
                    </View>
                )}

                {step === 'otp' && (
                    <View style={styles.formContainer}>
                        <TouchableOpacity
                            onPress={() => { setStep('phone'); setOtp(''); setError(''); }}
                            style={styles.backButton}
                        >
                            <ChevronLeft color="#9ca3af" size={20} />
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Text style={styles.title}>Verify OTP</Text>
                            <Text style={styles.subtitle}>Enter the 6-digit code sent to +91 {formatPhoneDisplay(phone)}</Text>
                        </View>

                        <TextInput
                            style={styles.otpInput}
                            placeholder="• • • • • •"
                            placeholderTextColor="#737373"
                            value={otp}
                            onChangeText={handleOTPChange}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        {error ? <Text style={styles.errorCenter}>{error}</Text> : null}

                        <TouchableOpacity
                            style={[styles.button, (loading || otp.length !== 6) && styles.buttonDisabled]}
                            onPress={handleVerifyOTP}
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Verify & Continue</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
                            <Text style={styles.resendText}>Resend OTP</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 'name' && (
                    <View style={styles.formContainer}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <User color="#fff" size={40} />
                            </View>
                        </View>

                        <View style={styles.headerCenter}>
                            <Text style={styles.title}>Almost there!</Text>
                            <Text style={styles.subtitle}>What should we call you?</Text>
                        </View>

                        <TextInput
                            style={styles.nameInput}
                            placeholder="Your name"
                            placeholderTextColor="#737373"
                            value={name}
                            onChangeText={(text) => { setName(text); setError(''); }}
                            maxLength={30}
                        />

                        {error ? <Text style={styles.errorCenter}>{error}</Text> : null}

                        <TouchableOpacity
                            style={[styles.button, name.trim().length < 2 && styles.buttonDisabled]}
                            onPress={handleNameSubmit}
                            disabled={name.trim().length < 2}
                        >
                            <Text style={styles.buttonText}>Let's Party! 🎉</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: width,
        height: height,
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        marginBottom: 32,
    },
    headerCenter: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 16,
        marginBottom: 16,
    },
    countryCode: {
        color: '#9ca3af',
        fontSize: 18,
        fontWeight: '600',
        paddingLeft: 16,
    },
    phoneInput: {
        flex: 1,
        padding: 16,
        fontSize: 18,
        color: '#fff',
        letterSpacing: 2,
    },
    otpInput: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 16,
        padding: 16,
        fontSize: 24,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 16,
    },
    nameInput: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 16,
        padding: 16,
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#a855f7',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    error: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 8,
    },
    errorCenter: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    hint: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 24,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backText: {
        color: '#9ca3af',
        fontSize: 16,
        marginLeft: 4,
    },
    resendText: {
        color: '#a855f7',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#a855f7',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
