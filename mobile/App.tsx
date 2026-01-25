import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
import { AnimatedSplashScreen } from './components/AnimatedSplashScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Custom dark theme to prevent white flash on Android
const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#a855f7',
    background: '#0a0a0a',
    card: '#0a0a0a',
    text: '#ffffff',
    border: '#1a1a1a',
    notification: '#a855f7',
  },
};

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
        animation: 'slide_from_right',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
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
        animation: 'slide_from_right',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
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
        <BlurView intensity={80} tint="dark" style={styles.activeTabIconBlur}>
          <View style={styles.activeTabIconOverlay}>
            <IconComponent color="#ffffff" size={size} />
          </View>
        </BlurView>
      </View>
    );
  }
  return <IconComponent color="#6b5b7a" size={size} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        lazy: false,
        animation: 'fade',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(30, 15, 50, 0.15)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(167, 139, 250, 0.25)',
          height: 90,
          paddingBottom: 30,
          paddingTop: 15,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        },
        tabBarBackground: () => (
          <View style={{
            ...StyleSheet.absoluteFillObject,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            overflow: 'hidden',
          }}>
            <BlurView
              intensity={100}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.15)', 'rgba(88, 28, 135, 0.25)', 'rgba(49, 10, 101, 0.35)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
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
  const [showSplash, setShowSplash] = useState(true);
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

  // Show animated splash screen first
  if (showSplash) {
    return (
      <AnimatedSplashScreen onAnimationComplete={() => setShowSplash(false)} />
    );
  }

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
      <NavigationContainer theme={AppDarkTheme}>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  // Show main app if user is logged in
  return (
    <NavigationContainer theme={AppDarkTheme}>
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
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
  },
});
