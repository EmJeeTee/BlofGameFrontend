'use client';

import { useEffect, useState, useMemo } from 'react';

const CONFETTI_COLORS = ['#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e', '#00cec9', '#e17055', '#ff6b6b'];

function Confetti() {
    const confettiPieces = useMemo(() => {
        return Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            size: Math.random() * 8 + 6,
            rotation: Math.random() * 360,
        }));
    }, []);

    return (
        <div className="confetti-container">
            {confettiPieces.map(piece => (
                <div
                    key={piece.id}
                    className="confetti"
                    style={{
                        left: `${piece.left}%`,
                        animationDelay: `${piece.delay}s`,
                        width: piece.size,
                        height: piece.size,
                        background: piece.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        transform: `rotate(${piece.rotation}deg)`,
                    }}
                />
            ))}
        </div>
    );
}

export default function ResultScreen({ result, room, playerId, onPlayAgain, onGoHome }) {
    const [showConfetti, setShowConfetti] = useState(false);
    const isHost = room.hostId === playerId;

    // Oyuncu isimleri
    const getPlayerName = (id) => {
        return result.playerNames?.[id] || room.players.find(p => p.id === id)?.name || 'Bilinmeyen';
    };

    const isPlayerBluffer = result.bluffPlayerIds?.includes(playerId);

    // Kazanan belirleme
    let playerWon = false;
    if (result.winner === 'players') {
        playerWon = !isPlayerBluffer;
    } else if (result.winner === 'bluffer') {
        playerWon = isPlayerBluffer;
    }

    useEffect(() => {
        if (playerWon) {
            setShowConfetti(true);
            const timeout = setTimeout(() => setShowConfetti(false), 4000);
            return () => clearTimeout(timeout);
        }
    }, [playerWon]);

    return (
        <div className="container fade-in">
            {showConfetti && <Confetti />}

            <div className="logo" style={{ fontSize: '1.5rem', marginBottom: 32 }}>BLÖF</div>

            <div className="result-container">
                {/* Result Emoji */}
                <div className="result-emoji">
                    {result.winner === 'players' ? '🎉' :
                        result.winner === 'bluffer' ? '🎭' :
                            result.winner === 'nobody' ? '😇' :
                                result.winner === 'chaos' ? '🤯' : '🤔'}
                </div>

                {/* Result Title */}
                <div className={`result-title ${playerWon ? 'win' : 'lose'}`}>
                    {result.winner === 'nobody' ? 'Kimse Blöfçi Değildi!' :
                        result.winner === 'chaos' ? 'Kaos Modu!' :
                            playerWon ? 'Kazandın! 🏆' : 'Kaybettin! 😢'}
                </div>

                {/* Result Reason */}
                <div className="result-reason">
                    {result.reason}
                </div>

                {/* Word */}
                {result.word && (
                    <div className="result-word">
                        Kelime: <strong>{result.word}</strong>
                    </div>
                )}

                {/* Bluffer(s) reveal */}
                {result.bluffPlayerIds && result.bluffPlayerIds.length > 0 && result.winner !== 'chaos' && (
                    <div style={{ marginTop: 16, marginBottom: 24 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                            {result.bluffPlayerIds.length > 1 ? 'Blöfçüler:' : 'Blöfçü:'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                            {result.bluffPlayerIds.map(id => (
                                <div key={id} className="result-bluffer">
                                    🎭 {getPlayerName(id)}
                                    {id === playerId && ' (Sen)'}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All suspect mode: show everyone's words */}
                {result.playerWords && (
                    <div style={{ marginTop: 16, marginBottom: 24 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                            Herkesin Kelimesi:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(result.playerWords).map(([id, word]) => (
                                <div key={id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '8px 16px',
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.9rem'
                                }}>
                                    <span>{getPlayerName(id)}</span>
                                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{word}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vote Counts */}
                {result.voteCounts && Object.keys(result.voteCounts).length > 0 && (
                    <div style={{ marginTop: 16, marginBottom: 32 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                            Oylama Sonuçları:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {Object.entries(result.voteCounts)
                                .sort(([, a], [, b]) => b - a)
                                .map(([id, count]) => {
                                    const maxCount = Math.max(...Object.values(result.voteCounts));
                                    const isBluffer = result.bluffPlayerIds?.includes(id);
                                    return (
                                        <div key={id} style={{
                                            padding: '10px 16px',
                                            background: isBluffer ? 'rgba(255, 107, 107, 0.08)' : 'var(--bg-card)',
                                            border: isBluffer ? '1px solid rgba(255, 107, 107, 0.2)' : '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-sm)',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                                    {isBluffer && '🎭 '}{getPlayerName(id)}
                                                </span>
                                                <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{count} oy</span>
                                            </div>
                                            <div className="vote-count-bar">
                                                <div
                                                    className="vote-count-fill"
                                                    style={{
                                                        width: `${(count / maxCount) * 100}%`,
                                                        background: isBluffer ? 'var(--accent-red)' : 'var(--accent-primary)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
                {isHost && (
                    <button className="btn btn-primary" onClick={onPlayAgain}>
                        <span>🔄</span> Tekrar Oyna
                    </button>
                )}
                <button className="btn btn-secondary" onClick={onGoHome}>
                    <span>🏠</span> Ana Sayfaya Dön
                </button>
                {!isHost && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Masa sahibi tekrar oyna diyebilir
                    </div>
                )}
            </div>
        </div>
    );
}
