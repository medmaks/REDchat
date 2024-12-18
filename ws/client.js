const net = require('net');
const crypto = require('crypto');
const readline = require('readline');
const { name: userName = "User", sessionId = "default-session", key: encryptionKey, text: inputText } = require('minimist')(process.argv.slice(2));

if (!encryptionKey) {
    console.error("[Error]: Please provide an encryption key using --key argument.");
    process.exit(1);
}

const ALGORITHM = 'aes-256-cbc';

const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(encryptionKey, 'utf8'), iv);
    return `${iv.toString('hex')}:${Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('hex')}`;
};

const decrypt = (encryptedText) => {
    const [ivHex, encryptedData] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(encryptionKey, 'utf8'), Buffer.from(ivHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]).toString('utf8');
};

const chatClient = net.createConnection({ port: 3000 }, () => {
    console.log(`Connected as: ${userName}`);
    chatClient.write(JSON.stringify({ name: userName, sessionId }) + '\n');

    if (inputText) {
        try {
            const encryptedText = encrypt(inputText);
            chatClient.write(encryptedText + '\n');
            console.log(`[Encrypted Sent]: ${encryptedText}`);
        } catch {
            console.error("[Error]: Failed to encrypt and send the provided text.");
        }
    }
});

chatClient.on('data', (data) => {
    try {
        console.log(`Server: ${decrypt(data.toString().trim())}`);
    } catch {
        console.error("[Error]: Failed to decrypt message.");
    }
});

chatClient.on('end', () => console.log('[Disconnected]: Connection closed.'));
chatClient.on('error', (err) => console.error(`[Error]: ${err.message}`));

readline.createInterface({ input: process.stdin, output: process.stdout })
    .on('line', (userInput) => {
        try {
            chatClient.write(encrypt(userInput) + '\n');
        } catch {
            console.error("[Error]: Failed to send message.");
        }
    });

    