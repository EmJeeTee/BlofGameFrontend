'use client';

import { useState, useEffect } from 'react';

export default function HomeScreen({ onCreateRoom, onJoinRoom }) {
    const [view, setView] = useState('main'); // main | create | join
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeSession, setActiveSession] = useState(null);

    // Aktif oturum kontrolü
    useEffect(() => {
        const storedRoomCode = localStorage.getItem('blof_roomCode');
        const storedPlayerName = localStorage.getItem('blof_playerName');
        if (storedRoomCode && storedPlayerName) {
            setActiveSession({ roomCode: storedRoomCode, playerName: storedPlayerName });
        }
    }, []);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Lütfen adınızı girin.');
            return;
        }
        if (name.trim().length > 20) {
            setError('İsim en fazla 20 karakter olabilir.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onCreateRoom(name.trim());
        } catch (err) {
            setError(err.message || 'Masa oluşturulamadı.');
        }
        setLoading(false);
    };

    const handleJoin = async () => {
        if (!name.trim()) {
            setError('Lütfen adınızı girin.');
            return;
        }
        if (!roomCode.trim()) {
            setError('Lütfen masa kodunu girin.');
            return;
        }
        if (name.trim().length > 20) {
            setError('İsim en fazla 20 karakter olabilir.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onJoinRoom(name.trim(), roomCode.trim().toUpperCase());
        } catch (err) {
            setError(err.message || 'Masaya katılamadı.');
        }
        setLoading(false);
    };

    if (view === 'main') {
        return (
            <div className="container fade-in">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="logo">BLÖF</div>
                    <div className="logo-sub">Kelime Oyunu</div>

                    <button className="btn btn-primary" onClick={() => setView('create')} style={{ marginBottom: 12 }}>
                        <span>🎲</span> Masa Kur
                    </button>

                    <button className="btn btn-secondary" onClick={() => setView('join')} style={{ marginBottom: 12 }}>
                        <span>🚪</span> Masaya Katıl
                    </button>

                    {activeSession && (
                        <button
                            className="btn btn-success"
                            onClick={() => window.location.href = `/room/${activeSession.roomCode}`}
                            style={{ marginBottom: 0 }}
                        >
                            <span>🔄</span> Devam Et ({activeSession.roomCode})
                        </button>
                    )}
                </div>

                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Arkadaşlarınla oyna • Blöfçüyü bul!
                </div>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div className="container fade-in">
                <button className="back-btn" onClick={() => { setView('main'); setError(''); }}>
                    ← Geri
                </button>

                <div className="logo" style={{ fontSize: '2rem', marginBottom: 8 }}>🎲</div>
                <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 32 }}>Masa Kur</h2>

                <div className="glass-card">
                    <div className="input-group">
                        <label>Adın</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="İsmini gir..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>

                    {error && (
                        <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: 16 }}>
                            {error}
                        </div>
                    )}

                    <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                        {loading ? <div className="loading-spinner" /> : 'Masayı Kur'}
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'join') {
        return (
            <div className="container fade-in">
                <button className="back-btn" onClick={() => { setView('main'); setError(''); }}>
                    ← Geri
                </button>

                <div className="logo" style={{ fontSize: '2rem', marginBottom: 8 }}>🚪</div>
                <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 32 }}>Masaya Katıl</h2>

                <div className="glass-card">
                    <div className="input-group">
                        <label>Adın</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="İsmini gir..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label>Masa Kodu</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="6 haneli kodu gir..."
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            style={{ textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center', fontWeight: 700, fontSize: '1.2rem' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        />
                    </div>

                    {error && (
                        <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: 16 }}>
                            {error}
                        </div>
                    )}

                    <button className="btn btn-success" onClick={handleJoin} disabled={loading}>
                        {loading ? <div className="loading-spinner" /> : 'Masaya Katıl'}
                    </button>
                </div>
            </div>
        );
    }
}
