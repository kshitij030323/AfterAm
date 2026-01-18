import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Guest schema
const guestSchema = z.object({
    name: z.string().min(1),
    gender: z.enum(['male', 'female', 'couple']),
    type: z.enum(['couple', 'lady', 'stag']),
});

// Validation schema
const bookingSchema = z.object({
    eventId: z.string().uuid(),
    couples: z.number().int().min(0).default(0),
    ladies: z.number().int().min(0).default(0),
    stags: z.number().int().min(0).default(0),
    guests: z.array(guestSchema).optional(),
});

// Create booking (authenticated users)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { eventId, couples, ladies, stags, guests } = bookingSchema.parse(req.body);

        if (couples + ladies + stags === 0) {
            return res.status(400).json({ error: 'Must have at least one guest' });
        }

        // Check if event exists and guestlist is open
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                bookings: {
                    select: { couples: true, ladies: true, stags: true }
                }
            }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.guestlistStatus === 'closed') {
            return res.status(400).json({ error: 'Guestlist is closed for this event' });
        }

        // Calculate current total guests
        const currentTotal = event.bookings.reduce((sum, b) =>
            sum + (b.couples * 2) + b.ladies + b.stags, 0);
        const newGuests = (couples * 2) + ladies + stags;

        // Check capacity if limit is set
        if (event.guestlistLimit) {
            const remaining = event.guestlistLimit - currentTotal;
            if (newGuests > remaining) {
                return res.status(400).json({
                    error: `Only ${remaining} spots remaining on the guestlist`
                });
            }
        }

        // Check for existing booking
        const existingBooking = await prisma.booking.findFirst({
            where: {
                userId: req.userId,
                eventId,
            },
        });

        if (existingBooking) {
            return res.status(400).json({ error: 'You already have a booking for this event' });
        }

        const booking = await prisma.booking.create({
            data: {
                userId: req.userId!,
                eventId,
                couples,
                ladies,
                stags,
                guests: guests || undefined,
            },
            include: {
                event: true,
            },
        });

        // Auto-update status based on threshold
        if (event.guestlistLimit && event.closingThreshold) {
            const newTotal = currentTotal + newGuests;
            const spotsRemaining = event.guestlistLimit - newTotal;

            if (spotsRemaining <= 0) {
                await prisma.event.update({
                    where: { id: eventId },
                    data: { guestlistStatus: 'closed' }
                });
            } else if (spotsRemaining <= event.closingThreshold && event.guestlistStatus === 'open') {
                await prisma.event.update({
                    where: { id: eventId },
                    data: { guestlistStatus: 'closing' }
                });
            }
        }

        res.status(201).json(booking);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Get user's bookings
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.userId },
            include: {
                event: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get single booking by ID or QR code
router.get('/:identifier', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { identifier } = req.params;

        const booking = await prisma.booking.findFirst({
            where: {
                OR: [
                    { id: identifier },
                    { qrCode: identifier },
                ],
            },
            include: {
                event: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Only allow viewing own bookings (unless admin)
        if (booking.userId !== req.userId && !req.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

// Get all bookings for an event (admin only)
router.get('/event/:eventId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { eventId: req.params.eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Update booking status (admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = z.object({
            status: z.enum(['confirmed', 'checked-in', 'cancelled']),
        }).parse(req.body);

        const booking = await prisma.booking.update({
            where: { id: req.params.id },
            data: { status },
        });

        res.json(booking);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// Cancel booking (user's own)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: req.params.id },
        });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.userId !== req.userId && !req.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.booking.delete({
            where: { id: req.params.id },
        });

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

export { router as bookingsRouter };
