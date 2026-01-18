import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'afterhour-secret-key';

// Generate club JWT token
function generateClubToken(clubId: string): string {
    return jwt.sign({ clubId, type: 'club' }, JWT_SECRET, { expiresIn: '7d' });
}

// Club authentication middleware
interface ClubRequest extends Request {
    club?: { id: string; name: string };
}

export async function authenticateClub(req: any, res: Response, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { clubId: string; type: string };

        if (decoded.type !== 'club') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        const club = await prisma.club.findUnique({
            where: { id: decoded.clubId },
            select: { id: true, name: true, location: true, imageUrl: true }
        });

        if (!club) {
            return res.status(401).json({ error: 'Club not found' });
        }

        req.club = club;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Club login
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

router.post('/login', async (req, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const club = await prisma.club.findUnique({
            where: { email },
        });

        if (!club || !club.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, club.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateClubToken(club.id);

        res.json({
            club: {
                id: club.id,
                name: club.name,
                location: club.location,
                imageUrl: club.imageUrl,
            },
            token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current club
router.get('/me', authenticateClub, async (req: any, res: Response) => {
    res.json({ club: req.club });
});

// Get club's events with booking counts
router.get('/events', authenticateClub, async (req: any, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            where: { clubId: req.club.id },
            orderBy: { date: 'asc' },
            include: {
                _count: {
                    select: { bookings: true }
                },
                bookings: {
                    select: {
                        id: true,
                        couples: true,
                        ladies: true,
                        stags: true,
                        scannedAt: true,
                    }
                }
            }
        });

        // Add stats to each event
        const eventsWithStats = events.map(event => {
            const totalGuests = event.bookings.reduce((sum, b) =>
                sum + b.couples * 2 + b.ladies + b.stags, 0
            );
            const scannedCount = event.bookings
                .filter(b => b.scannedAt)
                .reduce((sum, b) => sum + b.couples * 2 + b.ladies + b.stags, 0);

            return {
                ...event,
                totalGuests,
                scannedCount,
                bookings: undefined, // Remove bookings array
            };
        });

        res.json(eventsWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get event guestlist (bookings)
router.get('/events/:eventId/guestlist', authenticateClub, async (req: any, res: Response) => {
    try {
        const event = await prisma.event.findFirst({
            where: {
                id: req.params.eventId,
                clubId: req.club.id,
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found or not owned by this club' });
        }

        const bookings = await prisma.booking.findMany({
            where: { eventId: req.params.eventId },
            include: {
                user: {
                    select: { id: true, name: true, phone: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch guestlist' });
    }
});

// Scan QR code
router.post('/scan', authenticateClub, async (req: any, res: Response) => {
    try {
        const { qrCode, qrData } = req.body;

        // Parse QR data if it's JSON
        let bookingId = qrCode;
        if (qrData) {
            try {
                const parsed = JSON.parse(qrData);
                bookingId = parsed.bookingId || parsed.code || qrData;
            } catch {
                bookingId = qrData;
            }
        }

        // Find booking by ID or qrCode field
        const booking = await prisma.booking.findFirst({
            where: {
                OR: [
                    { id: bookingId },
                    { qrCode: bookingId },
                ]
            },
            include: {
                user: {
                    select: { id: true, name: true, phone: true }
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        club: true,
                        clubId: true,
                        date: true
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({
                error: 'Booking not found',
                valid: false
            });
        }

        // Check if booking is for this club's event
        if (booking.event.clubId !== req.club.id) {
            return res.status(403).json({
                error: 'This booking is for a different club',
                valid: false
            });
        }

        // Check if already scanned
        if (booking.scannedAt) {
            return res.status(400).json({
                error: 'This QR code has already been scanned',
                scannedAt: booking.scannedAt,
                valid: false,
                booking: {
                    id: booking.id,
                    user: booking.user,
                    couples: booking.couples,
                    ladies: booking.ladies,
                    stags: booking.stags,
                    event: booking.event,
                }
            });
        }

        // Mark as scanned
        const updatedBooking = await prisma.booking.update({
            where: { id: booking.id },
            data: {
                scannedAt: new Date(),
                scannedByClubId: req.club.id,
            },
            include: {
                user: {
                    select: { id: true, name: true, phone: true }
                },
                event: {
                    select: { id: true, title: true, club: true, date: true }
                }
            }
        });

        const totalGuests = booking.couples * 2 + booking.ladies + booking.stags;

        res.json({
            valid: true,
            message: 'Entry approved!',
            booking: {
                id: updatedBooking.id,
                user: updatedBooking.user,
                couples: updatedBooking.couples,
                ladies: updatedBooking.ladies,
                stags: updatedBooking.stags,
                totalGuests,
                event: updatedBooking.event,
                scannedAt: updatedBooking.scannedAt,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Scan failed', valid: false });
    }
});

// Event schema for scanner
const eventSchema = z.object({
    title: z.string().min(2),
    location: z.string().min(2),
    description: z.string().min(10),
    rules: z.string().optional(),
    genre: z.string().min(2),
    imageUrl: z.string().url(),
    videoUrl: z.string().url().optional().or(z.literal('')),
    gallery: z.array(z.string().url()).optional(),
    price: z.number().min(0).default(0),
    priceLabel: z.string().default('Free Entry'),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    guestlistStatus: z.enum(['open', 'closing', 'closed']).default('open'),
    guestlistLimit: z.number().int().min(1).nullable().optional(),
    closingThreshold: z.number().int().min(1).nullable().optional(),
    guestlistCloseTime: z.string().nullable().optional(),
    guestlistCloseOnStart: z.boolean().default(true),
    featured: z.boolean().default(false),
});

// Create event for club
router.post('/events', authenticateClub, async (req: any, res: Response) => {
    try {
        const data = eventSchema.parse(req.body);

        const event = await prisma.event.create({
            data: {
                title: data.title,
                club: req.club.name,
                clubId: req.club.id,
                location: data.location,
                description: data.description,
                rules: data.rules || '',
                genre: data.genre,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl || null,
                gallery: data.gallery || [],
                price: data.price,
                priceLabel: data.priceLabel,
                date: new Date(data.date),
                startTime: data.startTime,
                endTime: data.endTime,
                guestlistStatus: data.guestlistStatus,
                guestlistLimit: data.guestlistLimit,
                closingThreshold: data.closingThreshold,
                featured: data.featured,
            },
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

// Update event for club
router.put('/events/:id', authenticateClub, async (req: any, res: Response) => {
    try {
        // Verify event belongs to this club
        const existing = await prisma.event.findFirst({
            where: { id: req.params.id, clubId: req.club.id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const data = eventSchema.parse(req.body);

        const event = await prisma.event.update({
            where: { id: req.params.id },
            data: {
                title: data.title,
                location: data.location,
                description: data.description,
                rules: data.rules || '',
                genre: data.genre,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl || null,
                gallery: data.gallery || [],
                price: data.price,
                priceLabel: data.priceLabel,
                date: new Date(data.date),
                startTime: data.startTime,
                endTime: data.endTime,
                guestlistStatus: data.guestlistStatus,
                guestlistLimit: data.guestlistLimit,
                closingThreshold: data.closingThreshold,
                featured: data.featured,
            },
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

export { router as scannerRouter };
