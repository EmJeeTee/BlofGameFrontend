'use client';

import { useState, useEffect, useRef } from 'react';

export default function GameRound({ gameData, room, playerId, onEndRound, onSkipWord, skipVote, onSkipVote }) {
    const isHost = room.hostId === playerId;
    const { word, isBluff, round, totalRounds } = gameData;

    const [wordRevealed, setWordRevealed] = useState(false);
    const isFirstRender = useRef(true);

    // Kelimeyi kısa süre sonra göster - sadece ilk render'da animasyon
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            const timeout = setTimeout(() => setWordRevealed(true), 800);
            return () => clearTimeout(timeout);
        }
        // Sonraki turlarda direkt göster (kelime aynı, hourglass gereksiz)
    }, [round]);

    // Kelime değiştiğinde (skip sonrası) yeniden animate et
    useEffect(() => {
        setWordRevealed(false);
        const timeout = setTimeout(() => setWordRevealed(true), 500);
        return () => clearTimeout(timeout);
    }, [word]);

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

            {/* Skip Word Vote Modal */}
            {skipVote && skipVote.active && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '28px 24px',
                        maxWidth: 320,
                        width: '90%',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔄</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
                            Kelime Değiştirilsin mi?
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                            Masa sahibi kelimeyi değiştirmek istiyor. Kabul ediyor musun?
                        </p>

                        {skipVote.voted ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <span className="waiting-dots">Diğer oyuncular bekleniyor</span>
                                <div style={{ marginTop: 8, fontSize: '0.8rem' }}>
                                    {skipVote.votedCount} / {skipVote.totalPlayers} oy verildi
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => onSkipVote(true)}
                                >
                                    ✅ Evet
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => onSkipVote(false)}
                                >
                                    ❌ Hayır
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                    <button
                        className="btn btn-secondary"
                        onClick={onSkipWord}
                        style={{ marginTop: 8 }}
                        disabled={skipVote?.active}
                    >
                        <span>🔄</span>
                        Kelimeyi Değiştir
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
