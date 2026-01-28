import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  sendNotificationToUsers,
  sendNotificationToAll,
  registerDeviceToken,
  getUsersWithGuestlistCount,
} from '../services/notifications.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Register device token (for mobile app users)
router.post('/register-token', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const success = await registerDeviceToken(userId, token);
    if (success) {
      res.json({ message: 'Device token registered successfully' });
    } else {
      res.status(500).json({ error: 'Failed to register device token' });
    }
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

// Get users with guestlist count (admin only)
router.get('/users', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await getUsersWithGuestlistCount();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Send notification to specific users (admin only)
router.post('/send', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId;
    const { userIds, title, body, eventId } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'At least one user ID is required' });
    }

    const result = await sendNotificationToUsers(userIds, {
      title,
      body,
      eventId,
      sentBy: adminId,
    });

    res.json({
      message: 'Notifications sent',
      success: result.success,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Send notification to all users (admin only)
router.post('/send-all', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId;
    const { title, body, eventId } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const result = await sendNotificationToAll({
      title,
      body,
      eventId,
      sentBy: adminId,
    });

    res.json({
      message: 'Notifications sent to all users',
      success: result.success,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Get notification history (admin only)
router.get('/history', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;

    const where: any = {};
    if (type) {
      where.type = type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        user: {
          select: { name: true, phone: true },
        },
        event: {
          select: { title: true },
        },
      },
    });

    const total = await prisma.notification.count({ where });

    res.json({
      notifications,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

// Track abandoned booking (for mobile app)
router.post('/abandoned-booking', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Check if event exists and guestlist is still open
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { guestlistStatus: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.guestlistStatus === 'closed') {
      return res.json({ message: 'Guestlist is already closed' });
    }

    // Check if user already has a booking for this event
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        eventId,
        status: { not: 'cancelled' },
      },
    });

    if (existingBooking) {
      return res.json({ message: 'User already has a booking for this event' });
    }

    // Check if there's already an abandoned booking record
    const existingAbandoned = await prisma.abandonedBooking.findFirst({
      where: {
        userId,
        eventId,
        notificationSent: false,
      },
    });

    if (existingAbandoned) {
      // Update the timestamp
      await prisma.abandonedBooking.update({
        where: { id: existingAbandoned.id },
        data: { abandonedAt: new Date() },
      });
      return res.json({ message: 'Abandoned booking updated' });
    }

    // Create new abandoned booking record
    await prisma.abandonedBooking.create({
      data: {
        userId,
        eventId,
      },
    });

    res.json({ message: 'Abandoned booking tracked' });
  } catch (error) {
    console.error('Error tracking abandoned booking:', error);
    res.status(500).json({ error: 'Failed to track abandoned booking' });
  }
});

// Cancel abandoned booking tracking (user completed booking or explicitly cancelled)
router.delete('/abandoned-booking/:eventId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.params;

    await prisma.abandonedBooking.deleteMany({
      where: {
        userId,
        eventId,
        notificationSent: false,
      },
    });

    res.json({ message: 'Abandoned booking tracking cancelled' });
  } catch (error) {
    console.error('Error cancelling abandoned booking tracking:', error);
    res.status(500).json({ error: 'Failed to cancel abandoned booking tracking' });
  }
});

export default router;
