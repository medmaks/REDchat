const { WebSocketServer, WebSocket } = require('ws');
const { Client } = require('./Client');

class ChatServer {
    server = null;
    clients = new Map();

    constructor({ port }) {
        this.port = port;
    }

    start() {
        this.server = new WebSocketServer({ port: this.port });

        this.server.on('connection', (socket) => this.handleConnection(socket));
        this.server.on('error', (err) => console.error('Server error:', err));

        console.log(`ChatServer is running on port ${this.port}`);
    }

    handleConnection(socket) {
        console.log('A new client connected');

        socket.on('message', (message) => this.processMessage(socket, message));
    }

    processMessage(socket, message) {
        const parsedMessage = JSON.parse(message.toString());
        console.log('Received:', parsedMessage);

        switch (parsedMessage.type) {
            case 'message':
                this.broadcastMessage(parsedMessage);
                break;
            case 'options':
                this.registerClient(socket, parsedMessage);
                break;
            default:
                console.warn('Unknown message type:', parsedMessage.type);
        }
    }

    registerClient(socket, parsedMessage) {
        const existingClient = this.clients.get(parsedMessage.sessionId);

        if (existingClient) {
            existingClient.updateWS(socket);
            console.log(`Client reconnected: ${existingClient.username}`);
            return;
        }

        const newClient = new Client({
            ws: socket,
            username: parsedMessage.data.username,
            sessionId: parsedMessage.sessionId,
        });

        this.clients.set(newClient.sessionId, newClient);
        console.log(`New client connected: ${newClient.username}`);
    }

    broadcastMessage(parsedMessage) {
        const sender = this.clients.get(parsedMessage.sessionId);

        if (!sender) {
            console.warn('Sender not found for sessionId:', parsedMessage.sessionId);
            return;
        }

        console.log('Broadcasting message from:', sender.username);

        this.clients.forEach((client) => {
            if (
                client.ws.readyState === WebSocket.OPEN &&
                client.sessionId !== parsedMessage.sessionId
            ) {
                client.send({
                    type: 'message',
                    data: {
                        sender: sender.username,
                        message: parsedMessage.data,
                    },
                });
            }
        });
    }
}

module.exports = { ChatServer };