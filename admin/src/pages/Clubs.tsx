import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, MapPin, Calendar, Key, Copy, Check } from 'lucide-react';
import { getClubs, deleteClub, generateClubCredentials, Club } from '../lib/api';

export function Clubs() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [credentials, setCredentials] = useState<{ id: string; email: string; password: string } | null>(null);
    const [generating, setGenerating] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadClubs();
    }, []);

    const loadClubs = async () => {
        try {
            const data = await getClubs();
            setClubs(data);
        } catch (err) {
            console.error('Failed to load clubs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This will NOT delete associated events.`)) return;
        try {
            await deleteClub(id);
            setClubs(clubs.filter((c) => c.id !== id));
        } catch (err) {
            alert('Failed to delete club');
        }
    };

    const handleGenerateCredentials = async (id: string, name: string) => {
        if (!confirm(`Generate scanner login for "${name}"? Any existing credentials will be replaced.`)) return;
        setGenerating(id);
        try {
            const creds = await generateClubCredentials(id);
            setCredentials({ id, ...creds });
            // Update club in list to show email
            setClubs(clubs.map(c => c.id === id ? { ...c, email: creds.email } : c));
        } catch (err) {
            alert('Failed to generate credentials');
        } finally {
            setGenerating(null);
        }
    };

    const copyCredentials = () => {
        if (!credentials) return;
        navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Clubs</h1>
                    <p className="text-neutral-400 mt-1">Manage venues and their scanner access</p>
                </div>
                <Link
                    to="/clubs/new"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add Club
                </Link>
            </div>

            {/* Credentials Modal */}
            {credentials && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-neutral-900 rounded-2xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-white mb-4">Scanner Credentials Generated</h2>
                        <p className="text-neutral-400 mb-4 text-sm">
                            Save these credentials! The password will not be shown again.
                        </p>
                        <div className="bg-neutral-800 rounded-lg p-4 mb-4 font-mono text-sm">
                            <div className="mb-2">
                                <span className="text-neutral-400">Email: </span>
                                <span className="text-white">{credentials.email}</span>
                            </div>
                            <div>
                                <span className="text-neutral-400">Password: </span>
                                <span className="text-green-400">{credentials.password}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={copyCredentials}
                                className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={() => setCredentials(null)}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {clubs.length === 0 ? (
                <div className="text-center py-16 bg-neutral-900 rounded-xl">
                    <p className="text-neutral-400 mb-4">No clubs yet</p>
                    <Link
                        to="/clubs/new"
                        className="text-purple-400 hover:text-purple-300"
                    >
                        Create your first club
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {clubs.map((club) => (
                        <div
                            key={club.id}
                            className="bg-neutral-900 rounded-xl overflow-hidden"
                        >
                            <div className="flex">
                                <img
                                    src={club.imageUrl}
                                    alt={club.name}
                                    className="w-40 h-36 object-cover"
                                />
                                <div className="flex-1 p-4 flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-1">
                                            {club.name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-neutral-400 text-sm mb-2">
                                            <MapPin size={14} />
                                            {club.location}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 text-purple-400 text-sm">
                                                <Calendar size={14} />
                                                {club._count?.events || 0} events
                                            </div>
                                            {club.email && (
                                                <div className="flex items-center gap-1 text-green-400 text-sm">
                                                    <Key size={14} />
                                                    {club.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleGenerateCredentials(club.id, club.name)}
                                            disabled={generating === club.id}
                                            className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm flex items-center gap-1"
                                        >
                                            <Key size={16} />
                                            {generating === club.id ? 'Generating...' : club.email ? 'Reset' : 'Generate'} Login
                                        </button>
                                        <Link
                                            to={`/clubs/${club.id}/events`}
                                            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm"
                                        >
                                            View Events
                                        </Link>
                                        <Link
                                            to={`/clubs/${club.id}/edit`}
                                            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                                        >
                                            <Pencil size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(club.id, club.name)}
                                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
