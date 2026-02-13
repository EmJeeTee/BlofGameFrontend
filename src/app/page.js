'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HomeScreen from '../components/HomeScreen';
import { useSocket } from '../hooks/useSocket';

export default function Home() {
    const { emit, isConnected } = useSocket();
    const router = useRouter();

    const handleCreateRoom = useCallback(async (name) => {
        const response = await emit('create-room', { hostName: name });
        if (response.success) {
            // Session'a bilgileri kaydet
            sessionStorage.setItem('playerId', response.playerId);
            sessionStorage.setItem('playerName', name);
            sessionStorage.setItem('roomCode', response.roomCode);
            router.push(`/room/${response.roomCode}`);
        } else {
            throw new Error(response.error);
        }
    }, [emit, router]);

    const handleJoinRoom = useCallback(async (name, code) => {
        const response = await emit('join-room', { code, playerName: name });
        if (response.success) {
            sessionStorage.setItem('playerId', response.playerId);
            sessionStorage.setItem('playerName', name);
            sessionStorage.setItem('roomCode', response.roomCode);
            router.push(`/room/${response.roomCode}`);
        } else {
            throw new Error(response.error);
        }
    }, [emit, router]);

    return (
        <>
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
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    Sunucuya bağlanıyor...
                </div>
            )}
            <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
        </>
    );
}
