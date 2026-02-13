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

    const mountedRef = useRef(true);

    // Session'dan playerId oku
    useEffect(() => {
        const storedPlayerId = sessionStorage.getItem('playerId');
        const storedRoomCode = sessionStorage.getItem('roomCode');

        if (storedPlayerId && storedRoomCode === roomCode) {
            setPlayerId(storedPlayerId);
        } else {
            // Direkt URL ile geldiyse ana sayfaya yönlendir
            router.push('/');
        }

        return () => {
            mountedRef.current = false;
        };
    }, [roomCode, router]);

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
                    twist: data.twist,
                    timerDuration: data.timerDuration,
                    silentRound: data.silentRound,
                    mode: data.mode
                });
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
    const handleStartGame = useCallback(async (mode) => {
        const response = await emit('start-game', { roomCode, mode });
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
        sessionStorage.clear();
        router.push('/');
    }, [router]);

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
