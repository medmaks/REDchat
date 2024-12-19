const net = require('net');
const crypto = require('crypto');
const readline = require('readline');
const { name: userName = "User", sessionId = "default-session", key: encryptionKey, text: inputText } = require('minimist')(process.argv.slice(2));

// Проверка длины ключа
if (!encryptionKey || encryptionKey.length !== 32) {
    console.error("[Error]: Please provide a 32-byte encryption key using --key argument.");
    process.exit(1);
}

const ALGORITHM = 'aes-256-cbc';

// Функция для шифрования
const encrypt = (text) => {
    const iv = crypto.randomBytes(16); // Генерация вектора инициализации
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(encryptionKey, 'utf8'), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

// Функция для расшифровки
const decrypt = (encryptedText) => {
    const [ivHex, encryptedData] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(encryptionKey, 'utf8'), Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
};

// Подключение клиента
const chatClient = net.createConnection({ port: 3000 }, () => {
    console.log(`Connected as: ${userName}`);
    chatClient.write(JSON.stringify({ name: userName, sessionId }) + '\n');

    // Если передан текст через --text, отправляем его
    if (inputText) {
        try {
            const encryptedText = encrypt(inputText);
            chatClient.write(encryptedText + '\n');
            console.log(`[Encrypted Sent]: ${encryptedText}`);
        } catch (err) {
            console.error("[Error]: Failed to encrypt and send the provided text.", err);
        }
    }
});

// Обработка входящих сообщений
chatClient.on('data', (data) => {
    try {
        console.log(`Server: ${decrypt(data.toString().trim())}`);
    } catch (err) {
        console.error("[Error]: Failed to decrypt message.", err);
    }
});

// Обработка отключения и ошибок
chatClient.on('end', () => console.log('[Disconnected]: Connection closed.'));
chatClient.on('error', (err) => console.error(`[Error]: ${err.message}`));

// Чтение пользовательского ввода
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (userInput) => {
    try {
        const encryptedInput = encrypt(userInput);
        chatClient.write(encryptedInput + '\n');
    } catch (err) {
        console.error("[Error]: Failed to send message.", err);
    }
});

