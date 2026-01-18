import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    const admin = await prisma.user.upsert({
        where: { phone: process.env.ADMIN_PHONE || '+919999999999' },
        update: {},
        create: {
            email: process.env.ADMIN_EMAIL || 'admin@afterhour.in',
            password: adminPassword,
            name: 'Admin',
            phone: process.env.ADMIN_PHONE || '+919999999999',
            isAdmin: true,
        },
    });
    console.log('✅ Admin user created:', admin.phone);

    // Create sample clubs
    const clubs = [
        {
            name: 'Mirage',
            location: 'Church Street, Bengaluru',
            address: 'No. 42, Church Street, Ashok Nagar, Bengaluru 560001',
            mapUrl: 'https://maps.google.com/?q=Mirage+Club+Bengaluru',
            description: 'The ultimate underground techno experience',
            imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=800',
        },
        {
            name: 'XU Fashion Bar',
            location: 'Old Airport Road, Bengaluru',
            address: 'Old Airport Road, Domlur, Bengaluru 560017',
            mapUrl: 'https://maps.google.com/?q=XU+Fashion+Bar+Bengaluru',
            description: 'Where fashion meets nightlife',
            imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800',
        },
        {
            name: 'High Ultra Lounge',
            location: 'Malleshwaram, Bengaluru',
            address: 'World Trade Center, Malleshwaram, Bengaluru 560055',
            mapUrl: 'https://maps.google.com/?q=High+Ultra+Lounge+Bengaluru',
            description: 'Rooftop views with premium vibes',
            imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800',
        },
        {
            name: 'Raahi',
            location: 'St. Marks Road, Bengaluru',
            address: '1/2, St. Marks Road, Ashok Nagar, Bengaluru 560001',
            mapUrl: 'https://maps.google.com/?q=Raahi+Bengaluru',
            description: 'Hip-hop and R&B sanctuary',
            imageUrl: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80&w=800',
        },
    ];

    for (const clubData of clubs) {
        await prisma.club.upsert({
            where: { name: clubData.name },
            update: clubData,
            create: clubData,
        });
    }
    console.log(`✅ Created ${clubs.length} sample clubs`);

    // Create sample events
    const events = [
        {
            title: 'Techno Bunker',
            club: 'Mirage',
            location: 'Church Street, Bengaluru',
            description: 'Deep underground techno beats featuring DJ Zaden. The best sound system in the city awaits.',
            rules: 'Couples & Girls entry free till 9:30 PM. Stags cover charge applicable.',
            genre: 'Techno',
            imageUrl: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&q=80&w=800',
            price: 0,
            priceLabel: 'Free Entry',
            date: new Date('2026-01-18T20:00:00'),
            startTime: '8:00 PM',
            endTime: '1:00 AM',
            guestlistStatus: 'open',
            featured: true,
        },
        {
            title: 'Desi Beats Night',
            club: 'XU Fashion Bar',
            location: 'Old Airport Road, Bengaluru',
            description: 'The biggest Bollywood night in town! Dance to the latest chartbusters with DJ Rakesh.',
            rules: 'Dress code: Smart Casuals. No slippers allowed.',
            genre: 'Bollywood',
            imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800',
            price: 1000,
            priceLabel: '₹1000 Cover',
            date: new Date('2026-01-17T21:00:00'),
            startTime: '9:00 PM',
            endTime: '1:00 AM',
            guestlistStatus: 'open',
            featured: true,
        },
        {
            title: 'Skyline Sundowner',
            club: 'High Ultra Lounge',
            location: 'Malleshwaram, Bengaluru',
            description: 'Sunset views from the highest lounge in South India. Sundowner sets by special guest artists.',
            rules: 'Entry restricted to guestlist members only.',
            genre: 'House',
            imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800',
            price: 0,
            priceLabel: 'Guestlist Only',
            date: new Date('2026-01-19T17:00:00'),
            startTime: '5:00 PM',
            endTime: '11:00 PM',
            guestlistStatus: 'open',
            featured: false,
        },
        {
            title: 'Hip-Hop Hustle',
            club: 'Raahi',
            location: 'St. Marks Road, Bengaluru',
            description: 'Old school vs New school hip hop night. Rap battles and showcase starting at 10 PM.',
            rules: 'Strictly 21+. ID check mandatory.',
            genre: 'Hip-Hop',
            imageUrl: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80&w=800',
            price: 500,
            priceLabel: '₹500 Entry',
            date: new Date('2026-01-18T20:00:00'),
            startTime: '8:00 PM',
            endTime: '1:00 AM',
            guestlistStatus: 'open',
            featured: false,
        },
    ];

    for (const eventData of events) {
        await prisma.event.create({ data: eventData });
    }
    console.log(`✅ Created ${events.length} sample events`);

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
