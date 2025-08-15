import { useAuthStore } from '@/store/useAuthStore';

class WebSocketService {
    private socket: WebSocket | null = null;
    private onMessageCallback: ((data: any) => void) | null = null;

    connect(onOpen: () => void, onClose: () => void) {
        // Prevent multiple connections
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket is already connected.');
            return;
        }

        const token = useAuthStore.getState().token;
        if (!token) {
            console.error('WebSocket connection failed: No auth token found.');
            return;
        }
        
        // We'll assume the token is passed as a query parameter for connection
        // This is a common pattern. If the backend expects it differently, we can change this.
        this.socket = new WebSocket(`wss://model.medlead.ir/api/v1/chat?token=${token}`);

        this.socket.onopen = () => {
            console.log('WebSocket connected successfully.');
            onOpen();
        };

        this.socket.onmessage = (event) => {
            if (this.onMessageCallback) {
                // We assume the server sends JSON data.
                // e.g., { "chunk": "hello", "is_final": false }
                this.onMessageCallback(JSON.parse(event.data));
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected.');
            onClose();
            this.socket = null;
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    sendMessage(message: object) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('Cannot send message: WebSocket is not connected.');
        }
    }

    onMessage(callback: (data: any) => void) {
        this.onMessageCallback = callback;
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Export a singleton instance of the service
export const webSocketService = new WebSocketService();