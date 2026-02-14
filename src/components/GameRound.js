'use client';

import { useState, useEffect } from 'react';

export default function GameRound({ gameData, room, playerId, onEndRound }) {
    const isHost = room.hostId === playerId;
    const { word, isBluff, round, totalRounds } = gameData;

    const [wordRevealed, setWordRevealed] = useState(false);

    // Kelimeyi kısa süre sonra göster (dramatik efekt)
    useEffect(() => {
        setWordRevealed(false);
        const timeout = setTimeout(() => setWordRevealed(true), 800);
        return () => clearTimeout(timeout);
    }, [round]);

    return (
        <div className="container fade-in">
            <div className="logo" style={{ fontSize: '1.5rem', marginBottom: 20 }}>BLÖF</div>

            {/* Round Indicator */}
            <div className="round-info">
                {Array.from({ length: totalRounds }, (_, i) => (
                    <div
                        key={i}
                        className={`round-dot ${i + 1 === round ? 'active' : ''} ${i + 1 < round ? 'completed' : ''}`}
                    />
                ))}
                <span className="round-text">Tur {round}/{totalRounds}</span>
            </div>

            {/* Word Display */}
            <div className="word-display">
                <div className="word-label">
                    {isBluff ? 'Senin Kartın' : 'Senin Kelimen'}
                </div>
                {wordRevealed ? (
                    <div className={`word-text ${isBluff ? 'is-bluff' : ''}`} style={{
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        {word}
                    </div>
                ) : (
                    <div style={{
                        fontSize: '3rem',
                        animation: 'spin 1s linear infinite',
                        display: 'inline-block'
                    }}>
                        🎴
                    </div>
                )}
                {isBluff && wordRevealed && (
                    <div style={{
                        marginTop: 12,
                        fontSize: '0.8rem',
                        color: 'var(--accent-red)',
                        fontWeight: 600,
                        opacity: 0.8
                    }}>
                        Sen blöfçüsün! Yakalanma! 🤫
                    </div>
                )}
            </div>

            {/* Host: End Round Button */}
            <div className="spacer" />

            {isHost && (
                <div style={{ marginTop: 'auto', paddingBottom: 20 }}>
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        marginBottom: 12
                    }}>
                        Herkes kelimesini anlattıktan sonra turu sonlandır
                    </div>
                    <button className="btn btn-orange" onClick={onEndRound}>
                        <span>⏭️</span>
                        {round >= totalRounds ? `${round}. Turu Sonlandır → Oylama` : `${round}. Turu Sonlandır`}
                    </button>
                </div>
            )}

            {!isHost && (
                <div style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    padding: '20px',
                    fontSize: '0.85rem',
                    marginTop: 'auto'
                }}>
                    {round >= totalRounds
                        ? 'Son tur! Masa sahibi turu sonlandırdıktan sonra oylama başlayacak.'
                        : 'Sıranı bekle ve kelimeni anlat!'}
                </div>
            )}
        </div>
    );
}
