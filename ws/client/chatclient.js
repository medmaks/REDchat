onst { WebSocket } = require('ws');

class ChatClient {
    constructor({ url, sessionId = null, username }) {
        this.socket = new WebSocket(url);
        this.sessionId = sessionId;
        this.username = username;
    }

    start() {
        this.socket.on('open', () => this.handleOpen());
        this.socket.on('message', (message) => this.handleMessage(message));
        this.socket.on('error', (err) => console.error('WebSocket error:', err));
    }

    handleOpen() {
        console.log('Connection established');
        this.socket.send(JSON.stringify({
            type: 'options',
            sessionId: this.sessionId,
            data: { username: this.username },
        }));
    }

    handleMessage(message) {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'message':
                this.displayMessage(data.data.sender, data.data.message);
                break;
            case 'options':
                this.updateSession(data);
                break;
            default:
                console.warn('Received unknown message type:', data.type);
        }
    }

    displayMessage(sender, message) {
        console.log(`${sender} >>: ${message}`);
    }

    updateSession(data) {
        this.sessionId = data.sessionId;
        console.log('Session ID updated:', this.sessionId);
    }

    sendMessage(content) {
        const message = {
            type: 'message',
            sessionId: this.sessionId,
            data: content,
        };
        this.socket.send(JSON.stringify(message));
    }
}

module.exports = { ChatClient };