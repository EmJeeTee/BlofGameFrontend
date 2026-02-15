'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../hooks/useSocket';
import Lobby from '../../../components/Lobby';
import GameRound from '../../../components/GameRound';
import VotingScreen from '../../../components/VotingScreen';
import ResultScreen from '../../../components/ResultScreen';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.code;
    const { emit, on, isConnected } = useSocket();

    const [playerId, setPlayerId] = useState(null);
    const [room, setRoom] = useState(null);
    const [gameState, setGameState] = useState('lobby'); // lobby | playing | voting | revoting | result
    const [gameData, setGameData] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [voteProgress, setVoteProgress] = useState(null);
    const [isRevote, setIsRevote] = useState(false);
    const [notification, setNotification] = useState(null);
    const [skipVote, setSkipVote] = useState(null);

    const mountedRef = useRef(true);

    const [needsJoin, setNeedsJoin] = useState(false);
    const [joinName, setJoinName] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState('');

    // localStorage'dan playerId oku (sessionStorage yerine - tab kapatılsa bile hayatta kalır)
    useEffect(() => {
        const storedPlayerId = localStorage.getItem('blof_playerId');
        const storedRoomCode = localStorage.getItem('blof_roomCode');

        if (storedPlayerId && storedRoomCode === roomCode) {
            setPlayerId(storedPlayerId);
        } else {
            // Direkt URL ile geldiyse katılma formu göster
            setNeedsJoin(true);
        }

        return () => {
            mountedRef.current = false;
        };
    }, [roomCode]);

    // Direkt URL ile odaya katıl
    const handleDirectJoin = async () => {
        const name = joinName.trim();
        if (!name || name.length < 2) {
            setJoinError('İsim en az 2 karakter olmalı.');
            return;
        }
        setJoinLoading(true);
        setJoinError('');
        try {
            const response = await emit('join-room', { code: roomCode, playerName: name });
            if (response.success) {
                localStorage.setItem('blof_playerId', response.playerId);
                localStorage.setItem('blof_roomCode', response.roomCode);
                localStorage.setItem('blof_playerName', name);
                setPlayerId(response.playerId);
                setRoom(response.room);
                setNeedsJoin(false);

                // Oyun devam ediyorsa game state'i uygula
                if (response.gameState) {
                    setGameState('playing');
                    setGameData(response.gameState);
                }
            } else {
                setJoinError(response.error || 'Odaya katılamadı.');
            }
        } catch (err) {
            setJoinError('Bağlantı hatası. Tekrar deneyin.');
        }
        setJoinLoading(false);
    };

    // Odaya yeniden bağlan (sayfa geçişi/refresh sonrası)
    useEffect(() => {
        if (!playerId || !isConnected) return;

        const rejoin = async () => {
            try {
                const response = await emit('rejoin-room', { roomCode, playerId });
                if (response.success && mountedRef.current) {
                    setRoom(response.room);

                    // Oyun devam ediyorsa game state'i uygula
                    if (response.gameState) {
                        setGameState('playing');
                        setGameData(response.gameState);
                    } else if (response.room.state && response.room.state !== 'lobby') {
                        setGameState(response.room.state);
                    }
                } else if (!response.success) {
                    console.error('Rejoin hatası:', response.error);
                    // localStorage'ı temizle ve ana sayfaya yönlendir
                    localStorage.removeItem('blof_playerId');
                    localStorage.removeItem('blof_roomCode');
                    localStorage.removeItem('blof_playerName');
                    router.push('/');
                }
            } catch (err) {
                console.error('Rejoin hatası:', err);
            }
        };

        rejoin();
    }, [playerId, isConnected, roomCode, emit, router]);

    // Socket event listeners
    useEffect(() => {
        if (!playerId) return;

        const cleanups = [];

        // Oda güncellemesi
        cleanups.push(on('room-updated', ({ room: updatedRoom }) => {
            if (mountedRef.current) {
                setRoom(updatedRoom);
                if (updatedRoom.state === 'lobby') {
                    setGameState('lobby');
                    setGameData(null);
                    setGameResult(null);
                    setVoteProgress(null);
                    setIsRevote(false);
                    setSkipVote(null);
                }
            }
        }));

        // Oyun başladı
        cleanups.push(on('game-started', (data) => {
            if (mountedRef.current) {
                setGameState('playing');
                setGameData({
                    word: data.word,
                    isBluff: data.isBluff,
                    round: data.round,
                    totalRounds: data.totalRounds,
                    mode: data.mode
                });
                setSkipVote(null);
            }
        }));

        // Tur sonlandırıldı
        cleanups.push(on('round-ended', ({ nextState, round, totalRounds }) => {
            if (mountedRef.current) {
                if (nextState === 'voting') {
                    setGameState('voting');
                    setIsRevote(false);
                } else {
                    setGameData(prev => ({
                        ...prev,
                        round,
                        totalRounds
                    }));
                }
            }
        }));

        // Oy güncellendi
        cleanups.push(on('vote-update', (data) => {
            if (mountedRef.current) {
                setVoteProgress(data);
            }
        }));

        // Tekrar oylama
        cleanups.push(on('revote-needed', (data) => {
            if (mountedRef.current) {
                setGameState('voting');
                setIsRevote(true);
                setVoteProgress(null);
                setRoom(prev => ({
                    ...prev,
                    revoteEligible: data.tiedPlayers.map(p => p.id)
                }));
                showNotification(`Beraberlik! ${data.tiedPlayers.map(p => p.name).join(' ve ')} arasında tekrar oylama.`);
            }
        }));

        // Oyun sonucu
        cleanups.push(on('game-result', (data) => {
            if (mountedRef.current) {
                setGameState('result');
                setGameResult(data);
            }
        }));

        // Oyuncu ayrıldı
        cleanups.push(on('player-disconnected', ({ playerName }) => {
            if (mountedRef.current) {
                showNotification(`${playerName} bağlantısı koptu.`);
            }
        }));

        // Oyuncu tekrar bağlandı
        cleanups.push(on('player-reconnected', ({ playerName }) => {
            if (mountedRef.current) {
                showNotification(`${playerName} tekrar bağlandı! ✅`);
            }
        }));

        // Kelime değiştirme oylaması başladı
        cleanups.push(on('skip-word-vote-started', ({ requestedBy, votedCount, totalPlayers }) => {
            if (mountedRef.current) {
                const isRequester = requestedBy === playerId;
                setSkipVote({
                    active: true,
                    voted: isRequester, // Host otomatik oy verir
                    votedCount,
                    totalPlayers
                });
                if (!isRequester) {
                    showNotification('Kelime değiştirme oylaması başladı!');
                }
            }
        }));

        // Kelime değiştirme oy güncellendi
        cleanups.push(on('skip-word-vote-update', ({ votedCount, totalPlayers }) => {
            if (mountedRef.current) {
                setSkipVote(prev => prev ? { ...prev, votedCount, totalPlayers } : null);
            }
        }));

        // Kelime değiştirildi
        cleanups.push(on('word-changed', ({ word, isBluff, approved }) => {
            if (mountedRef.current) {
                setGameData(prev => ({
                    ...prev,
                    word,
                    isBluff
                }));
                setSkipVote(null);
                if (approved) {
                    showNotification('Kelime değiştirildi! 🔄');
                }
            }
        }));

        // Kelime değiştirme reddedildi
        cleanups.push(on('skip-word-rejected', ({ yesCount, noCount }) => {
            if (mountedRef.current) {
                setSkipVote(null);
                showNotification(`Kelime değiştirme reddedildi (${yesCount} evet, ${noCount} hayır)`);
            }
        }));

        // Oda kapandı
        cleanups.push(on('room-closed', ({ reason }) => {
            if (mountedRef.current) {
                showNotification(reason || 'Oda kapatıldı.');
                localStorage.removeItem('blof_playerId');
                localStorage.removeItem('blof_roomCode');
                localStorage.removeItem('blof_playerName');
                setTimeout(() => router.push('/'), 2000);
            }
        }));

        return () => {
            cleanups.forEach(cleanup => cleanup && cleanup());
        };
    }, [playerId, on]);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            if (mountedRef.current) setNotification(null);
        }, 3000);
    };

    // Oyunu başlat
    const handleStartGame = useCallback(async (mode, wordType) => {
        const response = await emit('start-game', { roomCode, mode, wordType });
        if (!response.success) {
            showNotification(response.error);
        }
    }, [emit, roomCode]);

    // Turu sonlandır
    const handleEndRound = useCallback(async () => {
        const response = await emit('end-round', { roomCode });
        if (!response.success) {
            showNotification(response.error);
        }
    }, [emit, roomCode]);

    // Oy ver
    const handleVote = useCallback(async (targetId) => {
        const response = await emit('submit-vote', { roomCode, targetId });
        if (!response.success) {
            showNotification(response.error);
        }
    }, [emit, roomCode]);

    // Tekrar oyna
    const handlePlayAgain = useCallback(async () => {
        const response = await emit('play-again', { roomCode });
        if (!response.success) {
            showNotification(response.error);
        }
    }, [emit, roomCode]);

    // Ana sayfaya dön
    const handleGoHome = useCallback(() => {
        localStorage.removeItem('blof_playerId');
        localStorage.removeItem('blof_roomCode');
        localStorage.removeItem('blof_playerName');
        router.push('/');
    }, [router]);

    // Kelime değiştirme isteği (host)
    const handleSkipWord = useCallback(async () => {
        const response = await emit('skip-word-request', { roomCode });
        if (!response.success) {
            showNotification(response.error);
        }
    }, [emit, roomCode]);

    // Kelime değiştirme oyu
    const handleSkipVote = useCallback(async (vote) => {
        setSkipVote(prev => prev ? { ...prev, voted: true } : null);
        const response = await emit('skip-word-vote', { roomCode, vote });
        if (!response.success) {
            showNotification(response.error);
        }
    }, [emit, roomCode]);

    // Direkt URL ile geldiyse katılma formu göster
    if (needsJoin) {
        return (
            <div className="container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
                    <div className="logo" style={{ fontSize: '2rem', marginBottom: 8 }}>BLÖF</div>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚪</div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Masaya Katıl</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                        Masa Kodu: <strong style={{ color: 'var(--accent-primary)' }}>{roomCode}</strong>
                    </p>

                    <input
                        type="text"
                        className="input-field"
                        placeholder="Adını gir"
                        value={joinName}
                        onChange={(e) => setJoinName(e.target.value)}
                        maxLength={15}
                        onKeyDown={(e) => e.key === 'Enter' && handleDirectJoin()}
                        style={{ marginBottom: 12 }}
                    />

                    {joinError && (
                        <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginBottom: 12 }}>{joinError}</div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleDirectJoin}
                        disabled={joinLoading || !joinName.trim()}
                    >
                        {joinLoading ? (
                            <><div className="loading-spinner" style={{ width: 18, height: 18 }} /> Katılınıyor...</>
                        ) : (
                            <><span>🎮</span> Katıl</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (!playerId || !room) {
        return (
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Yükleniyor...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Connection Status */}
            {!isConnected && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: '8px',
                    background: 'rgba(255, 107, 107, 0.9)',
                    color: 'white',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    zIndex: 1000
                }}>
                    Bağlantı koptu, yeniden bağlanıyor...
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '10px 20px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    zIndex: 1000,
                    animation: 'fadeIn 0.3s ease-out',
                    maxWidth: '90%',
                    textAlign: 'center'
                }}>
                    {notification}
                </div>
            )}

            {/* Render current state */}
            {gameState === 'lobby' && (
                <Lobby
                    room={room}
                    playerId={playerId}
                    onStartGame={handleStartGame}
                />
            )}

            {gameState === 'playing' && gameData && (
                <GameRound
                    gameData={gameData}
                    room={room}
                    playerId={playerId}
                    onEndRound={handleEndRound}
                    onSkipWord={handleSkipWord}
                    skipVote={skipVote}
                    onSkipVote={handleSkipVote}
                />
            )}

            {(gameState === 'voting') && (
                <VotingScreen
                    room={room}
                    playerId={playerId}
                    onVote={handleVote}
                    voteProgress={voteProgress}
                    isRevote={isRevote}
                />
            )}

            {gameState === 'result' && gameResult && (
                <ResultScreen
                    result={gameResult}
                    room={room}
                    playerId={playerId}
                    onPlayAgain={handlePlayAgain}
                    onGoHome={handleGoHome}
                />
            )}
        </>
    );
}
