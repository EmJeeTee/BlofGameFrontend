'use client';

import { useState, useCallback } from 'react';

let SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
if (SOCKET_URL && !SOCKET_URL.startsWith('http')) {
    SOCKET_URL = `https://${SOCKET_URL}`;
}

export default function AdminPage() {
    const [adminKey, setAdminKey] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const fetchRooms = useCallback(async (key) => {
        setLoading(true);
        try {
            const res = await fetch(`${SOCKET_URL}/admin/rooms`, {
                headers: { 'x-admin-key': key || adminKey }
            });
            if (!res.ok) {
                if (res.status === 401) {
                    setLoggedIn(false);
                    showMessage('❌ Geçersiz admin anahtarı!');
                    return;
                }
                throw new Error('Sunucu hatası');
            }
            const data = await res.json();
            setRooms(data.rooms);
        } catch (err) {
            showMessage('❌ Bağlantı hatası: ' + err.message);
        }
        setLoading(false);
    }, [adminKey]);

    const handleLogin = () => {
        if (!adminKey.trim()) return;
        setLoggedIn(true);
        fetchRooms(adminKey);
    };

    const deleteRoom = async (code) => {
        if (!confirm(`${code} odasını silmek istediğinize emin misiniz?`)) return;
        try {
            const res = await fetch(`${SOCKET_URL}/admin/rooms/${code}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey }
            });
            const data = await res.json();
            if (data.success) {
                showMessage(`✅ ${code} silindi.`);
                fetchRooms();
            } else {
                showMessage(`❌ ${data.error}`);
            }
        } catch (err) {
            showMessage('❌ Hata: ' + err.message);
        }
    };

    const deleteAllRooms = async () => {
        if (!confirm('TÜM odaları silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`${SOCKET_URL}/admin/rooms`, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey }
            });
            const data = await res.json();
            if (data.success) {
                showMessage(`✅ ${data.message}`);
                fetchRooms();
            }
        } catch (err) {
            showMessage('❌ Hata: ' + err.message);
        }
    };

    const stateLabels = {
        lobby: '⏳ Lobi',
        playing: '🎮 Oyunda',
        voting: '🗳️ Oylama',
        revoting: '🔄 Tekrar Oylama',
        result: '📊 Sonuç'
    };

    // Login ekranı
    if (!loggedIn) {
        return (
            <div className="container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
                    <div className="logo" style={{ fontSize: '2rem', marginBottom: 8 }}>BLÖF</div>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Admin Panel</h2>

                    <input
                        type="password"
                        className="input-field"
                        placeholder="Admin anahtarını gir"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        style={{ marginBottom: 12 }}
                    />

                    {message && (
                        <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginBottom: 12 }}>{message}</div>
                    )}

                    <button className="btn btn-primary" onClick={handleLogin} disabled={!adminKey.trim()}>
                        <span>🔑</span> Giriş Yap
                    </button>
                </div>
            </div>
        );
    }

    // Admin paneli
    return (
        <div className="container fade-in">
            <div className="logo" style={{ fontSize: '1.5rem', marginBottom: 8 }}>BLÖF</div>
            <h2 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
                🔐 Admin Panel
            </h2>

            {message && (
                <div style={{
                    padding: '10px 16px',
                    background: 'rgba(108, 92, 231, 0.1)',
                    border: '1px solid rgba(108, 92, 231, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    marginBottom: 16
                }}>{message}</div>
            )}

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className="btn btn-secondary" onClick={() => fetchRooms()} disabled={loading}
                    style={{ flex: 1, padding: '10px' }}>
                    {loading ? '⏳' : '🔄'} Yenile
                </button>
                <button className="btn btn-danger" onClick={deleteAllRooms} disabled={rooms.length === 0}
                    style={{ flex: 1, padding: '10px' }}>
                    🗑️ Tümünü Sil ({rooms.length})
                </button>
            </div>

            {/* Room List */}
            {rooms.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: 40,
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                }}>
                    {loading ? 'Yükleniyor...' : 'Aktif masa yok.'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rooms.map(room => (
                        <div key={room.code} className="glass-card" style={{ padding: 16, marginBottom: 0 }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div>
                                    <span style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        letterSpacing: 3,
                                        color: 'var(--accent-secondary)'
                                    }}>{room.code}</span>
                                    <span style={{
                                        marginLeft: 10,
                                        fontSize: '0.75rem',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        background: room.state === 'lobby' ? 'rgba(253, 203, 110, 0.15)' : 'rgba(0, 184, 148, 0.15)',
                                        color: room.state === 'lobby' ? 'var(--accent-orange)' : 'var(--accent-green)'
                                    }}>
                                        {stateLabels[room.state] || room.state}
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteRoom(room.code)}
                                    style={{
                                        background: 'rgba(255, 107, 107, 0.1)',
                                        border: '1px solid rgba(255, 107, 107, 0.3)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--accent-red)',
                                        padding: '4px 12px',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        fontFamily: 'Inter, sans-serif',
                                        fontWeight: 600
                                    }}
                                >
                                    🗑️ Sil
                                </button>
                            </div>

                            {/* Info */}
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <span>👥 {room.playerCount}/{room.totalPlayers}</span>
                                <span>🎮 {room.mode === 'fun' ? 'Eğlence' : 'Standart'}</span>
                                <span>⏰ {room.ageMinutes} dk</span>
                            </div>

                            {/* Players */}
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {room.players.map((p, i) => (
                                    <span key={i} style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        background: p.connected ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                                        color: p.connected ? 'var(--accent-green)' : 'var(--accent-red)',
                                        border: `1px solid ${p.connected ? 'rgba(0, 184, 148, 0.2)' : 'rgba(255, 107, 107, 0.2)'}`,
                                    }}>
                                        {p.isHost ? '👑 ' : ''}{p.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Logout */}
            <button className="btn btn-secondary" onClick={() => { setLoggedIn(false); setAdminKey(''); }}
                style={{ marginTop: 24, padding: '10px' }}>
                🚪 Çıkış
            </button>
        </div>
    );
}
