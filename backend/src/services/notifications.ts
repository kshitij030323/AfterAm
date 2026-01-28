import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Firebase Admin SDK
// You need to set FIREBASE_SERVICE_ACCOUNT environment variable with the path to your service account JSON file
// Or set FIREBASE_SERVICE_ACCOUNT_JSON with the JSON content directly
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (serviceAccountPath) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn('Firebase service account not configured. Push notifications will be logged but not sent.');
      return;
    }

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

// Initialize on module load
initializeFirebase();

interface SendNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, string>;
  eventId?: string;
  sentBy?: string;
}

interface SendToUserOptions extends SendNotificationOptions {
  userId: string;
}

interface SendToAllOptions extends SendNotificationOptions {
  // No additional options needed
}

// Send notification to a specific user
export async function sendNotificationToUser(options: SendToUserOptions): Promise<boolean> {
  const { userId, title, body, data, eventId, sentBy } = options;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deviceToken: true, name: true },
    });

    if (!user?.deviceToken) {
      console.log(`User ${userId} has no device token registered`);
      await logNotification({
        userId,
        title,
        body,
        data,
        eventId,
        sentBy,
        success: false,
        error: 'No device token registered',
        type: 'manual',
      });
      return false;
    }

    const message: admin.messaging.Message = {
      token: user.deviceToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    if (firebaseInitialized) {
      await admin.messaging().send(message);
      console.log(`Notification sent to user ${userId}: ${title}`);
    } else {
      console.log(`[DRY RUN] Would send notification to user ${userId}: ${title} - ${body}`);
    }

    await logNotification({
      userId,
      title,
      body,
      data,
      eventId,
      sentBy,
      success: true,
      type: 'manual',
    });

    return true;
  } catch (error: any) {
    console.error(`Failed to send notification to user ${userId}:`, error);

    await logNotification({
      userId,
      title,
      body,
      data,
      eventId,
      sentBy,
      success: false,
      error: error.message || 'Unknown error',
      type: 'manual',
    });

    // If token is invalid, clear it from the database
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      await prisma.user.update({
        where: { id: userId },
        data: { deviceToken: null },
      });
      console.log(`Cleared invalid device token for user ${userId}`);
    }

    return false;
  }
}

// Send notification to multiple users
export async function sendNotificationToUsers(
  userIds: string[],
  options: SendNotificationOptions
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendNotificationToUser({ ...options, userId });
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// Send notification to all users with device tokens
export async function sendNotificationToAll(options: SendToAllOptions): Promise<{ success: number; failed: number }> {
  const { title, body, data, eventId, sentBy } = options;

  const users = await prisma.user.findMany({
    where: {
      deviceToken: { not: null },
    },
    select: { id: true, deviceToken: true },
  });

  console.log(`Sending notification to ${users.length} users: ${title}`);

  // Log the broadcast notification
  await logNotification({
    userId: null,
    title,
    body,
    data,
    eventId,
    sentBy,
    success: true,
    type: 'manual',
  });

  return sendNotificationToUsers(
    users.map((u) => u.id),
    { title, body, data, eventId, sentBy }
  );
}

// Send abandoned booking reminder
export async function sendAbandonedBookingReminder(abandonedBookingId: string): Promise<boolean> {
  try {
    const abandonedBooking = await prisma.abandonedBooking.findUnique({
      where: { id: abandonedBookingId },
      include: {
        user: { select: { id: true, deviceToken: true, name: true } },
        event: { select: { id: true, title: true, guestlistStatus: true } },
      },
    });

    if (!abandonedBooking) {
      console.log(`Abandoned booking ${abandonedBookingId} not found`);
      return false;
    }

    if (abandonedBooking.notificationSent) {
      console.log(`Notification already sent for abandoned booking ${abandonedBookingId}`);
      return false;
    }

    // Check if guestlist is still open
    if (abandonedBooking.event.guestlistStatus === 'closed') {
      console.log(`Guestlist for event ${abandonedBooking.event.id} is already closed`);
      return false;
    }

    // Check if user has already completed booking for this event
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: abandonedBooking.userId,
        eventId: abandonedBooking.eventId,
        status: { not: 'cancelled' },
      },
    });

    if (existingBooking) {
      console.log(`User ${abandonedBooking.userId} already has a booking for event ${abandonedBooking.eventId}`);
      // Mark as sent to prevent future attempts
      await prisma.abandonedBooking.update({
        where: { id: abandonedBookingId },
        data: { notificationSent: true, notificationSentAt: new Date() },
      });
      return false;
    }

    const title = 'Complete Your Booking!';
    const body = `🔴 The guestlist for ${abandonedBooking.event.title} is closing soon! Get on it now!`;

    const success = await sendNotificationToUser({
      userId: abandonedBooking.userId,
      title,
      body,
      data: {
        type: 'abandoned_booking',
        eventId: abandonedBooking.eventId,
      },
      eventId: abandonedBooking.eventId,
    });

    // Log this specific notification type
    await prisma.notification.create({
      data: {
        userId: abandonedBooking.userId,
        title,
        body,
        data: { type: 'abandoned_booking', eventId: abandonedBooking.eventId },
        eventId: abandonedBooking.eventId,
        type: 'abandoned_booking',
        success,
      },
    });

    // Update abandoned booking record
    await prisma.abandonedBooking.update({
      where: { id: abandonedBookingId },
      data: {
        notificationSent: true,
        notificationSentAt: new Date(),
      },
    });

    return success;
  } catch (error) {
    console.error(`Failed to send abandoned booking reminder ${abandonedBookingId}:`, error);
    return false;
  }
}

// Log notification to database
async function logNotification(params: {
  userId: string | null;
  title: string;
  body: string;
  data?: Record<string, string>;
  eventId?: string;
  sentBy?: string;
  success: boolean;
  error?: string;
  type: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        body: params.body,
        data: params.data || undefined,
        eventId: params.eventId || undefined,
        sentBy: params.sentBy || undefined,
        success: params.success,
        error: params.error || undefined,
        type: params.type,
      },
    });
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

// Register device token for a user
export async function registerDeviceToken(userId: string, token: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { deviceToken: token },
    });
    console.log(`Device token registered for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to register device token for user ${userId}:`, error);
    return false;
  }
}

// Get users with their guestlist count (number of bookings)
export async function getUsersWithGuestlistCount() {
  const users = await prisma.user.findMany({
    where: {
      isAdmin: false,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      deviceToken: true,
      createdAt: true,
      _count: {
        select: {
          bookings: {
            where: {
              status: { not: 'cancelled' },
            },
          },
        },
      },
    },
    orderBy: {
      bookings: {
        _count: 'desc',
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    hasDeviceToken: !!user.deviceToken,
    createdAt: user.createdAt,
    guestlistCount: user._count.bookings,
  }));
}
