import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Upload, Loader2 } from 'lucide-react';
import { getClub, createClub, updateClub, ClubInput } from '../lib/api';

export function ClubForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState<ClubInput>({
        name: '',
        location: '',
        address: '',
        mapUrl: '',
        description: '',
        imageUrl: '',
    });

    useEffect(() => {
        if (isEditing) {
            loadClub();
        }
    }, [id]);

    const loadClub = async () => {
        setLoading(true);
        try {
            const club = await getClub(id!);
            setFormData({
                name: club.name,
                location: club.location,
                address: club.address || '',
                mapUrl: club.mapUrl || '',
                description: club.description || '',
                imageUrl: club.imageUrl,
            });
        } catch (err) {
            alert('Failed to load club');
            navigate('/clubs');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await updateClub(id!, formData);
            } else {
                await createClub(formData);
            }
            navigate('/clubs');
        } catch (err) {
            alert('Failed to save club');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setFormData({ ...formData, imageUrl: data.url });
            alert('Image uploaded!');
        } catch (err) {
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => navigate('/clubs')}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Clubs
            </button>

            <h1 className="text-3xl font-bold text-white mb-8">
                {isEditing ? 'Edit Club' : 'Add New Club'}
            </h1>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Club Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        placeholder="e.g. Mirage"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Location (Short) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        placeholder="e.g. Kalyan Nagar, Bangalore"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                        Short location shown with the club name
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Full Address
                    </label>
                    <textarea
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={2}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                        placeholder="e.g. 30, 4th Floor & Rooftop, CMR Main Road, Kalyan Nagar, Bangalore"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                        Complete address shown in the dropdown
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        <MapPin size={14} className="inline mr-1" />
                        Google Maps Link
                    </label>
                    <input
                        type="url"
                        value={formData.mapUrl}
                        onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        placeholder="https://maps.google.com/..."
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                        Paste the Google Maps share link for directions
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Club Image/Video *
                    </label>

                    {/* File Upload Zone */}
                    <div className="border-2 border-dashed border-neutral-700 rounded-xl p-6 text-center hover:border-purple-500 transition-colors">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="club-file-upload"
                            disabled={uploading}
                        />
                        <label htmlFor="club-file-upload" className="cursor-pointer">
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                    <span className="text-neutral-400">Uploading...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-8 h-8 text-neutral-500" />
                                    <span className="text-neutral-400">Click to upload image or video</span>
                                    <span className="text-xs text-neutral-500">Max size: 50MB</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* URL Input Fallback */}
                    <div className="mt-3">
                        <p className="text-xs text-neutral-500 mb-1">Or paste URL:</p>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                            placeholder="https://..."
                        />
                    </div>

                    {formData.imageUrl && (
                        <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="mt-2 w-full h-40 object-cover rounded-lg"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                        placeholder="Describe the venue..."
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/clubs')}
                        className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : isEditing ? 'Update Club' : 'Create Club'}
                    </button>
                </div>
            </form>
        </div>
    );
}
