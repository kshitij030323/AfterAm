import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, Camera, RefreshCw } from 'lucide-react';
import { useApi } from '../App';

interface ScanResult {
    valid: boolean;
    message?: string;
    error?: string;
    scannedAt?: string;
    booking?: {
        id: string;
        user: { name: string; phone: string };
        couples: number;
        ladies: number;
        stags: number;
        totalGuests: number;
        event: { title: string };
    };
}

export function Scan() {
    const { fetchApi } = useApi();
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const startScanner = async () => {
        setResult(null);
        setScanning(true);

        try {
            const html5QrCode = new Html5Qrcode('qr-reader');
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    // Stop scanner on successful read
                    await html5QrCode.stop();
                    setScanning(false);

                    // Process the QR code
                    await processQR(decodedText);
                },
                () => { } // Ignore scan failures
            );
        } catch (err) {
            console.error('Scanner error:', err);
            setScanning(false);
            setResult({
                valid: false,
                error: 'Failed to start camera. Please allow camera access.'
            });
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.error('Stop error:', err);
            }
        }
        setScanning(false);
    };

    const processQR = async (qrData: string) => {
        try {
            const data = await fetchApi('/scanner/scan', {
                method: 'POST',
                body: JSON.stringify({ qrData }),
            });
            setResult(data);
        } catch (err) {
            setResult({
                valid: false,
                error: err instanceof Error ? err.message : 'Scan failed',
            });
        }
    };

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    return (
        <div className="scan-container">
            <h1 className="page-title">Scan Entry</h1>
            <p className="page-subtitle">Scan guest QR codes at venue entry</p>

            <div className="scan-box">
                <div id="qr-reader" className="scanner-area" style={{ display: scanning ? 'block' : 'none' }} />

                {!scanning && !result && (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <Camera size={64} color="var(--text-secondary)" />
                        <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>
                            Click button below to start scanning
                        </p>
                    </div>
                )}

                {!scanning && (
                    <button onClick={startScanner} className="btn btn-primary" style={{ marginTop: 16 }}>
                        <Camera size={18} /> Start Scanner
                    </button>
                )}

                {scanning && (
                    <button onClick={stopScanner} className="btn btn-outline" style={{ marginTop: 16 }}>
                        Stop Scanner
                    </button>
                )}
            </div>

            {result && (
                <div className={`scan-result ${result.valid ? 'scan-success' : 'scan-error'}`}>
                    <div className={`scan-result-icon ${result.valid ? 'success' : 'error'}`}>
                        {result.valid ? <CheckCircle size={32} color="white" /> : <XCircle size={32} color="white" />}
                    </div>

                    <h2 style={{ marginBottom: 8 }}>
                        {result.valid ? 'Entry Approved!' : 'Entry Denied'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {result.message || result.error}
                    </p>

                    {result.booking && (
                        <div className="guest-details">
                            <div className="guest-row">
                                <span className="guest-label">Guest Name</span>
                                <span className="guest-value">{result.booking.user.name}</span>
                            </div>
                            <div className="guest-row">
                                <span className="guest-label">Phone</span>
                                <span className="guest-value">{result.booking.user.phone}</span>
                            </div>
                            <div className="guest-row">
                                <span className="guest-label">Event</span>
                                <span className="guest-value">{result.booking.event.title}</span>
                            </div>
                            <div className="guest-row">
                                <span className="guest-label">Total Guests</span>
                                <span className="guest-value">{result.booking.totalGuests}</span>
                            </div>
                            {result.booking.couples > 0 && (
                                <div className="guest-row">
                                    <span className="guest-label">Couples</span>
                                    <span className="guest-value">{result.booking.couples}</span>
                                </div>
                            )}
                            {result.booking.ladies > 0 && (
                                <div className="guest-row">
                                    <span className="guest-label">Ladies</span>
                                    <span className="guest-value">{result.booking.ladies}</span>
                                </div>
                            )}
                            {result.booking.stags > 0 && (
                                <div className="guest-row">
                                    <span className="guest-label">Stags</span>
                                    <span className="guest-value">{result.booking.stags}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={() => setResult(null)} className="btn btn-primary" style={{ marginTop: 20 }}>
                        <RefreshCw size={18} /> Scan Next
                    </button>
                </div>
            )}
        </div>
    );
}
