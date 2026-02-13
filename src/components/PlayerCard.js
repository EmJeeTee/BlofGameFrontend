'use client';

import { useState } from 'react';

const AVATAR_COLORS = [
    '#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e', '#00cec9',
    '#e17055', '#0984e3', '#d63031', '#e84393', '#2d3436'
];

export default function PlayerCard({ player, currentPlayerId, onClick, showVoteCount, voteCount, totalVotes, isVotable }) {
    const isSelf = player.id === currentPlayerId;
    const colorIndex = player.name.charCodeAt(0) % AVATAR_COLORS.length;
    const avatarColor = AVATAR_COLORS[colorIndex];
    const initial = player.name.charAt(0).toUpperCase();

    const cardClass = `${onClick ? 'vote-card' : 'player-item'} ${isSelf ? 'is-self' : ''} ${isVotable === false ? 'disabled' : ''}`;

    return (
        <div className={cardClass} onClick={isVotable !== false ? onClick : undefined}>
            <div className="player-avatar" style={{ background: avatarColor }}>
                {initial}
            </div>
            <span className="player-name">{player.name}</span>
            {player.isHost && (
                <span className="player-badge badge-host">👑 Host</span>
            )}
            {isSelf && !player.isHost && (
                <span className="player-badge badge-you">Sen</span>
            )}
            {isSelf && player.isHost && (
                <span className="player-badge badge-you">Sen</span>
            )}
            {showVoteCount && (
                <span style={{
                    fontWeight: 700,
                    color: 'var(--accent-secondary)',
                    fontSize: '1.1rem'
                }}>
                    {voteCount || 0}
                </span>
            )}
            {showVoteCount && totalVotes > 0 && (
                <div className="vote-count-bar" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 0 }}>
                    <div className="vote-count-fill" style={{ width: `${((voteCount || 0) / totalVotes) * 100}%` }} />
                </div>
            )}
        </div>
    );
}
