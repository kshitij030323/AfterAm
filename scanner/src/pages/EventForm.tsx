import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Upload, X } from 'lucide-react';
import { useAuth, useApi } from '../App';

const GENRES = ['Techno', 'Bollywood', 'House', 'Hip-Hop', 'EDM', 'Live', 'Commercial'];

interface EventForm {
    title: string;
    location: string;
    description: string;
    rules: string;
    genre: string;
    imageUrl: string;
    videoUrl: string;
    gallery: string[];
    price: number;
    priceLabel: string;
    date: string;
    startTime: string;
    endTime: string;
    guestlistStatus: 'open' | 'closing' | 'closed';
    guestlistLimit: number | null;
    closingThreshold: number | null;
    featured: boolean;
}

export function EventForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { club } = useAuth();
    const { fetchApi } = useApi();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<'banner' | 'video' | 'gallery' | null>(null);
    const [form, setForm] = useState<EventForm>({
        title: '',
        location: club?.location || '',
        description: '',
        rules: '',
        genre: 'Techno',
        imageUrl: '',
        videoUrl: '',
        gallery: [],
        price: 0,
        priceLabel: 'Free Entry',
        date: new Date().toISOString().split('T')[0],
        startTime: '20:00',
        endTime: '01:00',
        guestlistStatus: 'open',
        guestlistLimit: null,
        closingThreshold: null,
        featured: false,
    });

    useEffect(() => {
        if (id) {
            fetchApi(`/scanner/events`)
                .then((events: any[]) => {
                    const event = events.find((e: any) => e.id === id);
                    if (event) {
                        setForm({
                            title: event.title,
                            location: event.location,
                            description: event.description,
                            rules: event.rules || '',
                            genre: event.genre,
                            imageUrl: event.imageUrl,
                            videoUrl: event.videoUrl || '',
                            gallery: event.gallery || [],
                            price: event.price,
                            priceLabel: event.priceLabel,
                            date: event.date.split('T')[0],
                            startTime: event.startTime,
                            endTime: event.endTime,
                            guestlistStatus: event.guestlistStatus || 'open',
                            guestlistLimit: event.guestlistLimit || null,
                            closingThreshold: event.closingThreshold || null,
                            featured: event.featured,
                        });
                    }
                })
                .catch(() => alert('Event not found'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const updateField = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Banner must be an image');
            return;
        }

        setUploading('banner');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            updateField('imageUrl', data.url);
        } catch (err) {
            alert('Failed to upload banner');
        } finally {
            setUploading(null);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('video/')) {
            alert('Please upload a video file');
            return;
        }

        setUploading('video');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            updateField('videoUrl', data.url);
        } catch (err) {
            alert('Failed to upload video');
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
                const response = await fetch('http://localhost:3001/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (response.ok) {
                    const data = await response.json();
                    uploadedUrls.push(data.url);
                }
            }
            updateField('gallery', [...form.gallery, ...uploadedUrls]);
        } catch (err) {
            alert('Failed to upload gallery images');
        } finally {
            setUploading(null);
        }
    };

    const removeGalleryImage = (index: number) => {
        const newGallery = [...form.gallery];
        newGallery.splice(index, 1);
        updateField('gallery', newGallery);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.imageUrl) {
            alert('Please upload a banner image');
            return;
        }

        setSaving(true);
        try {
            if (isEdit && id) {
                await fetchApi(`/scanner/events/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(form),
                });
            } else {
                await fetchApi('/scanner/events', {
                    method: 'POST',
                    body: JSON.stringify(form),
                });
            }
            navigate('/');
        } catch (err) {
            alert('Failed to save event');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="event-form-page">
            <div className="form-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ChevronLeft size={20} />
                </button>
                <h1>{isEdit ? 'Edit Event' : 'Create Event'}</h1>
                <span className="club-badge">{club?.name}</span>
            </div>

            <form onSubmit={handleSubmit} className="event-form">
                {/* Basic Info */}
                <section className="form-section">
                    <h2>Basic Information</h2>

                    <div className="form-group">
                        <label>Event Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="e.g. Friday Night Fever"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => updateField('date', e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Start Time *</label>
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => updateField('startTime', e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>End Time *</label>
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => updateField('endTime', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Genre *</label>
                        <select
                            value={form.genre}
                            onChange={(e) => updateField('genre', e.target.value)}
                        >
                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            placeholder="e.g. Church Street, Bengaluru"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Tell people what to expect..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Club Rules</label>
                        <textarea
                            value={form.rules}
                            onChange={(e) => updateField('rules', e.target.value)}
                            placeholder="e.g. Dress code, age restrictions..."
                            rows={3}
                        />
                    </div>
                </section>

                {/* Pricing */}
                <section className="form-section">
                    <h2>Pricing</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Price (₹)</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => updateField('price', Number(e.target.value))}
                                min={0}
                            />
                        </div>
                        <div className="form-group">
                            <label>Price Label</label>
                            <input
                                type="text"
                                value={form.priceLabel}
                                onChange={(e) => updateField('priceLabel', e.target.value)}
                                placeholder="e.g. Free Entry, ₹500 Cover"
                            />
                        </div>
                    </div>
                </section>

                {/* Media */}
                <section className="form-section">
                    <h2>Media</h2>

                    {/* Banner */}
                    <div className="form-group">
                        <label>Banner Image * (shown on cards)</label>
                        <div className="upload-zone">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBannerUpload}
                                id="banner-upload"
                                disabled={uploading !== null}
                            />
                            <label htmlFor="banner-upload" className="upload-label">
                                {uploading === 'banner' ? (
                                    <><Loader2 className="spin" size={20} /> Uploading...</>
                                ) : (
                                    <><Upload size={20} /> Upload Banner Image</>
                                )}
                            </label>
                        </div>
                        {form.imageUrl && (
                            <img src={form.imageUrl} alt="Banner" className="preview-image" />
                        )}
                    </div>

                    {/* Video */}
                    <div className="form-group">
                        <label>Hero Video (plays in event detail)</label>
                        <div className="upload-zone video">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                id="video-upload"
                                disabled={uploading !== null}
                            />
                            <label htmlFor="video-upload" className="upload-label">
                                {uploading === 'video' ? (
                                    <><Loader2 className="spin" size={20} /> Uploading...</>
                                ) : (
                                    <><Upload size={20} /> Upload Hero Video</>
                                )}
                            </label>
                        </div>
                        {form.videoUrl && (
                            <video src={form.videoUrl} className="preview-video" controls />
                        )}
                    </div>

                    {/* Gallery */}
                    <div className="form-group">
                        <label>Gallery Photos</label>
                        <div className="upload-zone gallery">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryUpload}
                                id="gallery-upload"
                                disabled={uploading !== null}
                            />
                            <label htmlFor="gallery-upload" className="upload-label">
                                {uploading === 'gallery' ? (
                                    <><Loader2 className="spin" size={20} /> Uploading...</>
                                ) : (
                                    <><Upload size={20} /> Upload Gallery Photos</>
                                )}
                            </label>
                        </div>
                        {form.gallery.length > 0 && (
                            <div className="gallery-grid">
                                {form.gallery.map((url, i) => (
                                    <div key={i} className="gallery-item">
                                        <img src={url} alt={`Gallery ${i + 1}`} />
                                        <button type="button" onClick={() => removeGalleryImage(i)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Guestlist */}
                <section className="form-section">
                    <h2>Guestlist Settings</h2>

                    <div className="form-group">
                        <label>Status</label>
                        <div className="status-options">
                            {(['open', 'closing', 'closed'] as const).map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    className={`status-btn ${form.guestlistStatus === status ? 'active' : ''} ${status}`}
                                    onClick={() => updateField('guestlistStatus', status)}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Capacity Limit</label>
                            <input
                                type="number"
                                value={form.guestlistLimit || ''}
                                onChange={(e) => updateField('guestlistLimit', e.target.value ? Number(e.target.value) : null)}
                                placeholder="Leave empty for unlimited"
                                min={1}
                            />
                        </div>
                        <div className="form-group">
                            <label>Closing Threshold</label>
                            <input
                                type="number"
                                value={form.closingThreshold || ''}
                                onChange={(e) => updateField('closingThreshold', e.target.value ? Number(e.target.value) : null)}
                                placeholder="Spots remaining to show 'closing'"
                                min={1}
                            />
                        </div>
                    </div>
                </section>

                {/* Submit */}
                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate('/')}>
                        Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={saving}>
                        {saving ? <><Loader2 className="spin" size={18} /> Saving...</> : (isEdit ? 'Update Event' : 'Create Event')}
                    </button>
                </div>
            </form>
        </div>
    );
}
