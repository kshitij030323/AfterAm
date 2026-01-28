import { useState, useEffect } from 'react';
import { Bell, Send, Users, History, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
    getNotificationUsers,
    sendNotification,
    sendNotificationToAll,
    getNotificationHistory,
    getEvents,
    NotificationUser,
    NotificationHistory,
    Event,
} from '../lib/api';
import toast from 'react-hot-toast';

export function Notifications() {
    const [users, setUsers] = useState<NotificationUser[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [history, setHistory] = useState<NotificationHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
    const [showHistory, setShowHistory] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [sendToAll, setSendToAll] = useState(false);

    // Sorting
    const [sortBy, setSortBy] = useState<'guestlistCount' | 'name' | 'createdAt'>('guestlistCount');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, eventsData, historyData] = await Promise.all([
                getNotificationUsers(),
                getEvents(),
                getNotificationHistory({ limit: 20 }),
            ]);
            setUsers(usersData);
            setEvents(eventsData);
            setHistory(historyData.notifications);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            toast.error('Title and body are required');
            return;
        }

        if (!sendToAll && selectedUsers.size === 0) {
            toast.error('Select at least one user or enable "Send to all"');
            return;
        }

        setSending(true);
        try {
            const eventId = selectedEvent || undefined;

            if (sendToAll) {
                const result = await sendNotificationToAll({ title, body, eventId });
                toast.success(`Sent to ${result.success} users (${result.failed} failed)`);
            } else {
                const result = await sendNotification({
                    userIds: Array.from(selectedUsers),
                    title,
                    body,
                    eventId,
                });
                toast.success(`Sent to ${result.success} users (${result.failed} failed)`);
            }

            // Reset form
            setTitle('');
            setBody('');
            setSelectedEvent('');
            setSelectedUsers(new Set());
            setSendToAll(false);

            // Refresh history
            const historyData = await getNotificationHistory({ limit: 20 });
            setHistory(historyData.notifications);
        } catch (err) {
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const selectAll = () => {
        const allWithToken = users.filter((u) => u.hasDeviceToken).map((u) => u.id);
        setSelectedUsers(new Set(allWithToken));
    };

    const selectNone = () => {
        setSelectedUsers(new Set());
    };

    const sortedUsers = [...users].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'guestlistCount':
                comparison = a.guestlistCount - b.guestlistCount;
                break;
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'createdAt':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
        }
        return sortOrder === 'desc' ? -comparison : comparison;
    });

    const toggleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ field }: { field: typeof sortBy }) => {
        if (sortBy !== field) return null;
        return sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Push Notifications</h1>
                    <p className="text-neutral-500">Send notifications to app users</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                            activeTab === 'send'
                                ? 'bg-purple-600 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                    >
                        <Send className="w-5 h-5" />
                        Send
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                            activeTab === 'history'
                                ? 'bg-purple-600 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                    >
                        <History className="w-5 h-5" />
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'send' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Compose Notification */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-purple-400" />
                            Compose Notification
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Notification title..."
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Message</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Notification message..."
                                    rows={4}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Related Event (Optional)
                                </label>
                                <select
                                    value={selectedEvent}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">None</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.title} - {new Date(event.date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="sendToAll"
                                    checked={sendToAll}
                                    onChange={(e) => setSendToAll(e.target.checked)}
                                    className="w-5 h-5 rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-purple-500"
                                />
                                <label htmlFor="sendToAll" className="text-white font-medium">
                                    Send to all users with push enabled
                                </label>
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={sending || (!sendToAll && selectedUsers.size === 0)}
                                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-colors"
                            >
                                {sending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Send Notification
                                        {!sendToAll && selectedUsers.size > 0 && ` (${selectedUsers.size} users)`}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-400" />
                                Select Users ({users.length} total)
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAll}
                                    className="text-sm text-purple-400 hover:text-purple-300"
                                >
                                    Select All
                                </button>
                                <span className="text-neutral-600">|</span>
                                <button
                                    onClick={selectNone}
                                    className="text-sm text-purple-400 hover:text-purple-300"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-neutral-900">
                                    <tr className="border-b border-neutral-800">
                                        <th className="text-left py-3 px-2 text-sm font-medium text-neutral-400">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedUsers.size > 0 &&
                                                    selectedUsers.size === users.filter((u) => u.hasDeviceToken).length
                                                }
                                                onChange={(e) => (e.target.checked ? selectAll() : selectNone())}
                                                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-purple-500"
                                            />
                                        </th>
                                        <th
                                            onClick={() => toggleSort('name')}
                                            className="text-left py-3 px-2 text-sm font-medium text-neutral-400 cursor-pointer hover:text-white"
                                        >
                                            <span className="flex items-center gap-1">
                                                User <SortIcon field="name" />
                                            </span>
                                        </th>
                                        <th
                                            onClick={() => toggleSort('guestlistCount')}
                                            className="text-center py-3 px-2 text-sm font-medium text-neutral-400 cursor-pointer hover:text-white"
                                        >
                                            <span className="flex items-center justify-center gap-1">
                                                Guestlists <SortIcon field="guestlistCount" />
                                            </span>
                                        </th>
                                        <th className="text-center py-3 px-2 text-sm font-medium text-neutral-400">Push</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {sortedUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            onClick={() => user.hasDeviceToken && toggleUser(user.id)}
                                            className={`transition-colors ${
                                                user.hasDeviceToken
                                                    ? 'cursor-pointer hover:bg-neutral-800/50'
                                                    : 'opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <td className="py-3 px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(user.id)}
                                                    disabled={!user.hasDeviceToken}
                                                    onChange={() => toggleUser(user.id)}
                                                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-purple-500 disabled:opacity-50"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <p className="text-white font-medium">{user.name}</p>
                                                <p className="text-sm text-neutral-500">{user.phone}</p>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                                        user.guestlistCount === 0
                                                            ? 'bg-neutral-800 text-neutral-500'
                                                            : user.guestlistCount < 3
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : user.guestlistCount < 5
                                                            ? 'bg-purple-500/20 text-purple-400'
                                                            : 'bg-green-500/20 text-green-400'
                                                    }`}
                                                >
                                                    {user.guestlistCount}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                {user.hasDeviceToken ? (
                                                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-red-400 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 pt-4 border-t border-neutral-800">
                            <p className="text-sm text-neutral-500">
                                <span className="text-green-400 font-medium">
                                    {users.filter((u) => u.hasDeviceToken).length}
                                </span>{' '}
                                users with push notifications enabled
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* History Tab */
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-neutral-800">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-purple-400" />
                            Notification History
                        </h2>
                    </div>

                    {history.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                            <p className="text-neutral-500">No notifications sent yet</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-800">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Notification</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Recipient</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Type</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Sent At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {history.map((notification) => (
                                    <tr key={notification.id} className="hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-white">{notification.title}</p>
                                            <p className="text-sm text-neutral-500 truncate max-w-xs">
                                                {notification.body}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {notification.user ? (
                                                <div>
                                                    <p className="text-white">{notification.user.name}</p>
                                                    <p className="text-sm text-neutral-500">{notification.user.phone}</p>
                                                </div>
                                            ) : (
                                                <span className="text-purple-400">All Users</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    notification.type === 'manual'
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : notification.type === 'abandoned_booking'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                }`}
                                            >
                                                {notification.type === 'manual'
                                                    ? 'Manual'
                                                    : notification.type === 'abandoned_booking'
                                                    ? 'Abandoned'
                                                    : 'System'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {notification.success ? (
                                                <span className="inline-flex items-center gap-1 text-green-400">
                                                    <Check className="w-4 h-4" />
                                                    Sent
                                                </span>
                                            ) : (
                                                <span
                                                    className="inline-flex items-center gap-1 text-red-400"
                                                    title={notification.error || undefined}
                                                >
                                                    <X className="w-4 h-4" />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-400">
                                            {new Date(notification.sentAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
