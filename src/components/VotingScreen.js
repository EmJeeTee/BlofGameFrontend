'use client';

import { useState, useEffect } from 'react';

const AVATAR_COLORS = [
    '#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e', '#00cec9',
    '#e17055', '#0984e3', '#d63031', '#e84393', '#2d3436'
];

export default function VotingScreen({ room, playerId, onVote, voteProgress, isRevote }) {
    const [selectedId, setSelectedId] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);

    // Revote geldiğinde state'i sıfırla
    useEffect(() => {
        setHasVoted(false);
        setSelectedId(null);
    }, [isRevote]);

    const eligibleTargets = isRevote
        ? room.players.filter(p => room.revoteEligible?.includes(p.id))
        : room.players.filter(p => p.connected);

    const handleVote = (targetId) => {
        if (targetId === playerId) return;
        setSelectedId(targetId);
    };

    const handleConfirm = () => {
        if (!selectedId) return;
        onVote(selectedId);
        setHasVoted(true);
    };

    if (hasVoted) {
        return (
            <div className="container fade-in">
                <div className="logo" style={{ fontSize: '1.5rem', marginBottom: 20 }}>BLÖF</div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🗳️</div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 8, fontWeight: 700 }}>Oyun Verildi!</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <span className="waiting-dots">Diğer oyuncuların oy vermesi bekleniyor</span>
                    </p>

                    {voteProgress && (
                        <div className="vote-progress" style={{ width: '100%', marginTop: 24 }}>
                            <div>{voteProgress.votedCount} / {voteProgress.totalPlayers} oy verildi</div>
                            <div className="vote-progress-bar">
                                <div
                                    className="vote-progress-fill"
                                    style={{ width: `${(voteProgress.votedCount / voteProgress.totalPlayers) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in">
            <div className="logo" style={{ fontSize: '1.5rem', marginBottom: 20 }}>BLÖF</div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
                    {isRevote ? '🔄' : '🗳️'}
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>
                    {isRevote ? 'Tekrar Oylama!' : 'Oylama Zamanı!'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {isRevote
                        ? 'Beraberlik oldu! Sadece berabere kalan oyuncular arasında oy verin.'
                        : 'Blöf yapan kişiyi seç!'}
                </p>
            </div>

            <div className="section-title">Oyuncular</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {eligibleTargets.map(player => {
                    const isSelf = player.id === playerId;
                    const isSelected = selectedId === player.id;
                    const colorIndex = player.name.charCodeAt(0) % AVATAR_COLORS.length;
                    const avatarColor = AVATAR_COLORS[colorIndex];

                    return (
                        <div
                            key={player.id}
                            className={`vote-card ${isSelected ? 'selected' : ''} ${isSelf ? 'disabled' : ''}`}
                            onClick={() => !isSelf && handleVote(player.id)}
                        >
                            <div className="player-avatar" style={{ background: avatarColor }}>
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="player-name">{player.name}</span>
                            {isSelf && <span className="player-badge badge-you">Sen</span>}
                        </div>
                    );
                })}
            </div>

            <div className="spacer" />

            <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={!selectedId}
                style={{ marginTop: 'auto' }}
            >
                <span>✅</span>
                {selectedId
                    ? `${eligibleTargets.find(p => p.id === selectedId)?.name}'e Oy Ver`
                    : 'Bir oyuncu seç'}
            </button>
        </div>
    );
}
