import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Validation schema for events
const eventSchema = z.object({
    title: z.string().min(2),
    club: z.string().min(2),
    location: z.string().min(2),
    description: z.string().min(10),
    rules: z.string().optional(),
    genre: z.string().min(2),
    imageUrl: z.string().url(),
    videoUrl: z.string().url().optional().or(z.literal('')),
    gallery: z.array(z.string().url()).optional(),
    price: z.number().min(0).default(0),
    priceLabel: z.string().default('Free Entry'),
    date: z.string().transform((str) => new Date(str)),
    startTime: z.string(),
    endTime: z.string(),
    guestlistStatus: z.enum(['open', 'closing', 'closed']).default('open'),
    guestlistLimit: z.number().int().min(1).nullable().optional(),
    closingThreshold: z.number().int().min(1).nullable().optional(),
    guestlistCloseTime: z.string().nullable().optional(),
    guestlistCloseOnStart: z.boolean().default(true),
    featured: z.boolean().default(false),
});

// Get all events (public)
router.get('/', async (req, res: Response) => {
    try {
        const { genre, upcoming, featured } = req.query;

        const where: any = {};

        if (genre && genre !== 'all') {
            where.genre = { equals: genre as string, mode: 'insensitive' };
        }

        if (upcoming === 'true') {
            // Include events from today (start of day in local time)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            where.date = { gte: today };
        }

        if (featured === 'true') {
            where.featured = true;
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: { date: 'asc' },
            include: {
                clubRef: {
                    select: { id: true, name: true, address: true, mapUrl: true }
                },
                bookings: {
                    select: { couples: true, ladies: true, stags: true }
                },
                _count: {
                    select: { bookings: true },
                },
            },
        });

        // Calculate totalGuests for each event
        const eventsWithTotals = events.map(event => {
            const totalGuests = event.bookings.reduce((sum, b) =>
                sum + (b.couples * 2) + b.ladies + b.stags, 0);
            const { bookings, ...eventWithoutBookings } = event;
            return {
                ...eventWithoutBookings,
                totalGuests,
                spotsRemaining: event.guestlistLimit ? event.guestlistLimit - totalGuests : null
            };
        });

        res.json(eventsWithTotals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get single event (public)
router.get('/:id', async (req, res: Response) => {
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: {
                _count: {
                    select: { bookings: true },
                },
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// Create event (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = eventSchema.parse(req.body);

        const event = await prisma.event.create({
            data,
        });

        res.status(201).json(event);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Update event (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = eventSchema.partial().parse(req.body);

        const event = await prisma.event.update({
            where: { id: req.params.id },
            data,
        });

        res.json(event);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Delete event (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.event.delete({
            where: { id: req.params.id },
        });

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

export { router as eventsRouter };
