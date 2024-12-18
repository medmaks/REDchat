const { WebSocket } = require('ws');
const readline = require('node:readline');
const { ChatClient } = require('./client/ChatClient');

const createWebSocketClient = (clientId) => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.on('error', (err) => console.error(err));

    socket.on('open', () => {
        console.log(`Client ${clientId} connected`);
        socket.send(`${clientId} says HELLO`);
    });

    socket.on('message', (message) => {
        console.log(`Client ${clientId} received: ${message}`);
    });

    return socket;
};

const sessionIdArgIndex = process.argv.indexOf('--sessionId');
const nameArgIndex = process.argv.indexOf('--name');

if (sessionIdArgIndex === -1 && nameArgIndex === -1) {
    console.error('Error: --sessionId or --name arguments are required');
    process.exit(1);
}

const sessionId = sessionIdArgIndex !== -1 ? process.argv[sessionIdArgIndex + 1] : null;
const username = nameArgIndex !== -1 ? process.argv[nameArgIndex + 1] : null;

initializeChat(username, sessionId);

function initializeChat(username, sessionId) {
    const chatClient = new ChatClient({ url: 'ws://localhost:8080', username, sessionId });

    chatClient.init();

    const chatInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    chatInterface.on('line', (input) => {
        if (input.trim().toLowerCase() === 'exit') {
            chatInterface.close();
        } else {
            chatClient.send(input);
        }
    });
}

const client1 = createWebSocketClient(1);
const client2 = createWebSocketClient(2);
const client3 = createWebSocketClient(3);
