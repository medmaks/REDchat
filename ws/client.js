const createWebSocketClient = wsClientFactory;
const wsClientA = createWebSocketClient(1);
const wsClientB = createWebSocketClient(2);
const wsClientC = createWebSocketClient(3);
const wsClientD = createWebSocketClient(3);

const crypto = require('crypto');
const readline = require('readline');
const net = require('net');

const { name: userName = "User", sessionId = "default-session", key: encryptionKey } = require('minimist')(process.argv.slice(2));

if (!encryptionKey) {
    console.error("[Error]: Please provide an encryption key using --key argument.");
    process.exit(1);
}

const encryptionConfig = {
    algorithm: 'aes-256-cbc',
    iv: crypto.randomBytes(16)
};

const encrypt = (text) => {
    const cipher = crypto.createCipheriv(encryptionConfig.algorithm, Buffer.from(encryptionKey, 'utf8'), encryptionConfig.iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return `${encryptionConfig.iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (encryptedText) => {
    const [ivHex, encryptedData] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv(encryptionConfig.algorithm, Buffer.from(encryptionKey, 'utf8'), Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
};

const chatClient = net.createConnection({ port: 3000 }, () => {
    console.log(`Successfully connected to the server as: ${userName}`);
    chatClient.write(JSON.stringify({ name: userName, sessionId }) + '\n');
});

chatClient.on('data', (data) => {
    try {
        console.log(`Server: ${decrypt(data.toString())}`);
    } catch (err) {
        console.error("[Error]: Decryption failed.", err);
    }
});

chatClient.on('end', () => {
    console.log('[Disconnected]: Server connection closed.');
});

const inputInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

inputInterface.on('line', (userInput) => {
    chatClient.write(encrypt(userInput) + '\n');
});
