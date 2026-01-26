import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Upload } from 'lucide-react';
import { getEvent, createEvent, updateEvent, EventInput } from '../lib/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const GENRES = ['Techno', 'Bollywood', 'House', 'Hip-Hop', 'EDM', 'Live', 'Commercial'];

export function EventForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<EventInput>({
        title: '',
        club: '',
        location: '',
        description: '',
        rules: '',
        genre: 'Techno',
        imageUrl: '',
        videoUrl: '',
        gallery: [],
        price: 0,
        priceLabel: 'Free Entry',
        stagPrice: 0,
        couplePrice: 0,
        ladiesPrice: 0,
        date: new Date().toISOString().split('T')[0],
        startTime: '20:00',
        endTime: '01:00',
        guestlistStatus: 'open',
        guestlistLimit: null,
        closingThreshold: null,
        guestlistCloseTime: null,
        guestlistCloseOnStart: true,
        featured: false,
    });

    useEffect(() => {
        if (id) {
            getEvent(id)
                .then((event) => {
                    setForm({
                        title: event.title,
                        club: event.club,
                        location: event.location,
                        description: event.description,
                        rules: event.rules || '',
                        genre: event.genre,
                        imageUrl: event.imageUrl,
                        videoUrl: event.videoUrl || '',
                        gallery: event.gallery || [],
                        price: event.price,
                        priceLabel: event.priceLabel,
                        stagPrice: event.stagPrice ?? 0,
                        couplePrice: event.couplePrice ?? 0,
                        ladiesPrice: event.ladiesPrice ?? 0,
                        date: event.date.split('T')[0],
                        startTime: event.startTime,
                        endTime: event.endTime,
                        guestlistStatus: event.guestlistStatus || 'open',
                        guestlistLimit: event.guestlistLimit || null,
                        closingThreshold: event.closingThreshold || null,
                        guestlistCloseTime: event.guestlistCloseTime || null,
                        guestlistCloseOnStart: event.guestlistCloseOnStart ?? true,
                        featured: event.featured,
                    });
                })
                .catch(() => toast.error('Event not found'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const [uploading, setUploading] = useState<'banner' | 'video' | 'gallery' | null>(null);

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Only allow images for banner
        if (!file.type.startsWith('image/')) {
            toast.error('Banner must be an image');
            return;
        }

        setUploading('banner');
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            updateField('imageUrl', data.url);
            toast.success('Banner uploaded!');
        } catch (err) {
            toast.error('Failed to upload banner');
        } finally {
            setUploading(null);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Only allow videos
        if (!file.type.startsWith('video/')) {
            toast.error('Please upload a video file');
            return;
        }

        setUploading('video');
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            updateField('videoUrl', data.url);
            toast.success('Video uploaded!');
        } catch (err) {
            toast.error('Failed to upload video');
        } finally {
            setUploading(null);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading('gallery');
        try {
            const uploadedUrls: string[] = [];

            for (const file of Array.from(files)) {
                if (!file.type.startsWith('image/')) continue;

                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`${API_BASE}/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    uploadedUrls.push(data.url);
                }
            }

            updateField('gallery', [...(form.gallery || []), ...uploadedUrls]);
            toast.success(`${uploadedUrls.length} images added to gallery!`);
        } catch (err) {
            toast.error('Failed to upload gallery images');
        } finally {
            setUploading(null);
        }
    };

    const removeGalleryImage = (index: number) => {
        const newGallery = [...(form.gallery || [])];
        newGallery.splice(index, 1);
        updateField('gallery', newGallery);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isEdit && id) {
                await updateEvent(id, form);
                toast.success('Event updated!');
            } else {
                await createEvent(form);
                toast.success('Event created!');
            }
            navigate('/events');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save event');
        } finally {
            setSaving(false);
        }
    };

    const updateField = <K extends keyof EventInput>(key: K, value: EventInput[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Back
            </button>

            <h1 className="text-2xl font-bold text-white mb-8">
                {isEdit ? 'Edit Event' : 'Create New Event'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                    <h2 className="font-semibold text-white mb-4">Basic Information</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Event Title *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g. Techno Bunker"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Club/Venue *</label>
                            <input
                                type="text"
                                value={form.club}
                                onChange={(e) => updateField('club', e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g. Mirage"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Location *</label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. Church Street, Bengaluru"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Genre *</label>
                        <select
                            value={form.genre}
                            onChange={(e) => updateField('genre', e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {GENRES.map((g) => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Description *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            rows={3}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Describe the event..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Club Rules</label>
                        <textarea
                            value={form.rules}
                            onChange={(e) => updateField('rules', e.target.value)}
                            rows={2}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Entry rules, dress code, etc."
                        />
                    </div>
                </div>

                {/* Date & Time */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                    <h2 className="font-semibold text-white mb-4">Date & Time</h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Date *</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => updateField('date', e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Start Time *</label>
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => updateField('startTime', e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">End Time *</label>
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => updateField('endTime', e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Image */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                    <h2 className="font-semibold text-white mb-4">Pricing & Media</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Price (₹)</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => updateField('price', Number(e.target.value))}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Price Label</label>
                            <input
                                type="text"
                                value={form.priceLabel}
                                onChange={(e) => updateField('priceLabel', e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g. Free Entry, ₹500 Cover"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Stag Entry (₹)</label>
                            <input
                                type="number"
                                value={form.stagPrice}
                                onChange={(e) => updateField('stagPrice', Number(e.target.value))}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min="0"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Couple Entry (₹)</label>
                            <input
                                type="number"
                                value={form.couplePrice}
                                onChange={(e) => updateField('couplePrice', Number(e.target.value))}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min="0"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Ladies Entry (₹)</label>
                            <input
                                type="number"
                                value={form.ladiesPrice}
                                onChange={(e) => updateField('ladiesPrice', Number(e.target.value))}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min="0"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Set to 0 for free entry. These prices are shown to users when booking tickets.</p>

                    {/* Banner Image (for cards) */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Banner Image * (shown on cards)</label>
                        <div className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center hover:border-purple-500 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBannerUpload}
                                className="hidden"
                                id="banner-upload"
                                disabled={uploading !== null}
                            />
                            <label htmlFor="banner-upload" className="cursor-pointer">
                                {uploading === 'banner' ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                        <span className="text-neutral-400 text-sm">Uploading banner...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-6 h-6 text-neutral-500" />
                                        <span className="text-neutral-400 text-sm">Upload banner image (no video)</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        {form.imageUrl && (
                            <img src={form.imageUrl} alt="Banner" className="mt-2 w-32 h-20 object-cover rounded-lg border border-neutral-700" />
                        )}
                    </div>

                    {/* Hero Video */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Hero Video (plays in event detail)</label>
                        <div className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center hover:border-green-500 transition-colors">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                                id="video-upload"
                                disabled={uploading !== null}
                            />
                            <label htmlFor="video-upload" className="cursor-pointer">
                                {uploading === 'video' ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                                        <span className="text-neutral-400 text-sm">Uploading video...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-6 h-6 text-neutral-500" />
                                        <span className="text-neutral-400 text-sm">Upload hero video (optional)</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        {form.videoUrl && (
                            <video src={form.videoUrl} className="mt-2 w-40 h-24 object-cover rounded-lg border border-neutral-700" controls />
                        )}
                    </div>

                    {/* Gallery Images */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Gallery Photos (shown in gallery modal)</label>
                        <div className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryUpload}
                                className="hidden"
                                id="gallery-upload"
                                disabled={uploading !== null}
                            />
                            <label htmlFor="gallery-upload" className="cursor-pointer">
                                {uploading === 'gallery' ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                        <span className="text-neutral-400 text-sm">Uploading gallery images...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-6 h-6 text-neutral-500" />
                                        <span className="text-neutral-400 text-sm">Upload gallery photos (multiple allowed)</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        {form.gallery && form.gallery.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {form.gallery.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img src={url} alt={`Gallery ${index + 1}`} className="w-20 h-20 object-cover rounded-lg border border-neutral-700" />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryImage(index)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Options */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                    <h2 className="font-semibold text-white mb-4">Guestlist Status</h2>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-neutral-700 hover:border-green-500 transition-colors">
                            <input
                                type="radio"
                                name="guestlistStatus"
                                value="open"
                                checked={form.guestlistStatus === 'open'}
                                onChange={() => updateField('guestlistStatus', 'open')}
                                className="w-5 h-5 accent-green-500"
                            />
                            <span className="flex-1 text-white">Guestlist Open</span>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">Open</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-neutral-700 hover:border-yellow-500 transition-colors">
                            <input
                                type="radio"
                                name="guestlistStatus"
                                value="closing"
                                checked={form.guestlistStatus === 'closing'}
                                onChange={() => updateField('guestlistStatus', 'closing')}
                                className="w-5 h-5 accent-yellow-500"
                            />
                            <span className="flex-1 text-white">Guestlist Closing Soon</span>
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">Closing Soon</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-neutral-700 hover:border-red-500 transition-colors">
                            <input
                                type="radio"
                                name="guestlistStatus"
                                value="closed"
                                checked={form.guestlistStatus === 'closed'}
                                onChange={() => updateField('guestlistStatus', 'closed')}
                                className="w-5 h-5 accent-red-500"
                            />
                            <span className="flex-1 text-white">Guestlist Closed</span>
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">Closed</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-700">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Guestlist Limit</label>
                            <input
                                type="number"
                                value={form.guestlistLimit ?? ''}
                                onChange={(e) => updateField('guestlistLimit', e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Unlimited"
                                min="1"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Max people allowed (leave empty for unlimited)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Closing Threshold</label>
                            <input
                                type="number"
                                value={form.closingThreshold ?? ''}
                                onChange={(e) => updateField('closingThreshold', e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="e.g. 10"
                                min="1"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Auto switch to "Closing Soon" when spots left ≤ this</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Close Guestlist At</label>
                            <input
                                type="time"
                                value={form.guestlistCloseTime ?? ''}
                                onChange={(e) => updateField('guestlistCloseTime', e.target.value || null)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Specific time to close guestlist (e.g. 7:00 PM)</p>
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.guestlistCloseOnStart ?? true}
                                    onChange={(e) => updateField('guestlistCloseOnStart', e.target.checked)}
                                    className="w-5 h-5 bg-neutral-800 border-neutral-700 rounded text-red-600 focus:ring-red-500"
                                />
                                <div>
                                    <span className="text-white">Close on Event Start</span>
                                    <p className="text-xs text-neutral-500">Auto-close when event begins</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <p className="text-sm text-neutral-500 mt-4">
                        When closed, users cannot make new bookings for this event.
                    </p>
                </div>

                {/* Featured */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                    <h2 className="font-semibold text-white mb-4">Other Options</h2>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.featured}
                            onChange={(e) => updateField('featured', e.target.checked)}
                            className="w-5 h-5 bg-neutral-800 border-neutral-700 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-white">Featured Event</span>
                    </label>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 border border-neutral-700 text-neutral-400 rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            isEdit ? 'Update Event' : 'Create Event'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
