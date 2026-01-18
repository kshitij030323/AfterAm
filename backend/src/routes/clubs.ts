import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const clubSchema = z.object({
    name: z.string().min(1),
    location: z.string().min(1),
    address: z.string().optional(),
    mapUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    imageUrl: z.string().url(),
});

// Get all clubs (public)
router.get('/', async (req, res: Response) => {
    try {
        const clubs = await prisma.club.findMany({
            include: {
                _count: {
                    select: { events: true }
                }
            },
            orderBy: { name: 'asc' },
        });
        res.json(clubs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch clubs' });
    }
});

// Get single club with events
router.get('/:id', async (req, res: Response) => {
    try {
        const club = await prisma.club.findUnique({
            where: { id: req.params.id },
            include: {
                events: {
                    where: {
                        date: { gte: new Date() }
                    },
                    orderBy: { date: 'asc' },
                    include: {
                        _count: {
                            select: { bookings: true }
                        }
                    }
                },
            },
        });

        if (!club) {
            return res.status(404).json({ error: 'Club not found' });
        }

        res.json(club);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch club' });
    }
});

// Create club (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = clubSchema.parse(req.body);

        const club = await prisma.club.create({
            data,
        });

        res.status(201).json(club);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create club' });
    }
});

// Update club (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = clubSchema.partial().parse(req.body);

        const club = await prisma.club.update({
            where: { id: req.params.id },
            data,
        });

        res.json(club);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to update club' });
    }
});

// Delete club (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.club.delete({
            where: { id: req.params.id },
        });

        res.json({ message: 'Club deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete club' });
    }
});

// Get club's events
router.get('/:id/events', async (req, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            where: { clubId: req.params.id },
            orderBy: { date: 'asc' },
            include: {
                _count: {
                    select: { bookings: true }
                }
            }
        });

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch club events' });
    }
});

// Generate club credentials (admin only)
router.post('/:id/credentials', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const club = await prisma.club.findUnique({
            where: { id: req.params.id },
        });

        if (!club) {
            return res.status(404).json({ error: 'Club not found' });
        }

        // Generate email from club name
        const emailSlug = club.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${emailSlug}@afterhour.club`;

        // Generate random password
        const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update club with credentials
        await prisma.club.update({
            where: { id: req.params.id },
            data: { email, password: hashedPassword },
        });

        // Return plain password (only shown once)
        res.json({ email, password });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate credentials' });
    }
});

export { router as clubsRouter };

