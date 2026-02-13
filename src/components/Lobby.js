'use client';

import { useState } from 'react';
import PlayerCard from './PlayerCard';

export default function Lobby({ room, playerId, onStartGame }) {
    const [mode, setMode] = useState('standard');
    const [copied, setCopied] = useState(false);
    const isHost = room.hostId === playerId;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(room.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = room.code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/room/${room.code}`;
        const shareData = {
            title: 'Blöf Oyunu',
            text: `Blöf oyununa katıl! Masa kodu: ${room.code}`,
            url: shareUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            // Cancelled by user
        }
    };

    return (
        <div className="container fade-in">
            <div className="logo" style={{ fontSize: '1.8rem', marginBottom: 4 }}>BLÖF</div>
            <div className="logo-sub" style={{ marginBottom: 24, letterSpacing: 2, fontSize: '0.75rem' }}>Lobi</div>

            {/* Room Code */}
            <div className="room-code">
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>MASA KODU</div>
                    <div className="room-code-text">{room.code}</div>
                </div>
                <button className="room-code-copy" onClick={handleCopy}>
                    {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
                </button>
            </div>

            {/* Share Button */}
            <button className="btn btn-secondary" onClick={handleShare} style={{ marginBottom: 24 }}>
                <span>📤</span> Daveti Paylaş
            </button>

            {/* Players */}
            <div className="section-title">
                Oyuncular ({room.players.length})
            </div>
            <ul className="player-list">
                {room.players.map(player => (
                    <li key={player.id}>
                        <PlayerCard player={player} currentPlayerId={playerId} />
                    </li>
                ))}
            </ul>

            {/* Mode Selection (only for host) */}
            {isHost && (
                <>
                    <div className="section-title">Oyun Modu</div>
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${mode === 'standard' ? 'active' : ''}`}
                            onClick={() => setMode('standard')}
                        >
                            <span className="mode-emoji">🎯</span>
                            Standart
                        </button>
                        <button
                            className={`mode-btn ${mode === 'fun' ? 'active' : ''}`}
                            onClick={() => setMode('fun')}
                        >
                            <span className="mode-emoji">🎉</span>
                            Eğlence
                        </button>
                    </div>
                </>
            )}

            {/* Start Game (only for host) */}
            <div className="spacer" />
            {isHost ? (
                <button
                    className="btn btn-primary"
                    onClick={() => onStartGame(mode)}
                    disabled={room.players.length < 2}
                    style={{ marginTop: 16 }}
                >
                    <span>🚀</span>
                    {room.players.length < 2 ? 'En az 2 oyuncu gerekli' : 'Oyunu Başlat'}
                </button>
            ) : (
                <div style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    padding: '20px',
                    fontSize: '0.9rem'
                }}>
                    <span className="waiting-dots">Masa sahibi oyunu başlatacak</span>
                </div>
            )}
        </div>
    );
}
