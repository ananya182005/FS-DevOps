import { io } from 'socket.io-client';
// One shared socket instance for the whole app.
export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', { transports: ['websocket'], autoConnect: false });
