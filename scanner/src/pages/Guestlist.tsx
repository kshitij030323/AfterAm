import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useApi } from '../App';

interface Guest {
    name: string;
    gender: 'male' | 'female' | 'couple';
    type: 'couple' | 'lady' | 'stag';
}

interface Booking {
    id: string;
    couples: number;
    ladies: number;
    stags: number;
    guests?: Guest[];
    createdAt: string;
    scannedAt: string | null;
    user: { name: string; phone: string };
}

export function Guestlist() {
    const { eventId } = useParams();
    const { fetchApi } = useApi();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

    useEffect(() => {
        loadGuestlist();
    }, [eventId]);

    const loadGuestlist = async () => {
        try {
            const data = await fetchApi(`/scanner/events/${eventId}/guestlist`);
            setBookings(data);
        } catch (err) {
            console.error('Failed to load guestlist:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatPhone = (phone: string) => {
        if (phone.length > 10) {
            return `${phone.slice(0, 3)} ${phone.slice(3, 8)} ${phone.slice(8)}`;
        }
        return phone;
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getGuestIcon = (guest: Guest) => {
        if (guest.type === 'couple') return '👫';
        if (guest.type === 'lady') return '💃';
        return '🕺';
    };

    const toggleExpand = (bookingId: string) => {
        setExpandedBooking(prev => prev === bookingId ? null : bookingId);
    };

    if (loading) {
        return <div className="loading-screen"><div className="spinner" /></div>;
    }

    // Count total individual guests
    const totalGuests = bookings.reduce((sum, b) => sum + b.couples * 2 + b.ladies + b.stags, 0);

    const scannedCount = bookings
        .filter(b => b.scannedAt)
        .reduce((sum, b) => sum + b.couples * 2 + b.ladies + b.stags, 0);

    return (
        <div>
            <Link to="/" className="back-btn">
                <ArrowLeft size={18} /> Back to Events
            </Link>

            <div className="guestlist-header">
                <div>
                    <h1 className="page-title">Guestlist</h1>
                    <p className="page-subtitle">
                        {bookings.length} bookings • {totalGuests} total guests • {scannedCount} checked in
                    </p>
                </div>
            </div>

            {bookings.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No guests on the list yet</p>
            ) : (
                <div className="bookings-list">
                    {bookings.map((booking) => {
                        const guestCount = booking.couples * 2 + booking.ladies + booking.stags;
                        const isExpanded = expandedBooking === booking.id;
                        const hasGuests = booking.guests && booking.guests.length > 0;

                        return (
                            <div key={booking.id} className="booking-card">
                                <div
                                    className="booking-header"
                                    onClick={() => hasGuests && toggleExpand(booking.id)}
                                    style={{ cursor: hasGuests ? 'pointer' : 'default' }}
                                >
                                    <div className="booking-info">
                                        <div className="booking-main">
                                            <strong>{booking.user.name}</strong>
                                            <span className="booking-phone">{formatPhone(booking.user.phone)}</span>
                                        </div>
                                        <div className="booking-meta">
                                            <span className="guest-count">
                                                <Users size={14} /> {guestCount} guests
                                            </span>
                                            <span className="guest-breakdown">
                                                {booking.couples > 0 && `${booking.couples} Couples `}
                                                {booking.ladies > 0 && `${booking.ladies} Ladies `}
                                                {booking.stags > 0 && `${booking.stags} Stags`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="booking-status">
                                        {booking.scannedAt ? (
                                            <span className="status-badge status-scanned">
                                                <CheckCircle size={12} /> {formatTime(booking.scannedAt)}
                                            </span>
                                        ) : (
                                            <span className="status-badge status-pending">
                                                <Clock size={12} /> Pending
                                            </span>
                                        )}
                                        {hasGuests && (
                                            isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                                        )}
                                    </div>
                                </div>

                                {isExpanded && hasGuests && (
                                    <div className="guests-list">
                                        <div className="guests-title">Registered Guests:</div>
                                        {booking.guests!.map((guest, idx) => (
                                            <div key={idx} className="guest-item">
                                                <span className="guest-icon">{getGuestIcon(guest)}</span>
                                                <span className="guest-name">{guest.name}</span>
                                                <span className="guest-type">{guest.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .bookings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .booking-card {
                    background: var(--bg-card);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .booking-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                }
                .booking-info {
                    flex: 1;
                }
                .booking-main {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 4px;
                }
                .booking-main strong {
                    font-size: 16px;
                }
                .booking-phone {
                    color: var(--text-secondary);
                    font-size: 14px;
                }
                .booking-meta {
                    display: flex;
                    gap: 16px;
                    font-size: 13px;
                }
                .guest-count {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--purple);
                }
                .guest-breakdown {
                    color: var(--text-secondary);
                }
                .booking-status {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--text-secondary);
                }
                .guests-list {
                    padding: 12px 16px 16px;
                    background: var(--bg-input);
                    border-top: 1px solid #333;
                }
                .guests-title {
                    font-size: 12px;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }
                .guest-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    border-bottom: 1px solid #333;
                }
                .guest-item:last-child {
                    border-bottom: none;
                }
                .guest-icon {
                    font-size: 20px;
                }
                .guest-name {
                    flex: 1;
                    font-weight: 500;
                }
                .guest-type {
                    font-size: 12px;
                    color: var(--text-secondary);
                    text-transform: capitalize;
                    background: var(--bg-card);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
