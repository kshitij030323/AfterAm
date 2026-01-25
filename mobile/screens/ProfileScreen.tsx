import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    Switch,
    Linking,
    Platform,
    StatusBar,
} from 'react-native';
import { ChevronRight, LogOut, X, Bell, User, HelpCircle, FileText, Shield } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/auth';
import { AppBackground } from '../components/AppBackground';

export function ProfileScreen() {
    const { user, logout, updateUser } = useAuth();
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [eventReminders, setEventReminders] = useState(true);
    const [promotions, setPromotions] = useState(false);

    // Format phone for display
    const formatPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 12) {
            return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
        }
        return phone;
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.clear();
                    logout();
                }
            },
        ]);
    };

    const handleSaveSettings = async () => {
        if (editName.trim() && updateUser) {
            try {
                const token = await AsyncStorage.getItem('afterhour_token');
                const response = await fetch('https://api.clubin.info/api/auth/update-profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ name: editName.trim() }),
                });

                if (response.ok) {
                    updateUser({ ...user!, name: editName.trim() });
                    Alert.alert('Success', 'Profile updated successfully!');
                } else {
                    // Update locally even if server fails
                    updateUser({ ...user!, name: editName.trim() });
                    Alert.alert('Updated', 'Profile updated locally.');
                }
            } catch (error) {
                // Update locally on network error
                updateUser({ ...user!, name: editName.trim() });
            }
        }
        setShowSettingsModal(false);
    };

    const handleMenuPress = (id: string) => {
        switch (id) {
            case 'settings':
                setEditName(user?.name || '');
                setShowSettingsModal(true);
                break;
            case 'notifications':
                setShowNotificationsModal(true);
                break;
            case 'help':
                Alert.alert(
                    'Help & Support',
                    'Need help? Contact us!',
                    [
                        { text: 'Email Us', onPress: () => Linking.openURL('mailto:support@afterhour.app') },
                        { text: 'Call Us', onPress: () => Linking.openURL('tel:+919876543210') },
                        { text: 'Close', style: 'cancel' },
                    ]
                );
                break;
            case 'terms':
                Alert.alert(
                    'Terms of Service',
                    'By using AfterHour, you agree to:\n\n• Be at least 21 years old\n• Provide accurate information\n• Respect venue rules and policies\n• Not resell or transfer bookings\n• Accept that bookings are subject to venue capacity\n\nFull terms available at afterhour.app/terms',
                    [{ text: 'OK' }]
                );
                break;
            case 'privacy':
                Alert.alert(
                    'Privacy Policy',
                    'We protect your data:\n\n• Your info is encrypted and secure\n• We never sell your data\n• Phone number used only for booking verification\n• You can delete your account anytime\n\nFull policy at afterhour.app/privacy',
                    [{ text: 'OK' }]
                );
                break;
        }
    };

    const MENU_ITEMS = [
        { id: 'settings', label: 'Account Settings', section: 'account', icon: User },
        { id: 'notifications', label: 'Notifications', section: 'account', icon: Bell },
        { id: 'help', label: 'Help & Support', section: 'support', icon: HelpCircle },
        { id: 'terms', label: 'Terms of Service', section: 'support', icon: FileText },
        { id: 'privacy', label: 'Privacy Policy', section: 'support', icon: Shield },
    ];

    const accountItems = MENU_ITEMS.filter((i) => i.section === 'account');
    const supportItems = MENU_ITEMS.filter((i) => i.section === 'support');

    return (
        <View style={styles.container}>
            <AppBackground />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Profile</Text>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarGradient}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {user?.name?.[0]?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user?.name || 'Guest'}</Text>
                            <Text style={styles.profileEmail}>{user?.phone ? formatPhone(user.phone) : 'No phone'}</Text>
                            <View style={styles.badges}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Member</Text>
                                </View>
                                <View style={[styles.badge, styles.badgePurple]}>
                                    <Text style={[styles.badgeText, { color: '#c084fc' }]}>Bengaluru</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Account Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ACCOUNT</Text>
                        {accountItems.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.menuItem,
                                    index === 0 && styles.menuItemFirst,
                                    index === accountItems.length - 1 && styles.menuItemLast,
                                ]}
                                onPress={() => handleMenuPress(item.id)}
                            >
                                <View style={styles.menuItemLeft}>
                                    <item.icon color="#a855f7" size={20} />
                                    <Text style={styles.menuItemText}>{item.label}</Text>
                                </View>
                                <ChevronRight color="#525252" size={20} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Support Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>SUPPORT</Text>
                        {supportItems.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.menuItem,
                                    index === 0 && styles.menuItemFirst,
                                    index === supportItems.length - 1 && styles.menuItemLast,
                                ]}
                                onPress={() => handleMenuPress(item.id)}
                            >
                                <View style={styles.menuItemLeft}>
                                    <item.icon color="#a855f7" size={20} />
                                    <Text style={styles.menuItemText}>{item.label}</Text>
                                </View>
                                <ChevronRight color="#525252" size={20} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut color="#ef4444" size={20} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Account Settings Modal */}
                <Modal visible={showSettingsModal} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Account Settings</Text>
                                <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                                    <X color="#fff" size={24} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Display Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone Number</Text>
                                <View style={[styles.input, styles.inputDisabled]}>
                                    <Text style={styles.inputDisabledText}>
                                        {user?.phone ? formatPhone(user.phone) : 'Not set'}
                                    </Text>
                                </View>
                                <Text style={styles.inputHint}>Phone number cannot be changed</Text>
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Notifications Modal */}
                <Modal visible={showNotificationsModal} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Notifications</Text>
                                <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                                    <X color="#fff" size={24} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.settingRow}>
                                <View>
                                    <Text style={styles.settingLabel}>Push Notifications</Text>
                                    <Text style={styles.settingDescription}>Receive booking confirmations</Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: '#333', true: '#7c3aed' }}
                                    thumbColor={notificationsEnabled ? '#a855f7' : '#666'}
                                />
                            </View>

                            <View style={styles.settingRow}>
                                <View>
                                    <Text style={styles.settingLabel}>Event Reminders</Text>
                                    <Text style={styles.settingDescription}>Get reminded before events</Text>
                                </View>
                                <Switch
                                    value={eventReminders}
                                    onValueChange={setEventReminders}
                                    trackColor={{ false: '#333', true: '#7c3aed' }}
                                    thumbColor={eventReminders ? '#a855f7' : '#666'}
                                />
                            </View>

                            <View style={styles.settingRow}>
                                <View>
                                    <Text style={styles.settingLabel}>Promotions</Text>
                                    <Text style={styles.settingDescription}>Special offers and discounts</Text>
                                </View>
                                <Switch
                                    value={promotions}
                                    onValueChange={setPromotions}
                                    trackColor={{ false: '#333', true: '#7c3aed' }}
                                    thumbColor={promotions ? '#a855f7' : '#666'}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={() => {
                                    setShowNotificationsModal(false);
                                    Alert.alert('Saved', 'Notification preferences updated!');
                                }}
                            >
                                <Text style={styles.saveButtonText}>Save Preferences</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatarGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#a855f7',
        padding: 2,
    },
    avatar: {
        flex: 1,
        backgroundColor: '#171717',
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#737373',
        marginBottom: 12,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.2)',
    },
    badgePurple: {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: 'rgba(168, 85, 247, 0.2)',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fbbf24',
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#525252',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 92, 246, 0.15)',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuItemFirst: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    menuItemLast: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomWidth: 0,
    },
    menuItemText: {
        fontSize: 16,
        color: '#e5e5e5',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ef4444',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#171717',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#a3a3a3',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#262626',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputDisabled: {
        backgroundColor: '#1a1a1a',
    },
    inputDisabledText: {
        color: '#666',
        fontSize: 16,
    },
    inputHint: {
        fontSize: 12,
        color: '#666',
        marginTop: 6,
    },
    saveButton: {
        backgroundColor: '#a855f7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        color: '#666',
    },
});

