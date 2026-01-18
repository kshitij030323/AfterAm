import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Search,
    Music,
    User,
    Ticket,
    Home,
    ChevronLeft,
    Clock,
    Info,
    CheckCircle,
    QrCode,
    LogOut,
    Star,
    Zap,
    Calendar,
    Share2
} from 'lucide-react';

// --- Improved Mock Data with Reliable Images ---

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'techno', label: 'Techno' },
    { id: 'bollywood', label: 'Bollywood' },
    { id: 'hiphop', label: 'Hip-Hop' },
    { id: 'live', label: 'Live' },
];

const EVENTS = [
    {
        id: 1,
        title: 'Techno Bunker',
        club: 'Mirage',
        location: 'Church Street, Bengaluru',
        date: 'Tonight',
        time: '8:00 PM - 1:00 AM',
        image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&q=80&w=800', // Dark Club
        price: 'Free Entry',
        genre: 'Techno',
        description: 'Deep underground techno beats featuring DJ Zaden. The best sound system in the city awaits.',
        rules: 'Couples & Girls entry free till 9:30 PM. Stags cover charge applicable.',
        guestlistAvailable: true,
    },
    {
        id: 2,
        title: 'Desi Beats Night',
        club: 'XU Fashion Bar',
        location: 'Old Airport Road, Bengaluru',
        date: 'Fri, 15 Oct',
        time: '9:00 PM - 1:00 AM',
        image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800', // Concert lights
        price: '₹1000 Cover',
        genre: 'Bollywood',
        description: 'The biggest Bollywood night in town! Dance to the latest chartbusters with DJ Rakesh.',
        rules: 'Dress code: Smart Casuals. No slippers allowed.',
        guestlistAvailable: true,
    },
    {
        id: 3,
        title: 'Skyline Sundowner',
        club: 'High Ultra Lounge',
        location: 'Malleshwaram, Bengaluru',
        date: 'Sun, 17 Oct',
        time: '5:00 PM - 11:00 PM',
        image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800', // Rooftop
        price: 'Guestlist Only',
        genre: 'House',
        description: 'Sunset views from the highest lounge in South India. Sundowner sets by special guest artists.',
        rules: 'Entry restricted to guestlist members only.',
        guestlistAvailable: true,
    },
    {
        id: 4,
        title: 'Hip-Hop Hustle',
        club: 'Raahi',
        location: 'St. Marks Road, Bengaluru',
        date: 'Sat, 16 Oct',
        time: '8:00 PM - 1:00 AM',
        image: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80&w=800', // DJ
        price: '₹500 Entry',
        genre: 'Hip-Hop',
        description: 'Old school vs New school hip hop night. Rap battles and showcase starting at 10 PM.',
        rules: 'Strictly 21+. ID check mandatory.',
        guestlistAvailable: true,
    },
];

// --- Components ---

const Splash = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3000);
        return () => clearTimeout(timer);
    }, []); // Removed dependency to ensure stability

    return (
        <div
            onClick={onComplete}
            className="h-full w-full bg-black flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
        >
            {/* Background Gradient Orbs - Lower Z-Index */}
            <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse z-0"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse z-0"></div>

            <div className="z-10 flex flex-col items-center p-8">
                {/* LOGO AREA - Replace src with your 'final.png' */}
                <div className="w-40 h-40 mb-6 animate-bounce flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-purple-500 blur-[40px] opacity-30 rounded-full"></div>
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/3079/3079165.png"
                        alt="AfterHour Logo"
                        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10"
                    />
                </div>

                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-200 tracking-tighter mb-2">
                    AfterHour
                </h1>
                <p className="text-purple-400 text-sm tracking-[0.3em] uppercase font-semibold">Bengaluru Nightlife</p>
            </div>
            <p className="absolute bottom-10 text-gray-600 text-xs animate-pulse">Tap to start</p>
        </div>
    );
};

const Onboarding = ({ onFinish }) => {
    return (
        <div className="h-full w-full bg-neutral-900 flex flex-col relative">
            <div className="flex-1 relative overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=1000"
                    alt="Club"
                    className="w-full h-full object-cover opacity-60 absolute inset-0 z-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent z-0"></div>

                {/* Content Container with Higher Z-Index */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                    <div className="mb-6">
                        <span className="inline-block px-3 py-1 bg-purple-600/30 border border-purple-500/50 rounded-full text-purple-300 text-xs font-bold mb-4 backdrop-blur-sm">
                            #1 Nightlife App
                        </span>
                        <h2 className="text-4xl font-bold text-white mb-4 leading-[1.1]">
                            Access the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Exclusive</span>
                        </h2>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Skip the queue. Get on the guestlist. Experience Bengaluru's finest clubs like never before.
                        </p>
                    </div>
                    <button
                        onClick={onFinish}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all flex items-center justify-center group"
                    >
                        Get Started
                        <ChevronLeft className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const Auth = ({ onLogin }: { onLogin: (userData: { phone: string; name: string }) => void }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);

    // Format phone for display
    const formatPhoneDisplay = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 5) return digits;
        if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhone(digits);
        setError('');
    };

    const handleSendOTP = async () => {
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Dynamic import to avoid issues if Firebase not configured
            const { auth, RecaptchaVerifier, signInWithPhoneNumber } = await import('./firebase');

            // Setup reCAPTCHA
            if (!(window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {
                        console.log('reCAPTCHA solved');
                    },
                });
            }

            const appVerifier = (window as any).recaptchaVerifier;
            const fullPhone = `+91${phone}`;

            const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
            setConfirmationResult(result);
            setStep('otp');
        } catch (err: any) {
            console.error('OTP Error:', err);
            setError(err.message || 'Failed to send OTP. Please try again.');
            // Reset reCAPTCHA on error
            if ((window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier.clear();
                (window as any).recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await confirmationResult.confirm(otp);

            // Check if user exists in localStorage (returning user)
            const existingUsers = JSON.parse(localStorage.getItem('afterhour_users') || '{}');
            const fullPhone = `+91${phone}`;

            if (existingUsers[fullPhone]) {
                // Returning user - login directly
                const userData = existingUsers[fullPhone];
                localStorage.setItem('afterhour_current_user', JSON.stringify(userData));
                onLogin(userData);
            } else {
                // New user - ask for name
                setStep('name');
            }
        } catch (err: any) {
            console.error('Verify Error:', err);
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNameSubmit = () => {
        if (name.trim().length < 2) {
            setError('Please enter your name');
            return;
        }

        const fullPhone = `+91${phone}`;
        const userData = { phone: fullPhone, name: name.trim() };

        // Save to localStorage
        const existingUsers = JSON.parse(localStorage.getItem('afterhour_users') || '{}');
        existingUsers[fullPhone] = userData;
        localStorage.setItem('afterhour_users', JSON.stringify(existingUsers));
        localStorage.setItem('afterhour_current_user', JSON.stringify(userData));

        onLogin(userData);
    };

    const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(digits);
        setError('');
    };

    return (
        <div className="h-full w-full bg-neutral-900 text-white p-6 flex flex-col justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-900 rounded-full filter blur-[80px] opacity-30 z-0"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-900 rounded-full filter blur-[80px] opacity-30 z-0"></div>

            {/* reCAPTCHA container - required by Firebase */}
            <div id="recaptcha-container"></div>

            {/* Content */}
            <div className="z-10 w-full max-w-sm mx-auto">
                {step === 'phone' ? (
                    <>
                        <div className="mb-10">
                            <h2 className="text-4xl font-bold mb-2">Welcome</h2>
                            <p className="text-gray-400 text-lg">Enter your phone number to continue</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute left-4 top-4 text-gray-400 font-semibold">+91</div>
                                <input
                                    type="tel"
                                    placeholder="98765 43210"
                                    value={formatPhoneDisplay(phone)}
                                    onChange={handlePhoneChange}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-4 pl-14 text-white text-lg tracking-wider focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition-all"
                                    maxLength={11}
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm">{error}</p>
                            )}

                            <button
                                onClick={handleSendOTP}
                                disabled={loading || phone.length !== 10}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl mt-6 shadow-lg shadow-purple-900/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending OTP...' : 'Get OTP'}
                            </button>
                        </div>

                        <p className="mt-8 text-center text-gray-500 text-sm">
                            We'll send a verification code to this number
                        </p>
                    </>
                ) : (
                    <>
                        <div className="mb-10">
                            <button
                                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                                className="text-gray-400 mb-4 flex items-center hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" /> Back
                            </button>
                            <h2 className="text-4xl font-bold mb-2">Verify OTP</h2>
                            <p className="text-gray-400 text-lg">Enter the 6-digit code sent to +91 {formatPhoneDisplay(phone)}</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="• • • • • •"
                                value={otp}
                                onChange={handleOTPChange}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-4 text-white text-2xl tracking-[0.5em] text-center focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition-all"
                                maxLength={6}
                            />

                            {error && (
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            )}

                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl mt-6 shadow-lg shadow-purple-900/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </div>

                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="mt-6 text-center w-full text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                        >
                            Resend OTP
                        </button>
                    </>
                )}

                {step === 'name' && (
                    <>
                        <div className="mb-10">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-6">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-4xl font-bold mb-2 text-center">Almost there!</h2>
                            <p className="text-gray-400 text-lg text-center">What should we call you?</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setError(''); }}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-4 text-white text-lg text-center focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition-all"
                                maxLength={30}
                            />

                            {error && (
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            )}

                            <button
                                onClick={handleNameSubmit}
                                disabled={name.trim().length < 2}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl mt-6 shadow-lg shadow-purple-900/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Let's Party! 🎉
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const EventCard = ({ event, onClick }) => (
    <button
        onClick={() => onClick(event)}
        className="w-full text-left bg-neutral-800/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden mb-6 active:scale-[0.98] transition-all duration-200 group relative"
    >
        <div className="relative h-56 overflow-hidden">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/20 to-transparent"></div>

            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                <span className="text-white font-bold text-xs tracking-wider">{event.date}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 pt-10 bg-gradient-to-t from-black to-transparent">
                <span className="inline-block px-2 py-0.5 bg-purple-500/80 backdrop-blur-md rounded text-[10px] font-bold text-white mb-2 uppercase tracking-wide">
                    {event.genre}
                </span>
                <h3 className="text-2xl font-bold text-white leading-tight mb-1">{event.title}</h3>
                <p className="text-gray-300 text-sm flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-purple-400" /> {event.club}
                </p>
            </div>
        </div>

        <div className="p-4 flex justify-between items-center border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center text-gray-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {event.time}
            </div>
            {event.guestlistAvailable ? (
                <div className="flex items-center text-green-400 text-xs font-bold">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                    Guestlist Open
                </div>
            ) : (
                <span className="text-red-400 text-xs font-bold">Closed</span>
            )}
        </div>
    </button>
);

const EventDetails = ({ event, onBack, onJoin }) => (
    <div className="h-full bg-neutral-900 overflow-y-auto pb-32 animate-in slide-in-from-right duration-300 relative">
        <div className="relative h-96">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-neutral-900"></div>

            {/* Back Button with High Z-Index */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-50 p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-all active:scale-95"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
        </div>

        <div className="px-6 -mt-20 relative z-10">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-white leading-none mb-2 shadow-black drop-shadow-lg">{event.title}</h1>
                <div className="flex items-center text-purple-300 font-semibold text-lg">
                    <MapPin className="w-5 h-5 mr-1" /> {event.club}
                </div>
            </div>

            <div className="space-y-6">
                {/* Info Grid */}
                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-neutral-800/60 backdrop-blur rounded-2xl p-3 border border-white/5 text-center">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Date</p>
                        <p className="text-white font-bold text-sm">{event.date}</p>
                    </div>
                    <div className="bg-neutral-800/60 backdrop-blur rounded-2xl p-3 border border-white/5 text-center">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Time</p>
                        <p className="text-white font-bold text-sm">{event.time.split('-')[0].trim()}</p>
                    </div>
                    <div className="bg-neutral-800/60 backdrop-blur rounded-2xl p-3 border border-white/5 text-center">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Entry</p>
                        <p className="text-white font-bold text-sm">{event.price}</p>
                    </div>
                    <div className="bg-neutral-800/60 backdrop-blur rounded-2xl p-3 border border-white/5 text-center flex flex-col items-center justify-center">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Rating</p>
                        <div className="flex items-center text-yellow-400 font-bold text-sm">
                            4.8 <Star className="w-3 h-3 ml-1 fill-yellow-400" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-white font-bold text-lg mb-2">The Vibe</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
                </div>

                <div>
                    <h3 className="text-white font-bold text-lg mb-2">Club Rules</h3>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex gap-3">
                        <Info className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        <p className="text-purple-200 text-sm leading-snug">
                            {event.rules}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Action - CHANGED TO ABSOLUTE TO STAY WITHIN PHONE CONTAINER */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-neutral-900 via-neutral-900 to-transparent z-40">
            <button
                onClick={() => onJoin(event)}
                className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center"
            >
                <Ticket className="w-5 h-5 mr-2" />
                Join Guestlist
            </button>
        </div>
    </div>
);

const GuestlistForm = ({ event, onConfirm, onBack }) => {
    const [couples, setCouples] = useState(0);
    const [ladies, setLadies] = useState(0);
    const [stags, setStags] = useState(0);

    const total = couples * 2 + ladies + stags;

    return (
        <div className="h-full bg-neutral-900 flex flex-col animate-in slide-in-from-bottom duration-300 relative">
            <div className="p-4 pt-6 border-b border-white/5 flex items-center bg-neutral-900 z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="ml-2 text-xl font-bold text-white">Select Guests</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-32">
                <div className="bg-neutral-800 rounded-2xl p-4 mb-8 flex items-center border border-white/5 shadow-lg">
                    <img src={event.image} alt="mini" className="w-16 h-16 rounded-xl object-cover mr-4" />
                    <div>
                        <h3 className="text-white font-bold text-lg">{event.title}</h3>
                        <p className="text-purple-400 text-sm">{event.date} • {event.club}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Counter Component */}
                    {[
                        { label: 'Couples', sub: 'Free entry till 9:30 PM', val: couples, set: setCouples, icon: '👫' },
                        { label: 'Ladies', sub: 'Free entry all night', val: ladies, set: setLadies, icon: '💃' },
                        { label: 'Stags (Male)', sub: 'Cover charge applies', val: stags, set: setStags, icon: '🕺' }
                    ].map((type) => (
                        <div key={type.label} className="flex justify-between items-center bg-neutral-800/50 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">{type.icon}</span>
                                <div>
                                    <p className="text-white font-bold">{type.label}</p>
                                    <p className="text-xs text-gray-500">{type.sub}</p>
                                </div>
                            </div>
                            <div className="flex items-center bg-neutral-900 rounded-xl p-1 border border-white/10">
                                <button
                                    onClick={() => type.set(Math.max(0, type.val - 1))}
                                    className="w-10 h-10 rounded-lg text-gray-400 hover:text-white flex items-center justify-center text-xl font-bold transition-colors"
                                >
                                    -
                                </button>
                                <span className="text-white font-mono font-bold w-8 text-center text-lg">{type.val}</span>
                                <button
                                    onClick={() => type.set(type.val + 1)}
                                    className="w-10 h-10 rounded-lg bg-neutral-800 text-purple-400 flex items-center justify-center text-xl font-bold shadow-sm"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {total > 0 && (
                    <div className="mt-8 bg-purple-900/10 border border-purple-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                        <h4 className="text-purple-300 font-bold mb-2 flex items-center text-sm"><Info className="w-4 h-4 mr-2" /> Essential Info</h4>
                        <ul className="text-purple-200/60 text-xs list-disc list-inside space-y-1 ml-1">
                            <li>Government ID is mandatory for entry.</li>
                            <li>Club rules apply (Shoes mandatory for men).</li>
                            <li>Rights of admission reserved.</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* CHANGED TO ABSOLUTE TO STAY WITHIN PHONE CONTAINER */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-neutral-900 border-t border-white/5">
                <button
                    disabled={total === 0}
                    onClick={() => onConfirm({ couples, ladies, stags, event })}
                    className={`w-full font-bold text-lg py-4 rounded-2xl transition-all shadow-lg flex justify-between px-6 items-center ${total > 0
                        ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/20 active:scale-95'
                        : 'bg-neutral-800 text-gray-600 cursor-not-allowed'
                        }`}
                >
                    <span>Confirm Booking</span>
                    {total > 0 && <span className="bg-white/20 px-2 py-1 rounded text-sm">{total} Guests</span>}
                </button>
            </div>
        </div>
    );
};

const Confirmation = ({ booking, onHome }) => (
    <div className="h-full bg-neutral-900 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 relative overflow-y-auto">
        {/* Confetti-like background elements */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-green-500 rounded-full animate-ping delay-300"></div>

        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] z-10 flex-shrink-0">
            <CheckCircle className="w-12 h-12 text-white stroke-[3px]" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 z-10">You're on the list!</h2>
        <p className="text-gray-400 mb-8 z-10 max-w-[200px]">Screenshot this ticket or find it in 'My Bookings'.</p>

        <div className="bg-white p-6 rounded-3xl w-full max-w-xs shadow-2xl relative z-10 transform transition-transform hover:scale-105 duration-300 mb-8 flex-shrink-0">
            {/* Cutout effect */}
            <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 w-8 h-8 bg-neutral-900 rounded-full"></div>
            <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-8 h-8 bg-neutral-900 rounded-full"></div>

            <div className="border-b-2 border-dashed border-gray-200 pb-6 mb-6">
                <h3 className="text-2xl font-black text-black leading-tight">{booking.event.title}</h3>
                <p className="text-purple-600 font-bold text-sm uppercase tracking-wider mt-1">{booking.event.club}</p>
                <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500 font-medium">
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {booking.event.time.split('-')[0]}</span>
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {booking.event.date}</span>
                </div>
            </div>

            <div className="flex justify-center mb-6">
                <QrCode className="w-40 h-40 text-neutral-900" />
            </div>

            <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center">
                <div className="text-left">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Total Guests</p>
                    <p className="text-xl font-black text-neutral-800">{booking.couples * 2 + booking.ladies + booking.stags}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Booking ID</p>
                    <p className="text-sm font-mono font-bold text-neutral-800">#AF-{Math.floor(Math.random() * 9000) + 1000}</p>
                </div>
            </div>
        </div>

        <div className="flex flex-col w-full max-w-xs gap-3 z-10 pb-8">
            <button
                onClick={onHome}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-900/20 transition-all"
            >
                Back to Home
            </button>
            <button
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3.5 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
            >
                <Share2 className="w-4 h-4" /> Share Ticket
            </button>
        </div>
    </div>
);

const MyBookings = ({ bookings, onHome, onViewTicket }) => (
    <div className="h-full bg-neutral-900 p-6 pb-24 overflow-y-auto">
        <h2 className="text-3xl font-bold text-white mb-8">My Tickets</h2>
        {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-600">
                <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <Ticket className="w-10 h-10 opacity-50" />
                </div>
                <p className="text-lg font-medium mb-4">No upcoming plans</p>
                <button
                    onClick={onHome}
                    className="bg-purple-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-purple-900/20"
                >
                    Find an Event
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                {bookings.map((b, idx) => (
                    <div
                        key={idx}
                        onClick={() => onViewTicket(b)}
                        className="bg-neutral-800 rounded-2xl p-4 flex gap-4 border border-white/5 relative overflow-hidden group cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="absolute top-0 right-0 p-2 bg-green-500/20 rounded-bl-xl">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                            <QrCode className="w-16 h-16 text-black" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-white font-bold text-lg leading-tight mb-1">{b.event.title}</h3>
                            <p className="text-purple-400 text-sm font-medium mb-2">{b.event.club}</p>
                            <div className="flex gap-2 text-[10px] text-gray-400 bg-neutral-900/50 p-2 rounded-lg self-start">
                                {b.couples > 0 && <span>{b.couples} Couples</span>}
                                {b.ladies > 0 && <span>{b.ladies} Ladies</span>}
                                {b.stags > 0 && <span>{b.stags} Stags</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const Profile = ({ onLogout, user }: { onLogout: () => void; user: { name: string; phone: string } }) => {
    // Format phone for display
    const formatPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 12) {
            return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
        }
        return phone;
    };

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="h-full bg-neutral-900 p-6 pb-24 flex flex-col overflow-y-auto">
            <div className="flex items-center mb-8 bg-neutral-800/50 p-4 rounded-3xl border border-white/5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                        <span className="text-2xl font-bold text-white">{getInitials(user.name)}</span>
                    </div>
                </div>
                <div className="ml-4">
                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                    <p className="text-gray-400 text-sm">{formatPhone(user.phone)}</p>
                    <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded border border-yellow-500/20">Gold Member</span>
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded border border-purple-500/20">Bengaluru</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 flex-1">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-2 mb-2">Account</h3>
                {['Edit Profile', 'Notification Settings', 'Payment Methods'].map((item) => (
                    <button key={item} className="w-full text-left p-4 bg-neutral-800/30 rounded-2xl text-gray-200 hover:bg-neutral-800 flex justify-between items-center transition-colors border border-white/5 group">
                        {item}
                        <ChevronLeft className="w-4 h-4 rotate-180 text-gray-600 group-hover:text-white transition-colors" />
                    </button>
                ))}

                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-2 mb-2 mt-6">Support</h3>
                {['Help & Support', 'Terms of Service', 'Privacy Policy'].map((item) => (
                    <button key={item} className="w-full text-left p-4 bg-neutral-800/30 rounded-2xl text-gray-200 hover:bg-neutral-800 flex justify-between items-center transition-colors border border-white/5 group">
                        {item}
                        <ChevronLeft className="w-4 h-4 rotate-180 text-gray-600 group-hover:text-white transition-colors" />
                    </button>
                ))}
            </div>

            <button onClick={onLogout} className="w-full p-4 text-red-400 bg-red-500/10 rounded-2xl flex items-center justify-center mt-6 font-bold border border-red-500/10 hover:bg-red-500/20 transition-colors">
                <LogOut className="w-5 h-5 mr-2" /> Log Out
            </button>
        </div>
    );
};

const Navbar = ({ currentView, setView }) => {
    if (['splash', 'onboarding', 'auth', 'details', 'guestlist', 'confirmation'].includes(currentView)) return null;

    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'my-bookings', icon: Ticket, label: 'Bookings' },
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="absolute bottom-6 left-6 right-6 h-16 bg-neutral-800/90 backdrop-blur-xl border border-white/10 rounded-full z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-around px-2">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${currentView === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <item.icon className="w-5 h-5" />
                </button>
            ))}
        </div>
    );
};

// --- Main App ---

export default function App() {
    const [view, setView] = useState('splash');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [user, setUser] = useState<{ name: string; phone: string } | null>(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('afterhour_current_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Filter events logic
    const filteredEvents = selectedCategory === 'all'
        ? EVENTS
        : EVENTS.filter(e => e.genre.toLowerCase() === selectedCategory.toLowerCase());

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setView('details');
    };

    const handleJoinGuestlist = (event) => {
        setView('guestlist');
    };

    const handleBookingConfirm = (details) => {
        const newBooking = details;
        setCurrentBooking(newBooking);
        setBookings([newBooking, ...bookings]);
        setView('confirmation');
    };

    const renderContent = () => {
        switch (view) {
            case 'splash':
                return <Splash onComplete={() => setView('onboarding')} />;
            case 'onboarding':
                return <Onboarding onFinish={() => setView('auth')} />;
            case 'auth':
                return <Auth onLogin={(userData) => { setUser(userData); setView('home'); }} />;
            case 'home':
                return (
                    <div className="h-full overflow-y-auto bg-neutral-900 pb-28">
                        {/* Header */}
                        <div className="p-6 pt-10 sticky top-0 bg-neutral-900/90 backdrop-blur-md z-40 border-b border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Location</p>
                                    <div className="flex items-center text-white font-bold text-xl cursor-pointer hover:text-purple-400 transition-colors">
                                        <MapPin className="w-5 h-5 text-purple-500 mr-2" />
                                        Bengaluru
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[1px] cursor-pointer" onClick={() => setView('profile')}>
                                    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'G'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search clubs, DJs, or genres..."
                                    className="w-full bg-neutral-800 text-white pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-700 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                                />
                            </div>

                            {/* Categories */}
                            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 scale-105'
                                            : 'bg-neutral-800 text-gray-400 border border-neutral-700 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Events Feed */}
                        <div className="px-6 mt-4">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-white font-bold text-xl">Trending Tonight</h2>
                            </div>
                            {filteredEvents.map(event => (
                                <EventCard key={event.id} event={event} onClick={handleEventClick} />
                            ))}

                            {/* Spacer for Floating Nav */}
                            <div className="h-10"></div>
                        </div>
                    </div>
                );
            case 'details':
                return <EventDetails event={selectedEvent} onBack={() => setView('home')} onJoin={handleJoinGuestlist} />;
            case 'guestlist':
                return <GuestlistForm event={selectedEvent} onBack={() => setView('details')} onConfirm={handleBookingConfirm} />;
            case 'confirmation':
                return <Confirmation booking={currentBooking} onHome={() => setView('home')} />;
            case 'my-bookings':
                return <MyBookings
                    bookings={bookings}
                    onHome={() => setView('home')}
                    onViewTicket={(booking) => {
                        setCurrentBooking(booking);
                        setView('confirmation');
                    }}
                />;
            case 'profile':
                return <Profile
                    user={user || { name: 'Guest', phone: '' }}
                    onLogout={() => {
                        localStorage.removeItem('afterhour_current_user');
                        setUser(null);
                        setView('auth');
                    }}
                />;
            default:
                return <div>Error</div>;
        }
    };

    return (
        <div className="font-sans antialiased bg-black w-[393px] h-[852px] mx-auto overflow-hidden shadow-2xl relative rounded-[55px] border-[3px] border-neutral-700">
            {renderContent()}
            <Navbar currentView={view} setView={setView} />

            {/* Global CSS for utilities */}
            <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}