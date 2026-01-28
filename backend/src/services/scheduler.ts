import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendAbandonedBookingReminder } from './notifications';

const prisma = new PrismaClient();

// Run every minute to check for abandoned bookings that need notification
export function startAbandonedBookingScheduler() {
  console.log('Starting abandoned booking scheduler...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Find abandoned bookings that:
      // 1. Were abandoned more than 2 minutes ago
      // 2. Haven't had a notification sent yet
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      const abandonedBookings = await prisma.abandonedBooking.findMany({
        where: {
          abandonedAt: {
            lte: twoMinutesAgo,
          },
          notificationSent: false,
        },
        include: {
          event: {
            select: {
              guestlistStatus: true,
            },
          },
        },
      });

      for (const abandoned of abandonedBookings) {
        // Only send if guestlist is still open
        if (abandoned.event.guestlistStatus !== 'closed') {
          console.log(`Sending abandoned booking reminder for ${abandoned.id}`);
          await sendAbandonedBookingReminder(abandoned.id);
        } else {
          // Mark as sent to prevent future attempts
          await prisma.abandonedBooking.update({
            where: { id: abandoned.id },
            data: { notificationSent: true },
          });
        }
      }

      if (abandonedBookings.length > 0) {
        console.log(`Processed ${abandonedBookings.length} abandoned booking reminders`);
      }
    } catch (error) {
      console.error('Error processing abandoned bookings:', error);
    }
  });

  console.log('Abandoned booking scheduler started');
}

// Clean up old abandoned booking records (older than 24 hours)
export function startCleanupScheduler() {
  console.log('Starting cleanup scheduler...');

  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await prisma.abandonedBooking.deleteMany({
        where: {
          abandonedAt: {
            lt: oneDayAgo,
          },
        },
      });

      console.log(`Cleaned up ${result.count} old abandoned booking records`);
    } catch (error) {
      console.error('Error cleaning up abandoned bookings:', error);
    }
  });

  console.log('Cleanup scheduler started');
}

// Start all schedulers
export function startSchedulers() {
  startAbandonedBookingScheduler();
  startCleanupScheduler();
}
