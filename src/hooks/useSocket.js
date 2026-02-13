'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket';

export function useSocket() {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = connectSocket();
        socketRef.current = socket;

        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        if (socket.connected) {
            setIsConnected(true);
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    const emit = useCallback((event, data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) {
                reject(new Error('Socket bağlantısı yok'));
                return;
            }
            socketRef.current.emit(event, data, (response) => {
                resolve(response);
            });
        });
    }, []);

    const on = useCallback((event, handler) => {
        if (socketRef.current) {
            socketRef.current.on(event, handler);
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.off(event, handler);
            }
        };
    }, []);

    const off = useCallback((event, handler) => {
        if (socketRef.current) {
            socketRef.current.off(event, handler);
        }
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        emit,
        on,
        off,
        disconnect: disconnectSocket
    };
}
