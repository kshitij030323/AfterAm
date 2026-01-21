import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Ticket, User, MapPinPlus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from './lib/auth';
import { HomeScreen } from './screens/HomeScreen';
import { EventDetailScreen } from './screens/EventDetailScreen';
import { GuestlistScreen } from './screens/GuestlistScreen';
import { ConfirmationScreen } from './screens/ConfirmationScreen';
import { BookingsScreen } from './screens/BookingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ClubsScreen } from './screens/ClubsScreen';
import { ClubDetailScreen } from './screens/ClubDetailScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Stack.Screen name="HomeList" component={HomeScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Guestlist" component={GuestlistScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
    </Stack.Navigator>
  );
}

function ClubsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Stack.Screen name="ClubsList" component={ClubsScreen} />
      <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Guestlist" component={GuestlistScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
    </Stack.Navigator>
  );
}

// Custom tab bar icon with purple glass effect for active state
function TabIcon({ IconComponent, focused, size }: { IconComponent: any; focused: boolean; size: number }) {
  if (focused) {
    return (
      <View style={styles.activeTabIconContainer}>
        <BlurView intensity={80} tint="light" style={styles.activeTabIconBlur}>
          <View style={styles.activeTabIconOverlay}>
            <IconComponent color="#a855f7" size={size} />
          </View>
        </BlurView>
      </View>
    );
  }
  return <IconComponent color="#666" size={size} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(20, 20, 20, 0.7)',
          borderTopWidth: 0,
          height: 90,
          paddingBottom: 30,
          paddingTop: 15,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={50}
            tint="dark"
            style={{
              ...StyleSheet.absoluteFillObject,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              overflow: 'hidden',
            }}
          />
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={Home} focused={focused} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Clubs"
        component={ClubsStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={MapPinPlus} focused={focused} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={Ticket} focused={focused} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={User} focused={focused} size={22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('clubin_onboarding_complete');
      setShowOnboarding(completed !== 'true');
    } catch {
      setShowOnboarding(true);
    }
  };

  // Loading state while checking onboarding status
  if (showOnboarding === null) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
      </View>
    );
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
    );
  }

  // Show login if user is not authenticated
  if (!user) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  // Show main app if user is logged in
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <View style={styles.container}>
        <AppNavigator />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  activeTabIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  activeTabIconBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabIconOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
});
