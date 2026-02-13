import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
    if (!socket) {
        const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        socket = io(url, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['websocket', 'polling']
        });
    }
    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
    return s;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
