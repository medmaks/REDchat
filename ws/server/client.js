const { randomUUID } = require('crypto');

class Client {
    constructor({ ws, username, sessionId = randomUUID() }) {
        this.ws = ws;
        this.username = username;
        this.sessionId = sessionId;

        this.sendInitialOptions();
    }

    sendInitialOptions() {
        const optionsMessage = {
            type: 'options',
            sessionId: this.sessionId,
            data: { username: this.username },
        };

        this.sendMessage(optionsMessage);
    }

    reconnect(ws) {
        this.ws.terminate(); // Закрыть старое соединение
        this.ws = ws; // Присвоить новое WebSocket соединение
    }

    sendMessage(message) {
        this.ws.send(JSON.stringify(message));
    }
}

module.exports = { Client };