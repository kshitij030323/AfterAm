import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, Check, X, Users } from 'lucide-react';
import { getEvent, getEventBookings, updateBookingStatus, Event, Booking } from '../lib/api';
import toast from 'react-hot-toast';

export function EventBookings() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!id) return;

        Promise.all([getEvent(id), getEventBookings(id)])
            .then(([e, b]) => {
                setEvent(e);
                setBookings(b);
            })
            .catch(() => toast.error('Failed to load data'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleStatusUpdate = async (bookingId: string, status: string) => {
        try {
            await updateBookingStatus(bookingId, status);
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
            );
            toast.success(`Marked as ${status}`);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const toggleBooking = (bookingId: string) => {
        setExpandedBookings(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookingId)) {
                newSet.delete(bookingId);
            } else {
                newSet.add(bookingId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500">Event not found</p>
            </div>
        );
    }

    const totalGuests = bookings.reduce(
        (sum, b) => sum + b.couples * 2 + b.ladies + b.stags,
        0
    );
    const checkedIn = bookings.filter((b) => b.status === 'checked-in').length;

    return (
        <div>
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Events
            </button>

            {/* Event Header */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 flex gap-6">
                <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-32 h-32 rounded-xl object-cover"
                />
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white mb-1">{event.title}</h1>
                    <p className="text-purple-400 font-medium">{event.club}</p>
                    <p className="text-neutral-500 text-sm mt-1">
                        {new Date(event.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                        {' • '}
                        {event.startTime} - {event.endTime}
                    </p>
                </div>
                <div className="text-right">
                    <div className="bg-purple-500/20 px-4 py-2 rounded-xl">
                        <p className="text-3xl font-bold text-purple-400">{bookings.length}</p>
                        <p className="text-xs text-purple-300">Bookings</p>
                    </div>
                    <div className="mt-2 text-sm text-neutral-400">
                        {totalGuests} total guests
                    </div>
                    <div className="text-sm text-green-400">
                        {checkedIn} checked in
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        Guestlist
                    </h2>
                </div>

                {bookings.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                        <p className="text-neutral-500">No bookings yet</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-800 bg-neutral-800/30">
                                <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Guest
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Couples
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Ladies
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Stags
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {bookings.map((booking) => {
                                const isExpanded = expandedBookings.has(booking.id);
                                const hasGuests = booking.guests && Array.isArray(booking.guests) && booking.guests.length > 0;
                                return (
                                    <React.Fragment key={booking.id}>
                                        <tr
                                            className={`hover:bg-neutral-800/30 transition-colors ${hasGuests ? 'cursor-pointer' : ''}`}
                                            onClick={() => hasGuests && toggleBooking(booking.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {hasGuests && (
                                                        <span className="text-neutral-400">
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </span>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-white">{booking.user?.name}</p>
                                                        <p className="text-xs text-neutral-500 font-mono">{booking.qrCode.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-neutral-300 text-sm">{booking.user?.phone}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center text-white">{booking.couples}</td>
                                            <td className="px-6 py-4 text-center text-white">{booking.ladies}</td>
                                            <td className="px-6 py-4 text-center text-white">{booking.stags}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'checked-in'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : booking.status === 'cancelled'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-blue-500/20 text-blue-400'
                                                        }`}
                                                >
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {booking.status === 'confirmed' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.id, 'checked-in')}
                                                                className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                                                                title="Check In"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expandable Guest Details Panel */}
                                        {isExpanded && hasGuests && (
                                            <tr className="bg-neutral-800/50">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div className="pl-6 border-l-2 border-purple-500">
                                                        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Guest Names</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                            {booking.guests!.map((guest: { name: string; gender: string }, idx: number) => (
                                                                <div
                                                                    key={idx}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${guest.gender === 'female' ? 'bg-pink-500/10' :
                                                                        guest.gender === 'couple' ? 'bg-purple-500/10' :
                                                                            'bg-blue-500/10'
                                                                        }`}
                                                                >
                                                                    <span className={`text-lg ${guest.gender === 'female' ? '' :
                                                                        guest.gender === 'couple' ? '' : ''
                                                                        }`}>
                                                                        {guest.gender === 'female' ? '👩' : guest.gender === 'couple' ? '👫' : '👨'}
                                                                    </span>
                                                                    <span className={`text-sm font-medium ${guest.gender === 'female' ? 'text-pink-400' :
                                                                        guest.gender === 'couple' ? 'text-purple-400' :
                                                                            'text-blue-400'
                                                                        }`}>
                                                                        {guest.name || `Guest ${idx + 1}`}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
