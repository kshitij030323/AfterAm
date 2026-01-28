import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDeviceToken } from './api';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if we're on a physical device
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID || undefined,
    });
    token = pushTokenData.data;
    console.log('Expo push token:', token);
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }

  // Configure Android notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#A855F7',
    });
  }

  return token;
}

// Register device token with the backend
export async function registerTokenWithBackend(): Promise<boolean> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) {
      return false;
    }

    // Check if token is already registered
    const storedToken = await AsyncStorage.getItem('pushToken');
    if (storedToken === token) {
      console.log('Token already registered');
      return true;
    }

    // Register with backend
    await registerDeviceToken(token);
    await AsyncStorage.setItem('pushToken', token);
    console.log('Push token registered with backend');
    return true;
  } catch (error) {
    console.error('Failed to register push token:', error);
    return false;
  }
}

// Add notification listeners
export function addNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  // Listener for when user taps on a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
    onNotificationTapped?.(response);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// Get last notification response (for when app is opened via notification tap)
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

// Clear all notifications
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

// Schedule a local notification (for testing)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number = 1
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}
